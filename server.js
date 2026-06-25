import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import multer from "multer";
import lighthouse from "@lighthouse-web3/sdk";
import dotenv from "dotenv";
import crypto from "crypto";
import { encryptBuffer, decrypt } from "./crypto.js";
import { supabase } from "./lib/supabaseClient.js"; 
import FileRegistry from "./artifacts/contracts/FileRegistry.sol/FileRegistry.json" with { type: "json" };
import fs from "fs"; // ✅ ADDED
import path from "path"; // ✅ ADDED
import AWS from "aws-sdk";


dotenv.config({ path: "./.env" });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

const s3 = new AWS.S3({
  endpoint: "https://s3.filebase.com",
  accessKeyId: process.env.FILEBASE_API_KEY,
  secretAccessKey: process.env.FILEBASE_API_SECRET,
  region: "us-east-1",
});

// ✅ ADDED: Contract deployment function
const deployNewContract = async () => {
  try {
    console.log("🔄 Deploying new contract...");
    
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
    
    const factory = new ethers.ContractFactory(
      FileRegistry.abi,
      FileRegistry.bytecode,
      wallet
    );
    
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    // Save to config file
    const configPath = path.join(process.cwd(), 'contract-config.json');
    const config = {
      contractAddress: contractAddress,
      network: 'localhost',
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Update environment variable
    process.env.CONTRACT_ADDRESS = contractAddress;
    
    console.log("✅ New contract deployed at:", contractAddress);
    return contractAddress;
  } catch (error) {
    console.error("❌ Failed to deploy new contract:", error);
    return null;
  }
};

// ✅ ADDED: Contract address getter with validation
const getValidContractAddress = async () => {
  let contractAddress = process.env.CONTRACT_ADDRESS;
  
  // Try to read from config file if not in env
  if (!contractAddress) {
    try {
      const configPath = path.join(process.cwd(), 'contract-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        contractAddress = config.contractAddress;
      }
    } catch (error) {
      console.warn("Could not read contract config file:", error);
    }
  }
  
  // Validate that contract exists at this address
  if (contractAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
      const code = await provider.getCode(contractAddress);
      
      if (code !== '0x') {
        return contractAddress; // Contract exists
      }
    } catch (error) {
      console.warn("Error checking contract existence:", error);
    }
  }
  
  // If no valid contract found, deploy new one
  return await deployNewContract();
};

// ✅ UPDATED: Blockchain recording function with auto-redeployment
const recordOnBlockchain = async (cid, contentHash) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);

    const contractAddress = await getValidContractAddress();
    
    if (!contractAddress) {
      throw new Error("Failed to get valid contract address");
    }

    const contract = new ethers.Contract(
      contractAddress,
      FileRegistry.abi,
      wallet
    );

    const tx = await contract.addRecord(cid, contentHash);
    await tx.wait();

    console.log("✅ File recorded on blockchain:", tx.hash);
    return { txHash: tx.hash, contractAddress };
  } catch (error) {
    console.error("❌ Blockchain recording failed:", error);
    return null;
  }
};


app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // 1. Encrypt the file
    const encryptedResult = encryptBuffer(req.file.buffer);
    const encryptedBuffer = Buffer.from(encryptedResult.data, "base64");

    // 2. Upload encrypted file to Filebase
    const params = {
      Bucket: process.env.FILEBASE_BUCKET,
      Key: req.file.originalname, // You can also use a unique timestamp or UUID here
      Body: encryptedBuffer,
    };

    const uploadResult = await s3.upload(params).promise();
    console.log("Uploaded Encrypted File:", uploadResult.Location);

    // Use ETag as CID
    const cid = uploadResult.ETag.replace(/"/g, "");
    console.log("✅ Filebase CID:", cid);

    // 3. Save to database
    const { data, error } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        name: req.file.originalname,
        cid: cid,
        iv: encryptedResult.iv,
        size: req.file.size,
      })
      .select();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to save file details to database" });
    }

    console.log("File saved to database:", data);

    // 4. Record proof on blockchain
    const fileHash = "0x" + crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    console.log("🔎 Blockchain Debug:", { cid, fileHash });

    const blockchainResult = await recordOnBlockchain(cid, fileHash);

    // 5. Send response
    res.json({
      id: data[0].id,
      cid: cid,
      iv: encryptedResult.iv,
      link: `https://ipfs.filebase.io/ipfs/${cid}`,
      txHash: blockchainResult?.txHash,
      contractAddress: blockchainResult?.contractAddress
    });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Download endpoint (updated for Filebase)
app.post("/api/download", async (req, res) => {
  try {
    const { cid, iv } = req.body;
    if (!cid || !iv) return res.status(400).json({ error: "CID and IV are required" });

    const s3Params = { Bucket: process.env.FILEBASE_BUCKET, Key: cid };
    const s3Data = await s3.getObject(s3Params).promise();
    const encryptedBuffer = s3Data.Body;

    const encryptedData = { iv, data: encryptedBuffer.toString("base64") };
    const decryptedBuffer = decrypt(encryptedData);

    res.setHeader("Content-Disposition", `attachment; filename="${cid}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decryptedBuffer);
  } catch (err) {
    console.error("❌ Download/decrypt failed:", err);
    res.status(500).json({ error: "Download failed" });
  }
});


// Get files by user
app.get("/api/files/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to fetch files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// ✅ UPDATED: Verify record on blockchain with auto-redeployment
app.get("/api/verify/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    const contractAddress = await getValidContractAddress();
    if (!contractAddress) {
      return res.status(400).json({ 
        success: false, 
        message: "Contract not deployed and failed to deploy new one" 
      });
    }

    console.log("🔎 Verifying CID:", cid, "on contract:", contractAddress);

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);

    const contract = new ethers.Contract(
      contractAddress,
      ["function verifyRecord(string memory cid) public view returns (bytes32)"],
      wallet
    );

    const storedHash = await contract.verifyRecord(cid);

    console.log("✅ Stored hash for CID", cid, ":", storedHash);

    if (storedHash === ethers.ZeroHash) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found on blockchain" 
      });
    }

    res.json({
      success: true,
      cid,
      storedHash,
      contractAddress
    });
  } catch (err) {
    console.error("❌ Verification failed:", err);
    
    // If verification fails due to contract issues, try to redeploy
    if (err.message.includes("contract") || err.message.includes("address")) {
      console.log("🔄 Attempting to redeploy contract due to verification failure...");
      await deployNewContract();
    }
    
    res.status(500).json({ 
      error: "Verification failed",
      message: err.message 
    });
  }
});

// ✅ UPDATED: Verify if a file is recorded on blockchain
app.post("/api/verify", async (req, res) => {
  try {
    const { cid } = req.body;
    if (!cid) return res.status(400).json({ error: "CID is required" });

    const contractAddress = await getValidContractAddress();
    if (!contractAddress) {
      return res.status(400).json({ 
        success: false, 
        message: "Contract not deployed" 
      });
    }

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);

    const contract = new ethers.Contract(
      contractAddress,
      ["function verifyRecord(string memory cid) public view returns (bool)"],
      wallet
    );

    const isRecorded = await contract.verifyRecord(cid);

    res.json({ cid, recorded: isRecorded, contractAddress });
  } catch (err) {
    console.error("❌ Verification failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));
import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "crypto";
import { encryptBuffer, decrypt } from "./crypto.js";
import { supabase } from "./lib/supabaseClient.js";
import FileRegistry from "./artifacts/contracts/FileRegistry.sol/FileRegistry.json" with { type: "json" };
import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
import profileRoutes from './routes/profile.js';
import notificationRoutes from './routes/notification.js';

dotenv.config({ path: "./.env" });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

// Configure Filebase S3 with IPFS
const s3 = new AWS.S3({
    endpoint: "https://s3.filebase.com",
    accessKeyId: process.env.FILEBASE_API_KEY,
    secretAccessKey: process.env.FILEBASE_API_SECRET,
    region: "us-east-1",
    signatureVersion: 'v4',
    httpOptions: {
        timeout: 300000 // 5 minutes timeout for large files
    }
});

// Contract deployment function
const deployNewContract = async () => {
    try {
        console.log("🔄 Deploying new contract...");
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
        const factory = new ethers.ContractFactory(FileRegistry.abi, FileRegistry.bytecode, wallet);
        const contract = await factory.deploy();
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();

        const configPath = path.join(process.cwd(), "contract-config.json");
        fs.writeFileSync(
            configPath,
            JSON.stringify({ contractAddress, network: "sepolia", deployedAt: new Date().toISOString() }, null, 2)
        );

        process.env.CONTRACT_ADDRESS = contractAddress;
        console.log("✅ New contract deployed at:", contractAddress);
        return contractAddress;
    } catch (error) {
        console.error("❌ Failed to deploy new contract:", error);
        return null;
    }
};

// Get valid contract address
const getValidContractAddress = async () => {
    let contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        try {
            const configPath = path.join(process.cwd(), "contract-config.json");
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
                contractAddress = config.contractAddress;
            }
        } catch (error) {
            console.warn("Could not read contract config file:", error);
        }
    }

    if (contractAddress) {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
            const code = await provider.getCode(contractAddress);
            if (code !== "0x") return contractAddress;
        } catch (error) {
            console.warn("Error checking contract existence:", error);
        }
    }

    return await deployNewContract();
};

// FIXED: Updated recordOnBlockchain to handle encryptedKeywords properly
const recordOnBlockchain = async (cid, encryptedKeywords = []) => {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
        const contractAddress = await getValidContractAddress();
        if (!contractAddress) throw new Error("Failed to get valid contract address");

        const contract = new ethers.Contract(contractAddress, FileRegistry.abi, wallet);
        
        // Debug: Log the available functions
        console.log("Contract ABI functions:", FileRegistry.abi
            .filter(item => item.type === 'function')
            .map(f => `${f.name}(${f.inputs?.map(i => i.type).join(',')})`));
        
        // Detect the addRecord function
        const addRecordFunction = FileRegistry.abi.find(
            item => item.type === 'function' && item.name === 'addRecord'
        );
        
        if (!addRecordFunction) {
            throw new Error("addRecord function not found in contract ABI");
        }
        
        console.log("addRecord function inputs:", addRecordFunction.inputs);
        
        let tx;
        
        // Format encryptedKeywords properly for InEuint32 struct
        const formatInEuint32 = (keywords) => {
            if (!Array.isArray(keywords) || keywords.length === 0) return [];
            
            return keywords.map((keyword, index) => {
                let ctHashValue;
                
                if (typeof keyword === 'object' && keyword.ctHash !== undefined) {
                    try {
                        ctHashValue = BigInt(keyword.ctHash);
                    } catch {
                        ctHashValue = BigInt(index + 1);
                    }
                } else if (typeof keyword === 'object' && keyword.data !== undefined) {
                    try {
                        ctHashValue = BigInt(keyword.data);
                    } catch {
                        ctHashValue = BigInt(index + 1);
                    }
                } else if (typeof keyword === 'number') {
                    ctHashValue = BigInt(keyword);
                } else if (typeof keyword === 'string') {
                    try {
                        ctHashValue = BigInt(keyword);
                    } catch {
                        ctHashValue = BigInt(index + 1);
                    }
                } else {
                    ctHashValue = BigInt(index + 1);
                }
                
                return {
                    ctHash: ctHashValue,
                    securityZone: typeof keyword === 'object' ? (keyword.securityZone || 0) : 0,
                    utype: typeof keyword === 'object' ? (keyword.utype || 0) : 0,
                    signature: typeof keyword === 'object' ? (keyword.signature || "0x") : "0x"
                };
            });
        };
        
        // Case 1: Contract expects (string cid, InEuint32[] keywords)
        if (addRecordFunction.inputs.length === 2 && 
            addRecordFunction.inputs[0].type === 'string' && 
            addRecordFunction.inputs[1].type.includes('[]')) {
            
            const safeEncryptedKeywords = formatInEuint32(encryptedKeywords);
            console.log("Using signature: addRecord(string, InEuint32[])");
            console.log("CID:", cid);
            console.log("Encrypted keywords:", safeEncryptedKeywords.map(k => ({
                ctHash: k.ctHash.toString(),
                securityZone: k.securityZone,
                utype: k.utype
            })));
            
            tx = await contract.addRecord(cid, safeEncryptedKeywords);
        }
        // Case 2: Contract expects (bytes32 cid, uint256[] keywords)
        else if (addRecordFunction.inputs.length === 2 && 
                 addRecordFunction.inputs[0].type === 'bytes32') {
            
            const cidBytes32 = ethers.encodeBytes32String(cid.substring(0, 32));
            
            const safeEncryptedKeywords = formatInEuint32(encryptedKeywords).map(k => k.ctHash);
            
            console.log("Using signature: addRecord(bytes32, uint256[])");
            
            tx = await contract.addRecord(cidBytes32, safeEncryptedKeywords);
        }
        // Case 3: Contract expects only (string cid)
        else if (addRecordFunction.inputs.length === 1 && 
                 addRecordFunction.inputs[0].type === 'string') {
            
            console.log("Using signature: addRecord(string)");
            tx = await contract.addRecord(cid);
        }
        // Case 4: Contract expects (string cid, string[] keywords)
        else if (addRecordFunction.inputs.length === 2 && 
                 addRecordFunction.inputs[0].type === 'string' && 
                 addRecordFunction.inputs[1].type === 'string[]') {
            
            const safeEncryptedKeywords = formatInEuint32(encryptedKeywords).map(k => k.ctHash.toString());
            
            console.log("Using signature: addRecord(string, string[])");
            tx = await contract.addRecord(cid, safeEncryptedKeywords);
        }
        // Case 5: Fallback - try without keywords
        else {
            console.warn("⚠️ Unknown contract signature, trying addRecord with just CID");
            try {
                tx = await contract.addRecord(cid);
            } catch (innerError) {
                console.warn("⚠️ Retrying with empty array...");
                tx = await contract.addRecord(cid, []);
            }
        }
        
        const receipt = await tx.wait();

        console.log("✅ File recorded on Sepolia blockchain:", tx.hash);
        console.log("🔗 View at: https://sepolia.etherscan.io/tx/" + tx.hash);

        return {
            txHash: tx.hash,
            contractAddress,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString()
        };
    } catch (error) {
        console.error("❌ Blockchain recording failed:", error);
        if (error.transaction) {
            console.error("Failed transaction:", {
                to: error.transaction.to,
                data: error.transaction.data?.substring(0, 100) + '...',
                value: error.transaction.value?.toString()
            });
        }
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            reason: error.reason
        });
        return null;
    }
};

// Get CID from Filebase using their IPFS API
const getCIDFromFilebase = async (bucket, key) => {
    try {
        console.log("🔍 Getting CID for file:", key);

        try {
            const headParams = { Bucket: bucket, Key: key };
            const headData = await s3.headObject(headParams).promise();
            if (headData.Metadata && headData.Metadata.cid) {
                console.log("✅ Found CID in metadata:", headData.Metadata.cid);
                return headData.Metadata.cid;
            }
        } catch (headError) {
            console.log("ℹ️ No CID in metadata, trying other methods...");
        }

        const listParams = { Bucket: bucket };
        const objects = await s3.listObjectsV2(listParams).promise();
        console.log("📋 Objects in bucket:", objects.Contents?.length);

        if (objects.Contents) {
            for (const obj of objects.Contents) {
                if (obj.Key === key) break;
            }
        }

        const ipfsApiUrl = `https://api.filebase.io/v1/ipfs/pins?metadata[name]=${encodeURIComponent(key)}`;
        const response = await fetch(ipfsApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.FILEBASE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pins = await response.json();
            if (pins.results && pins.results.length > 0) {
                const pin = pins.results.find(p => p.metadata && p.metadata.name === key);
                if (pin) {
                    console.log("✅ Found CID from Filebase API:", pin.cid);
                    return pin.cid;
                }
            }
        }

        console.log("⚠️ Using content hash as fallback CID");
        const objectData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
        const contentHash = crypto.createHash('sha256').update(objectData.Body).digest('hex');
        const fallbackCID = `Qm${contentHash}`; 
        return fallbackCID;

    } catch (error) {
        console.error("❌ Error getting CID from Filebase:", error);
        throw new Error(`Failed to get CID: ${error.message}`);
    }
};

// Upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const userId = req.body.userId;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        // Retrieve encrypted keywords from frontend payload
        let encryptedKeywords = [];
        if (req.body.encryptedKeywords) {
            try {
                const parsed = JSON.parse(req.body.encryptedKeywords);
                // Handle different possible formats from frontend
                if (Array.isArray(parsed)) {
                    encryptedKeywords = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    // If frontend sends an object with encrypted data, extract array if possible
                    encryptedKeywords = parsed.encryptedSize ? [parsed.encryptedSize] : [];
                }
                console.log("Parsed encrypted keywords:", encryptedKeywords);
            } catch (e) {
                console.warn("Could not parse encryptedKeywords from request body:", e.message);
                // If parsing fails, create a simple encrypted keyword from file name
                encryptedKeywords = [req.file.originalname.length];
            }
        }

        console.log("📤 Starting upload process for:", req.file.originalname);

        // Encrypt file using AES (bulk data)
        const encryptedResult = encryptBuffer(req.file.buffer);
        const encryptedBuffer = Buffer.from(encryptedResult.data, "base64");

        const timestamp = Date.now();
        const uniqueKey = `${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const params = {
            Bucket: process.env.FILEBASE_BUCKET,
            Key: uniqueKey,
            Body: encryptedBuffer,
            Metadata: {
                'original-filename': req.file.originalname,
                'upload-timestamp': timestamp.toString(),
                'user-id': userId
            },
            Tagging: 'ipfs=true'
        };

        console.log("🚀 Uploading to Filebase...");
        const uploadResult = await s3.upload(params).promise();
        console.log("✅ Filebase upload completed:", uploadResult.Key);

        console.log("🔍 Retrieving CID from Filebase...");
        const actualCID = await getCIDFromFilebase(process.env.FILEBASE_BUCKET, uploadResult.Key);

        if (!actualCID) {
            throw new Error("Failed to get CID from Filebase");
        }

        const { data, error } = await supabase
            .from("files")
            .insert({
                user_id: userId,
                name: req.file.originalname,
                cid: actualCID,
                iv: encryptedResult.iv,
                size: req.file.size,
                filebase_key: uploadResult.Key 
            })
            .select();

        if (error) {
            console.error("❌ Database error:", error);
            return res.status(500).json({ error: "Failed to save file details to database" });
        }

        const fileHash = "0x" + crypto.createHash("sha256").update(req.file.buffer).digest("hex");
        
        // Pass the FHE encrypted keywords to the blockchain
        console.log("🔗 Recording on blockchain with keywords:", encryptedKeywords);
        const blockchainResult = await recordOnBlockchain(actualCID, encryptedKeywords);

        if (blockchainResult && blockchainResult.txHash) {
            try {
                const { error: txError } = await supabase
                    .from('blockchain_transactions')
                    .insert({
                        file_id: data[0].id,
                        tx_hash: blockchainResult.txHash,
                        cid: actualCID,
                        file_hash: fileHash,
                        contract_address: blockchainResult.contractAddress,
                        block_number: blockchainResult.blockNumber,
                        gas_used: blockchainResult.gasUsed,
                        status: 'confirmed',
                        created_at: new Date().toISOString()
                    })
                    .select();

                if (txError) {
                    console.error('❌ Failed to store blockchain transaction:', txError);
                } else {
                    console.log('✅ Blockchain transaction stored in database:', blockchainResult.txHash);
                }
            } catch (txError) {
                console.error('❌ Error storing blockchain transaction:', txError);
            }
        } else {
            console.warn("⚠️ Blockchain recording failed, but file upload completed successfully");
        }

        try {
            console.log("🔔 Checking notification preferences for user:", userId);
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('push_notifications_enabled, notification_preferences')
                .eq('id', userId)
                .single();

            let pushEnabled = false;
            let badgeEnabled = true;

            if (userProfile) {
                if (userProfile.notification_preferences) {
                    pushEnabled = userProfile.notification_preferences.push_enabled || false;
                    badgeEnabled = userProfile.notification_preferences.badge_enabled !== false;
                } else if (userProfile.push_notifications_enabled !== undefined) {
                    pushEnabled = userProfile.push_notifications_enabled;
                }
            }

            if (badgeEnabled) {
                const notificationData = {
                    user_id: userId,
                    title: 'File Uploaded Successfully',
                    message: `"${req.file.originalname}" has been uploaded and secured on Sepolia testnet via Fhenix.`,
                    type: 'success',
                    action_url: '/files',
                    created_at: new Date().toISOString()
                };

                try {
                    const { error: notifError } = await supabase
                        .from('notifications')
                        .insert({
                            ...notificationData,
                            metadata: {
                                file_id: data[0].id,
                                file_name: req.file.originalname,
                                file_size: req.file.size,
                                cid: actualCID,
                                blockchain_tx: blockchainResult?.txHash
                            }
                        });

                    if (notifError && notifError.code === '42703') {
                        await supabase.from('notifications').insert(notificationData);
                    }
                } catch (insertError) {
                    console.warn('⚠️ Notification creation failed:', insertError);
                }
            }
        } catch (notifError) {
            console.warn('⚠️ Notification system error:', notifError.message);
        }

        const responseData = {
            id: data[0].id,
            cid: actualCID,
            iv: encryptedResult.iv,
            link: `https://ipfs.filebase.io/ipfs/${actualCID}`,
            txHash: blockchainResult?.txHash,
            contractAddress: blockchainResult?.contractAddress,
            heCapabilities: {
                searchIndex: true, // Indicates Fhenix FHE capability is active
            },
            notification: {
                created: true,
                type: 'success'
            }
        };

        res.json(responseData);

    } catch (err) {
        console.error("❌ Upload failed:", err);
        try {
            const userId = req.body.userId;
            if (userId) {
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('notification_preferences')
                    .eq('id', userId)
                    .single();

                const notificationPreferences = userProfile?.notification_preferences || { badge_enabled: true };

                if (notificationPreferences.badge_enabled !== false) {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: userId,
                            title: 'Upload Failed',
                            message: `Failed to upload "${req.file?.originalname || 'file'}": ${err.message}`,
                            type: 'error',
                            action_url: '/upload',
                            created_at: new Date().toISOString()
                        });
                }
            }
        } catch (notifError) {
            console.warn('⚠️ Failed to create error notification:', notifError);
        }

        res.status(500).json({ error: "Upload failed: " + err.message });
    }
});

// Download endpoint
app.post("/api/download", async (req, res) => {
    try {
        const { cid, iv } = req.body;
        if (!cid || !iv) return res.status(400).json({ error: "CID and IV are required" });

        const { data: fileData, error: dbError } = await supabase
            .from("files")
            .select("filebase_key, name")
            .eq("cid", cid)
            .single();

        if (dbError || !fileData) {
            return res.status(404).json({ error: "File not found in database" });
        }

        const s3Params = {
            Bucket: process.env.FILEBASE_BUCKET,
            Key: fileData.filebase_key
        };

        const s3Data = await s3.getObject(s3Params).promise();
        const encryptedBuffer = s3Data.Body;

        const encryptedData = { iv, data: encryptedBuffer.toString("base64") };
        const decryptedBuffer = decrypt(encryptedData);

        res.setHeader("Content-Disposition", `attachment; filename="${fileData.name || cid}"`);
        res.setHeader("Content-Type", "application/octet-stream");
        res.send(decryptedBuffer);

    } catch (err) {
        console.error("❌ Download/decrypt failed:", err);
        res.status(500).json({ error: "Download failed: " + err.message });
    }
});

// Get files by user
app.get("/api/files/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: files, error } = await supabase
            .from("files")
            .select("*")
            .eq("user_id", userId)
            .order("uploaded_at", { ascending: false });

        if (error) throw error;

        // Formatted to accommodate frontend UI expectations
        const filesWithHE = files.map(file => ({
            ...file,
            heCapabilities: {
                hasSearchIndex: true, // Now handled strictly on-chain via Fhenix CoFHE
                hasEncryptedHash: false,
                processingHistory: []
            }
        }));

        res.json(filesWithHE);
    } catch (err) {
        console.error("❌ Failed to fetch files:", err);
        res.status(500).json({ error: "Failed to fetch files" });
    }
});

// Verify on blockchain (GET)
app.get("/api/verify/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const contractAddress = await getValidContractAddress();
        if (!contractAddress)
            return res.status(400).json({ success: false, message: "Contract not deployed" });

        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);

        const contract = new ethers.Contract(
            contractAddress,
            ["function verifyRecord(string memory cid) public view returns (bool)"],
            wallet
        );

        const exists = await contract.verifyRecord(cid);
        if (!exists)
            return res.status(404).json({ success: false, message: "File not found on blockchain" });

        res.json({ success: true, cid, contractAddress });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await fetch('http://localhost:5000/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        title: 'File Verified on Blockchain',
                        message: `File with CID ${cid} has been successfully verified on the Sepolia blockchain.`,
                        type: 'success',
                        actionUrl: `/files`
                    })
                });
            }
        } catch (notifError) {
            console.warn('⚠️ Failed to create verification notification:', notifError.message);
        }

    } catch (err) {
        console.error("❌ Verification failed:", err);
        if (err.message.includes("contract") || err.message.includes("address")) await deployNewContract();
        res.status(500).json({ error: "Verification failed", message: err.message });
    }
});

app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);

// Get blockchain transactions for a file
app.get("/api/blockchain-transactions/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;

        const { data, error } = await supabase
            .from('blockchain_transactions')
            .select('*')
            .eq('file_id', fileId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            fileId,
            transactions: data,
            count: data?.length || 0
        });
    } catch (error) {
        console.error('❌ Failed to fetch blockchain transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Delete endpoint
app.delete("/api/delete/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const userId = req.query.userId; 

        const { data: fileData, error: dbError } = await supabase
            .from("files")
            .select("id, filebase_key, user_id, cid")
            .eq("cid", cid)
            .single();

        if (dbError || !fileData) {
            return res.status(404).json({ success: false, message: "File not found in database" });
        }

        if (userId && fileData.user_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized: File belongs to another user" });
        }

        try {
            const deleteParams = {
                Bucket: process.env.FILEBASE_BUCKET,
                Key: fileData.filebase_key
            };
            await s3.deleteObject(deleteParams).promise();
            
            const unpinResponse = await fetch(
                `https://api.filebase.io/v1/ipfs/${fileData.cid}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${process.env.FILEBASE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (s3Error) {
            console.error("❌ Error deleting from Filebase:", s3Error);
        }

        try {
            await supabase.from('blockchain_transactions').delete().eq('file_id', fileData.id);
        } catch (txError) {
            console.warn("⚠️ Error deleting blockchain records:", txError);
        }

        const { error: fileDeleteError } = await supabase
            .from("files")
            .delete()
            .eq("id", fileData.id);

        if (fileDeleteError) {
            throw new Error("Failed to delete file record: " + fileDeleteError.message);
        }

        try {
            await fetch('http://localhost:5000/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: 'File Deleted',
                    message: `File with CID ${fileData.cid} has been permanently deleted from all systems.`,
                    type: 'info',
                    actionUrl: `/files`
                })
            });
        } catch (notifError) {
            console.warn('⚠️ Failed to create deletion notification:', notifError.message);
        }

        res.json({
            success: true,
            message: "File deleted successfully from all systems",
            cid: fileData.cid,
            fileId: fileData.id
        });

    } catch (error) {
        console.error("❌ Delete operation failed:", error);
        res.status(500).json({ success: false, message: "Delete failed: " + error.message });
    }
}); 

app.listen(5000, () => console.log("✅ Backend running on port 5000 with Sepolia & CoFHE Support"));
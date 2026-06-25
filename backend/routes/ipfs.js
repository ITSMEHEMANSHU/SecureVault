// backend/routes/ipfs.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import { encryptBuffer, decrypt } from "../crypto.js";

dotenv.config();
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary file storage

// Configure S3 for Filebase
const s3 = new AWS.S3({
  endpoint: "https://s3.filebase.com",
  accessKeyId: process.env.FILEBASE_API_KEY,
  secretAccessKey: process.env.FILEBASE_API_SECRET,
  region: "us-east-1",
  signatureVersion: 'v4',
});

// Extract CID from Filebase response - EXPORT THIS FUNCTION
export const extractCIDFromFilebaseResponse = (uploadResult) => {
  try {
    // Method 1: Check if CID is in the response headers
    if (uploadResult.$response && uploadResult.$response.headers) {
      const cidHeader = uploadResult.$response.headers['x-amz-meta-cid'];
      if (cidHeader) {
        console.log("📦 Found CID in headers:", cidHeader);
        return cidHeader;
      }
    }

    // Method 2: Check if IPFS hash is in the response body
    if (uploadResult.Ipfs && uploadResult.Ipfs.Hash) {
      console.log("📦 Found CID in Ipfs.Hash:", uploadResult.Ipfs.Hash);
      return uploadResult.Ipfs.Hash;
    }

    // Method 3: For Filebase, sometimes the Key is the CID when using IPFS
    if (uploadResult.Key && uploadResult.Key.startsWith('Qm')) {
      console.log("📦 Using Key as CID:", uploadResult.Key);
      return uploadResult.Key;
    }

    console.warn("❌ Could not extract CID from response, using Location fallback");
    console.log("📦 Upload result:", JSON.stringify(uploadResult, null, 2));
    
    // Fallback: Extract from Location URL
    if (uploadResult.Location) {
      const urlParts = uploadResult.Location.split('/');
      const possibleCid = urlParts[urlParts.length - 1];
      if (possibleCid && possibleCid.startsWith('Qm')) {
        return possibleCid;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error extracting CID:", error);
    return null;
  }
};

// POST /api/ipfs/upload - Upload to Filebase and get actual CID
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(req.file.path);

    // Encrypt file
    const { iv, data } = encryptBuffer(fileBuffer);
    const encryptedBuffer = Buffer.from(data, "base64");

    // Generate unique key with timestamp to avoid collisions
    const timestamp = Date.now();
    const uniqueKey = `${timestamp}_${req.file.originalname}`;

    // Upload to Filebase S3 bucket
    const params = {
      Bucket: process.env.FILEBASE_BUCKET,
      Key: uniqueKey,
      Body: encryptedBuffer,
      Metadata: {
        'original-filename': req.file.originalname,
        'upload-timestamp': timestamp.toString()
      }
    };

    console.log("📤 Uploading to Filebase...");
    const uploadResult = await s3.upload(params).promise();
    console.log("✅ Filebase upload result:", uploadResult);

    // Extract actual CID from Filebase response
    const actualCID = extractCIDFromFilebaseResponse(uploadResult);
    
    if (!actualCID) {
      throw new Error("Failed to extract CID from Filebase response");
    }

    console.log("📦 Actual CID:", actualCID);

    // Clean up local temp file
    fs.unlinkSync(req.file.path);

    const ipfsUrl = `https://ipfs.filebase.io/ipfs/${actualCID}`;

    res.json({ 
      cid: actualCID, 
      ipfsUrl, 
      iv,
      originalName: req.file.originalname
    });
  } catch (err) {
    console.error("❌ IPFS upload failed:", err);
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: "Upload to Filebase failed: " + err.message });
  }
});

export default router;
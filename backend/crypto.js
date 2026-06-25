import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Ensure your key is exactly 32 bytes after decoding
const key = Buffer.from(process.env.AES_SECRET_KEY, "base64");
if (key.length !== 32) {
  throw new Error(`Invalid key length: ${key.length} bytes. Must be 32 bytes for AES-256.`);
}

const algorithm = 'aes-256-cbc';
const ivLength = 16;

export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('base64'), data: encrypted.toString('base64') };
}

export function decrypt(encrypted) {
  const iv = Buffer.from(encrypted.iv, "base64");
  const encryptedData = Buffer.from(encrypted.data, "base64");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted;
}
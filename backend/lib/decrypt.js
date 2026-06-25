import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const key = Buffer.from(process.env.AES_SECRET_KEY, "base64");
const ivLength = 16;

export function decrypt(encrypted) {
  const iv = Buffer.from(encrypted.iv, "base64");
  const encryptedData = Buffer.from(encrypted.data, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted;
}

import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing Cloudinary credentials in .env.local or .env");
  process.exit(1);
}

// Helper to sign Cloudinary request
function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

async function uploadToCloudinary(fileUrlOrPath, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sabrang-2026/team";
  
  const params = {
    folder,
    public_id: publicId,
    timestamp,
  };
  
  const signature = generateSignature(params, API_SECRET);
  
  const formData = new FormData();
  formData.append("file", fileUrlOrPath);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.secure_url;
}

// Test upload
async function main() {
  console.log("Cloudinary Configured. Ready to test.");
}

main();

import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

async function uploadToCloudinary(filePath, publicId, resourceType = "auto") {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sabrang-2026/sabrang-logo";
  
  const params = {
    folder,
    public_id: publicId,
    timestamp,
  };
  
  const signature = generateSignature(params, API_SECRET);
  
  // Read file as Blob
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  
  const formData = new FormData();
  formData.append("file", blob, path.basename(filePath));
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.secure_url;
}

async function main() {
  const dirPath = path.join(__dirname, "../public/sabrang-logo");
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const publicId = path.parse(file).name.replace(/\s+/g, '-').toLowerCase(); // format public id
    const resourceType = file.endsWith(".pdf") ? "raw" : "image";
    try {
      const url = await uploadToCloudinary(filePath, publicId, resourceType);
      console.log(`Uploaded ${file} -> ${url}`);
    } catch (e) {
      console.error(`Failed to upload ${file}:`, e);
    }
  }
}

main();

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

async function uploadRemoteImage(url, folder, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder,
    public_id: publicId,
    timestamp,
  };
  const signature = generateSignature(params, API_SECRET);

  const formData = new FormData();
  formData.append("file", url);
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
  if (data.error) throw new Error(data.error.message);
  console.log(`✓ Uploaded ${publicId}:`, data.secure_url);
  return data.secure_url;
}

async function main() {
  const adityaUrl = await uploadRemoteImage(
    "https://github.com/Aston-09.png",
    "sabrang-2026/tech-team-credit",
    "Aditya"
  );
  const sauravUrl = await uploadRemoteImage(
    "https://github.com/sauravtank1507.png",
    "sabrang-2026/tech-team-credit",
    "Saurav"
  );
  console.log("Aditya Cloudinary URL:", adityaUrl);
  console.log("Saurav Cloudinary URL:", sauravUrl);
}

main().catch(console.error);

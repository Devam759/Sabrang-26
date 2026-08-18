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

const MAPPING_FILE = path.resolve("cloudinary-mapping.json");

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

async function destroyResource(publicId, resourceType = "raw") {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    public_id: publicId,
    timestamp,
  };
  const signature = generateSignature(params, API_SECRET);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(`Deleted from Cloudinary (${resourceType}): ${publicId} ->`, data.result || data);
    return data;
  } catch (err) {
    console.error(`Failed to delete ${publicId}:`, err.message);
  }
}

// Items that must remain local and should NOT be on Cloudinary
const nonUrlPublicIds = [
  { publicId: "sabrang-2026/draco/draco_decoder.js", resourceType: "raw" },
  { publicId: "sabrang-2026/draco/draco_decoder.wasm", resourceType: "raw" },
  { publicId: "sabrang-2026/draco/draco_wasm_wrapper.js", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/Cyberpunk.ttf", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/DarkNexis.ttf", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/helvetiker_bold.typeface.json", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/OhnoBlazeface-12Point.ttf", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/rush-driver/1001fonts-rush-driver-eula.txt", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/rush-driver/ReadMe.txt", resourceType: "raw" },
  { publicId: "sabrang-2026/fonts/rush-driver/RushDriver-Italic.otf", resourceType: "raw" },
  { publicId: "sabrang-2026/root/site.webmanifest", resourceType: "raw" },
];

const nonUrlMappingKeys = [
  "/draco/draco_decoder.js",
  "/draco/draco_decoder.wasm",
  "/draco/draco_wasm_wrapper.js",
  "/fonts/Cyberpunk.ttf",
  "/fonts/DarkNexis.ttf",
  "/fonts/helvetiker_bold.typeface.json",
  "/fonts/OhnoBlazeface-12Point.ttf",
  "/fonts/rush-driver/1001fonts-rush-driver-eula.txt",
  "/fonts/rush-driver/ReadMe.txt",
  "/fonts/rush-driver/RushDriver-Italic.otf",
  "/site.webmanifest",
];

async function main() {
  console.log("Removing non-URL system assets & internal files from Cloudinary...\n");
  for (const item of nonUrlPublicIds) {
    await destroyResource(item.publicId, item.resourceType);
  }

  if (fs.existsSync(MAPPING_FILE)) {
    const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
    for (const key of nonUrlMappingKeys) {
      if (mapping[key]) {
        delete mapping[key];
        console.log(`Removed from mapping: ${key}`);
      }
    }
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");
    console.log(`\nUpdated ${MAPPING_FILE} to contain only usable media CDN URLs.`);
  }
}

main();

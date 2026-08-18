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

const PUBLIC_DIR = path.resolve("public");
const MAPPING_FILE = path.resolve("cloudinary-mapping.json");

// Helper to sign Cloudinary request
function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

function getResourceType(ext) {
  const lower = ext.toLowerCase();
  if ([".mp4", ".mov", ".webm", ".mkv", ".avi"].includes(lower)) return "video";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"].includes(lower)) return "image";
  if ([".glb", ".gltf"].includes(lower)) return "raw";
  return null; // Not a media asset for Cloudinary
}

// Get only valid media files recursively from public directory
function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Skip internal folders that shouldn't be on Cloudinary
      if (["draco", "fonts"].includes(file.toLowerCase())) continue;
      getFilesRecursively(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      // Skip system files, webmanifests, licenses, gitkeep
      if (
        file === ".gitkeep" ||
        file.endsWith(".webmanifest") ||
        file.endsWith(".txt") ||
        file.endsWith(".json") ||
        file.endsWith(".js") ||
        file.endsWith(".wasm")
      ) {
        continue;
      }
      if (getResourceType(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

async function uploadFile(filePath, retryCount = 0) {
  const relPath = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, "/");
  const parsed = path.parse(relPath);
  const ext = parsed.ext.toLowerCase();
  const resourceType = getResourceType(ext);

  if (!resourceType) return null;

  const subFolder = parsed.dir
    ? parsed.dir.replace(/[^a-zA-Z0-9_\-\/]/g, "-").replace(/-+/g, "-").toLowerCase()
    : "root";
  const cloudinaryFolder = `sabrang-2026/${subFolder}`;

  let cleanName = parsed.name.replace(/[^a-zA-Z0-9_\-\.]/g, "-").replace(/-+/g, "-");
  let publicId = resourceType === "raw" ? `${cleanName}${parsed.ext}` : cleanName;

  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    folder: cloudinaryFolder,
    public_id: publicId,
    timestamp,
  };

  const signature = generateSignature(params, API_SECRET);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);

  const formData = new FormData();
  formData.append("file", blob, path.basename(filePath));
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", cloudinaryFolder);
  formData.append("public_id", publicId);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`[${relPath}] Cloudinary Error: ${data.error.message}`);
    }

    let finalUrl = data.secure_url;
    if (resourceType === "image") {
      finalUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
    }

    console.log(`✓ Uploaded (${resourceType}): /${relPath} -> ${finalUrl}`);
    return {
      relPath: `/${relPath}`,
      url: finalUrl,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      resourceType,
    };
  } catch (err) {
    if (retryCount < 2) {
      console.warn(`⚠️ Retrying ${relPath} (attempt ${retryCount + 2})... Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return uploadFile(filePath, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  console.log("==========================================");
  console.log(`Cloudinary Cloud: ${CLOUD_NAME}`);
  console.log("Scanning public folder for media files (images, videos, 3D models)...");
  console.log("==========================================");

  const files = getFilesRecursively(PUBLIC_DIR);
  console.log(`Found ${files.length} media files to process.\n`);

  let mapping = {};
  if (fs.existsSync(MAPPING_FILE)) {
    try {
      mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
    } catch (e) {
      mapping = {};
    }
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rel = "/" + path.relative(PUBLIC_DIR, file).replace(/\\/g, "/");
    console.log(`[${i + 1}/${files.length}] Uploading ${rel}...`);
    try {
      const res = await uploadFile(file);
      if (res) {
        mapping[res.relPath] = res.url;
        successCount++;
        fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");
      }
    } catch (err) {
      failCount++;
      console.error(`✗ Failed: ${rel}:`, err.message);
    }
  }

  console.log("\n==========================================");
  console.log(`Upload finished! Success: ${successCount}, Failed: ${failCount}`);
  console.log(`Mapping successfully saved to ${MAPPING_FILE}`);
  console.log("==========================================");
}

main();

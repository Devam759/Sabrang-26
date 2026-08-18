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

// Get all files recursively from public directory
function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Don't skip any folder
      getFilesRecursively(filePath, fileList);
    } else {
      // Skip non-media system files if any (e.g. .gitkeep, webmanifest, fonts unless needed)
      if (file.endsWith(".gitkeep") || file.endsWith(".webmanifest") || filePath.includes(`${path.sep}fonts${path.sep}`)) {
        continue;
      }
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function uploadFile(filePath) {
  const relPath = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, "/");
  
  // Format folder in Cloudinary: e.g. "sabrang-2026/events_posters"
  const parsed = path.parse(relPath);
  const subFolder = parsed.dir ? parsed.dir.replace(/\s+/g, "-").toLowerCase() : "root";
  const cloudinaryFolder = `sabrang-2026/${subFolder}`;
  
  // Clean public_id: remove extension, replace spaces/special chars with hyphens
  const cleanName = parsed.name.replace(/[^a-zA-Z0-9_\-\.]/g, "-").replace(/-+/g, "-");
  
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = filePath.endsWith(".mp4") ? "video" : "image";

  const params = {
    folder: cloudinaryFolder,
    public_id: cleanName,
    timestamp,
  };

  const signature = generateSignature(params, API_SECRET);

  const fileData = fs.readFileSync(filePath);
  const base64Data = `data:${resourceType === "video" ? "video/mp4" : "image/" + parsed.ext.slice(1)};base64,${fileData.toString("base64")}`;

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", cloudinaryFolder);
  formData.append("public_id", cleanName);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`[${relPath}] Error: ${data.error.message}`);
  }

  // Create optimized CDN URL
  let optimizedUrl = data.secure_url;
  if (resourceType === "image") {
    // Insert f_auto,q_auto transformation
    optimizedUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
  }

  console.log(`✓ Uploaded: /${relPath} -> ${optimizedUrl}`);
  return { relPath: `/${relPath}`, url: optimizedUrl, secureUrl: data.secure_url, publicId: data.public_id };
}

async function main() {
  console.log("Scanning public folder...");
  const files = getFilesRecursively(PUBLIC_DIR);
  console.log(`Found ${files.length} media files to upload.`);

  let mapping = {};
  if (fs.existsSync(MAPPING_FILE)) {
    try {
      mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
    } catch {}
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rel = "/" + path.relative(PUBLIC_DIR, file).replace(/\\/g, "/");
    console.log(`[${i + 1}/${files.length}] Uploading ${rel}...`);
    try {
      const res = await uploadFile(file);
      mapping[res.relPath] = res.url;
      // Save progressively
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");
    } catch (err) {
      console.error(`✗ Failed: ${rel}:`, err.message);
    }
  }

  console.log("\n==========================================");
  console.log("All uploads complete! Mapping saved to cloudinary-mapping.json");
  console.log("==========================================");
}

main();

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

const TEAM_DIR = path.resolve("public/team");
const MAPPING_FILE = path.resolve("cloudinary-mapping.json");

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

// Rename map: [original filename, standardized new filename, person name key]
const renameMap = [
  { orig: "abhiram.png", newName: "abhirama-shreyas.png", name: "Abhirama Shreyas" },
  { orig: "Aditya Nayak.png", newName: "aditya-nayak.png", name: "Aditya Nayak" },
  { orig: "Ambika Dalmia.png", newName: "ambika-dalmia.png", name: "Ambika Dalmia" },
  { orig: "ankit.png", newName: "ankit-joshi.png", name: "Ankit Joshi" },
  { orig: "Anushkaa.png", newName: "anushka-pathak.png", name: "Anushka Pathak" },
  { orig: "Aryan.png", newName: "aryan-gupta.png", name: "Aryan Gupta" },
  { orig: "Ashlesha Sharma.png", newName: "ashlesha-sharma.png", name: "Ashlesha Sharma" },
  { orig: "asmit.png", newName: "ashmit-sharma.png", name: "Ashmit Sharma" },
  { orig: "Daksh kumar.png", newName: "daksh-kumar.png", name: "Daksh Kumar" },
  { orig: "Devam.png", newName: "devam-gupta.png", name: "Devam Gupta" },
  { orig: "devansh.png", newName: "devansh-srivastava.png", name: "Devansh Srivastava" },
  { orig: "Dikshaa.png", newName: "diksha-shekhawat.png", name: "Diksha Shekhawat" },
  { orig: "gurseerat OH.jpg", newName: "gurseerat-kaur.jpg", name: "Gurseerat Kaur" },
  { orig: "Kartik Chaudhary.png", newName: "kartik-singh.png", name: "Kartik Singh" },
  { orig: "Kartikkk Sharmaaa OH.jpg", newName: "kartik-sharma.jpg", name: "Kartik Sharma" },
  { orig: "Khushii.png", newName: "khushi-soni.png", name: "Khushi Soni" },
  { orig: "Kunal.png", newName: "kunal-kasliwal.png", name: "Kunal Kasliwal" },
  { orig: "laksh.png", newName: "laksh-sharma.png", name: "Laksh Sharma" },
  { orig: "Manan.png", newName: "manan-lala.png", name: "Manan Lala" },
  { orig: "Naman Shukla.png", newName: "naman-shukla.png", name: "Naman Shukla" },
  { orig: "richa.png", newName: "richa-sharma.png", name: "Richa Sharma" },
  { orig: "Rishika OH .png", newName: "rishika-singh.png", name: "Rishika Singh" },
  { orig: "Roshan jangir .png", newName: "roshan-jangir.png", name: "Roshan Jangir" },
  { orig: "Satvik.png", newName: "satvik-agrawal.png", name: "Satvik Agrawal" },
  { orig: "Saumya.png", newName: "saumya-puri.png", name: "Saumya Puri" },
  { orig: "VC.png", newName: "vice-chancellor.png", name: "Vice Chancellor" },
];

async function uploadFile(filePath, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sabrang-2026/team";

  const params = {
    folder,
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
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`[${publicId}] Cloudinary Error: ${data.error.message}`);
  }

  const optimizedUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
  return optimizedUrl;
}

async function main() {
  console.log("==========================================");
  console.log("Renaming and uploading team pictures to Cloudinary...");
  console.log("==========================================");

  // 1. Rename files in public/team
  for (const item of renameMap) {
    const oldPath = path.join(TEAM_DIR, item.orig);
    const newPath = path.join(TEAM_DIR, item.newName);
    if (fs.existsSync(oldPath) && oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: "${item.orig}" -> "${item.newName}"`);
    }
  }

  // Remove duplicate devamm.jpg if present
  const duplicateDevam = path.join(TEAM_DIR, "devamm.jpg");
  if (fs.existsSync(duplicateDevam)) {
    fs.unlinkSync(duplicateDevam);
  }

  // 2. Upload to Cloudinary
  const teamUrlMap = {};
  let mapping = {};
  if (fs.existsSync(MAPPING_FILE)) {
    try {
      mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
    } catch {}
  }

  for (let i = 0; i < renameMap.length; i++) {
    const item = renameMap[i];
    const targetFile = path.join(TEAM_DIR, item.newName);
    const publicId = path.parse(item.newName).name;
    console.log(`[${i + 1}/${renameMap.length}] Uploading ${item.newName} (${item.name})...`);

    if (fs.existsSync(targetFile)) {
      try {
        const url = await uploadFile(targetFile, publicId);
        teamUrlMap[item.name] = url;
        mapping[`/team/${item.newName}`] = url;
        console.log(`✓ Uploaded: ${item.name} -> ${url}`);
      } catch (err) {
        console.error(`✗ Error uploading ${item.newName}:`, err.message);
      }
    } else {
      console.warn(`File not found: ${targetFile}`);
    }
  }

  // Save updated mapping
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");

  // Output generated team dictionary for TeamClient
  const teamDictionaryPath = path.resolve("lib/team-urls.json");
  fs.writeFileSync(teamDictionaryPath, JSON.stringify(teamUrlMap, null, 2), "utf-8");
  console.log(`\nTeam URLs saved to ${teamDictionaryPath}`);

  // 3. Delete local team folder
  console.log("\nDeleting local public/team directory...");
  fs.rmSync(TEAM_DIR, { recursive: true, force: true });
  console.log("✓ Local public/team directory deleted successfully.");

  console.log("\n==========================================");
  console.log("All team pictures successfully uploaded and cleaned up!");
  console.log("==========================================");
}

main().catch(console.error);

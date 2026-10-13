import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { isRateLimited } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();

    // Rate limit image uploads to 10 per minute per IP
    if (isRateLimited(`${ip}:upload`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many upload attempts. Please wait a minute." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-side validation: must be an image and <= 5MB
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WEBP) are allowed" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic byte header inspection to prevent malicious polyglot / script upload
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

    // Strictly block SVG and other executable vector/markup formats
    if (file.type?.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
      return NextResponse.json({ error: "SVG images are not permitted for security reasons." }, { status: 400 });
    }

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: "Invalid image format detected. Upload genuine JPG, PNG, or WEBP images only." }, { status: 400 });
    }

    // Determine safe extension strictly and exclusively from verified magic bytes
    let safeExt = '.jpg';
    if (isPng) safeExt = '.png';
    else if (isWebp) safeExt = '.webp';

    const safeFileId = crypto.randomUUID();
    const uniqueFileName = `id_${Date.now()}_${safeFileId}${safeExt}`;
    const safeDisplayName = file.name.replace(/[^a-zA-Z0-9_\-\. ]/g, '').slice(0, 80);

    // 1. Try uploading to Cloudinary first (Permanent CDN storage, works in production & localhost)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'sabrang-2026/id-cards';
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        const base64Data = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
        const uploadFormData = new FormData();
        uploadFormData.append('file', base64Data);
        uploadFormData.append('api_key', apiKey);
        uploadFormData.append('timestamp', timestamp.toString());
        uploadFormData.append('folder', folder);
        uploadFormData.append('signature', signature);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: uploadFormData,
          }
        );

        if (cloudinaryRes.ok) {
          const cloudinaryData = await cloudinaryRes.json();
          const secureUrl = cloudinaryData.secure_url || cloudinaryData.url;
          if (secureUrl) {
            console.log(`[Upload-ID] Successfully uploaded ID card to Cloudinary: ${secureUrl}`);
            return NextResponse.json({ url: secureUrl, name: file.name });
          }
        } else {
          const errText = await cloudinaryRes.text();
          console.warn("[Upload-ID] Cloudinary returned non-ok status:", cloudinaryRes.status, errText);
        }
      } catch (cloudErr: any) {
        console.warn("[Upload-ID] Cloudinary upload encountered an issue, trying fallbacks:", cloudErr.message);
      }
    }

    // 2. Try uploading to Firebase Admin Storage fallback
    if (adminStorage) {
      try {
        const bucketName = 
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
          process.env.FIREBASE_STORAGE_BUCKET || 
          'sabrang-26.firebasestorage.app';
        
        const bucket = adminStorage.bucket(bucketName);
        const fileRef = bucket.file(`idCards/${uniqueFileName}`);
        const downloadToken = crypto.randomUUID();

        await fileRef.save(buffer, {
          metadata: { 
            contentType: file.type || 'image/png',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken
            }
          },
        });

        const encodedPath = encodeURIComponent(`idCards/${uniqueFileName}`);
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
        
        return NextResponse.json({ url, name: safeDisplayName });
      } catch (storageError: any) {
        console.warn("Firebase Admin Storage upload encountered an issue, falling back to local storage:", storageError.message);
      }
    }

    // Local filesystem fallback (always works on localhost / dev environment)
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'idCards');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.resolve(uploadsDir, uniqueFileName);

    // Prevent path traversal outside uploads directory
    if (!localFilePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Illegal upload destination path" }, { status: 400 });
    }

    await fs.promises.writeFile(localFilePath, buffer);

    const localUrl = `/uploads/idCards/${uniqueFileName}`;
    return NextResponse.json({ url: localUrl, name: safeDisplayName });

  } catch (err: any) {
    console.error("API /upload-id error:", err);
    return NextResponse.json({ error: err.message || "Failed to process image upload" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
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
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 1. Try uploading to Firebase Admin Storage first (Primary storage in id-cards/)
    if (adminStorage) {
      try {
        const bucketName = 
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
          process.env.FIREBASE_STORAGE_BUCKET || 
          'sabrang-26.firebasestorage.app';
        
        const bucket = adminStorage.bucket(bucketName);
        const folder = 'id-cards';
        const fileRef = bucket.file(`${folder}/${uniqueFileName}`);
        const downloadToken = crypto.randomUUID();

        await fileRef.save(buffer, {
          metadata: { 
            contentType: file.type || 'image/jpeg',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken
            }
          },
        });

        const encodedPath = encodeURIComponent(`${folder}/${uniqueFileName}`);
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
        
        console.log(`[Upload-ID] Successfully uploaded ID card to Firebase Storage: ${url}`);
        return NextResponse.json({ url, name: file.name });
      } catch (storageError: any) {
        console.warn("Firebase Admin Storage upload encountered an issue, trying fallbacks:", storageError.message);
      }
    }

    // 2. Cloudinary fallback
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
            console.log(`[Upload-ID] Uploaded ID card to Cloudinary fallback: ${secureUrl}`);
            return NextResponse.json({ url: secureUrl, name: file.name });
          }
        } else {
          const errText = await cloudinaryRes.text();
          console.warn("[Upload-ID] Cloudinary fallback returned non-ok status:", cloudinaryRes.status, errText);
        }
      } catch (cloudErr: any) {
        console.warn("[Upload-ID] Cloudinary fallback encountered an issue:", cloudErr.message);
      }
    }

    // Local filesystem fallback (always works on localhost / dev environment)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'idCards');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, uniqueFileName);
    await fs.promises.writeFile(localFilePath, buffer);

    const localUrl = `/uploads/idCards/${uniqueFileName}`;
    return NextResponse.json({ url: localUrl, name: file.name });

  } catch (err: any) {
    console.error("API /upload-id error:", err);
    return NextResponse.json({ error: err.message || "Failed to process image upload" }, { status: 500 });
  }
}

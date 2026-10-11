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

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Try uploading to Firebase Admin Storage first
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
        
        return NextResponse.json({ url, name: file.name });
      } catch (storageError: any) {
        console.warn("Firebase Admin Storage upload encountered an issue, falling back to local storage:", storageError.message);
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

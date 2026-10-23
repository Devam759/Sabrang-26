import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import crypto from 'crypto';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get('file');
    const urlParam = searchParams.get('url');

    let filename = '';
    if (fileParam) {
      filename = path.basename(fileParam.trim());
    } else if (urlParam) {
      filename = path.basename(urlParam.trim().split('?')[0]);
    }

    if (!filename || filename === '.' || filename === '/') {
      return NextResponse.json({ error: 'Missing or invalid file parameter' }, { status: 400 });
    }

    const bucketName = 
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
      process.env.FIREBASE_STORAGE_BUCKET || 
      'sabrang-26.firebasestorage.app';

    if (!adminStorage) {
      return NextResponse.json({ error: 'Firebase Storage not initialized' }, { status: 503 });
    }

    const bucket = adminStorage.bucket(bucketName);
    const storageFile = bucket.file(`id-cards/${filename}`);
    const [exists] = await storageFile.exists();

    if (exists) {
      const [metadata] = await storageFile.getMetadata();
      let token = metadata.metadata?.firebaseStorageDownloadTokens;
      
      // If token is missing, generate and attach one
      if (!token) {
        token = crypto.randomUUID();
        await storageFile.setMetadata({
          metadata: { firebaseStorageDownloadTokens: token }
        });
      }

      const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`id-cards/${filename}`)}?alt=media&token=${token}`;
      return NextResponse.redirect(firebaseUrl, { status: 307 });
    }

    // Fallback: If not yet in Firebase Storage but url was provided, fetch from source and mirror to Firebase Storage
    if (urlParam && (urlParam.startsWith('http://') || urlParam.startsWith('https://'))) {
      try {
        const fetchRes = await fetch(urlParam);
        if (fetchRes.ok) {
          const buffer = Buffer.from(await fetchRes.arrayBuffer());
          const downloadToken = crypto.randomUUID();
          const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';

          await storageFile.save(buffer, {
            metadata: {
              contentType,
              metadata: { firebaseStorageDownloadTokens: downloadToken }
            }
          });

          const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`id-cards/${filename}`)}?alt=media&token=${downloadToken}`;
          return NextResponse.redirect(firebaseUrl, { status: 307 });
        }
      } catch (mirrorErr) {
        console.warn(`[ID-Card API] Failed to mirror ${filename} to Firebase Storage:`, mirrorErr);
      }
    }

    return NextResponse.json({ error: 'File not found in Firebase Storage' }, { status: 404 });
  } catch (err: any) {
    console.error('ID-Card API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

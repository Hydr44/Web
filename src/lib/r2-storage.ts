/**
 * R2 Storage Client (Cloudflare)
 * S3-compatible object storage per backup fatture, certificati, export
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  }
  _s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return _s3Client;
}

/**
 * Upload file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | string,
  contentType: string = 'application/octet-stream',
  metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await getS3Client().send(command);

    const url = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`;
    console.log(`[R2] File uploaded: ${key}`);

    return { key, url };
  } catch (error) {
    console.error(`[R2] Error uploading file:`, error);
    throw error;
  }
}

/**
 * Download file from R2
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const response = await getS3Client().send(command);
    const chunks: Uint8Array[] = [];

    if (response.Body) {
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
    }

    const buffer = Buffer.concat(chunks);
    console.log(`[R2] File downloaded: ${key} (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    console.error(`[R2] Error downloading file:`, error);
    throw error;
  }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await getS3Client().send(command);
    console.log(`[R2] File deleted: ${key}`);
  } catch (error) {
    console.error(`[R2] Error deleting file:`, error);
    throw error;
  }
}

/**
 * Generate signed URL per upload diretto browser→R2 (bypassa il limite
 * body delle serverless function: gli installer pesano decine di MB).
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string = 'application/octet-stream',
  expiresIn: number = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Generate signed URL (per download diretto)
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(getS3Client(), command, { expiresIn });
    console.log(`[R2] Signed URL generated: ${key}`);

    return url;
  } catch (error) {
    console.error(`[R2] Error generating signed URL:`, error);
    throw error;
  }
}

/**
 * List files in R2 (con prefix)
 */
export async function listR2Files(prefix: string): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await getS3Client().send(command);
    const files = response.Contents?.map((obj) => obj.Key || '') || [];

    console.log(`[R2] Listed ${files.length} files with prefix: ${prefix}`);

    return files;
  } catch (error) {
    console.error(`[R2] Error listing files:`, error);
    return [];
  }
}

/**
 * Backup SDI fatture
 */
export async function backupSDIFile(
  fileName: string,
  fileBuffer: Buffer,
  type: 'sent' | 'received'
): Promise<{ key: string; url: string }> {
  const date = new Date().toISOString().split('T')[0];
  const key = `sdi/${type}/${date}/${fileName}`;

  return uploadToR2(key, fileBuffer, 'application/xml', {
    'backup-type': 'sdi',
    'file-type': type,
    'backup-date': new Date().toISOString(),
  });
}

/**
 * Backup certificati SDI
 */
export async function backupCertificate(
  fileName: string,
  fileBuffer: Buffer,
  certType: 'firma' | 'cifratura' | 'ca'
): Promise<{ key: string; url: string }> {
  const key = `certs/${certType}/${fileName}`;

  return uploadToR2(key, fileBuffer, 'application/x-pkcs12', {
    'backup-type': 'certificate',
    'cert-type': certType,
    'backup-date': new Date().toISOString(),
  });
}

/**
 * Store export (PDF/Excel)
 */
export async function storeExport(
  fileName: string,
  fileBuffer: Buffer,
  exportType: 'pdf' | 'excel' | 'csv',
  orgId: string
): Promise<{ key: string; url: string; signedUrl: string }> {
  const date = new Date().toISOString().split('T')[0];
  const key = `exports/${exportType}/${orgId}/${date}/${fileName}`;

  const contentType = {
    pdf: 'application/pdf',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
  }[exportType];

  const result = await uploadToR2(key, fileBuffer, contentType, {
    'export-type': exportType,
    'org-id': orgId,
    'export-date': new Date().toISOString(),
  });

  // Generate signed URL per download
  const signedUrl = await getSignedDownloadUrl(key, 86400); // 24h

  return { ...result, signedUrl };
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 1,
    });

    await getS3Client().send(command);
    console.log('[R2] Health check: OK');
    return true;
  } catch (error) {
    console.error('[R2] Health check failed:', error);
    return false;
  }
}

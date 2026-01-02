import { S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client for Backblaze B2
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_ENDPOINT) {
      throw new Error('Missing Backblaze B2 environment variables');
    }

    // Determine region from endpoint or env var
    const endpoint = process.env.B2_ENDPOINT || '';
    const regionMatch = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/);
    const region = process.env.B2_REGION || (regionMatch ? regionMatch[1] : 'us-west-004');

    s3Client = new S3Client({
      region: region,
      endpoint: `https://${process.env.B2_ENDPOINT}`,
      credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Upload file to Backblaze B2
 * @param file Buffer of the file to upload
 * @param key Unique key/path for the file in B2
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToB2(file: Buffer, key: string, contentType: string): Promise<string> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  const s3 = getS3Client();
  const bucket = process.env.B2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('B2_BUCKET_NAME environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
    // Note: Backblaze B2 doesn't support ACLs like AWS S3
    // Files are public by default when bucket is public
    // Remove ACL for B2 compatibility
  });

  // Upload file
  await s3.send(command);

  // Return public URL
  return `https://${bucket}.${process.env.B2_ENDPOINT}/${key}`;
}
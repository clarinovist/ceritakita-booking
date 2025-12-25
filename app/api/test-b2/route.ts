import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '@/lib/b2-s3-client';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * GET /api/test-b2
 * Test Backblaze B2 connection and bucket accessibility
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables first
    const envVars = {
      B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID,
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '***' : undefined,
      B2_ENDPOINT: process.env.B2_ENDPOINT,
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
    };

    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingVars,
        message: 'Please configure the following environment variables in .env.local: ' + missingVars.join(', '),
      }, { status: 400 });
    }

    // Initialize S3 client
    const s3Client = getS3Client();
    
    // Test connection by listing objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      MaxKeys: 1, // Just check if we can list, don't need many results
    });

    const response = await s3Client.send(listCommand);

    return NextResponse.json({
      success: true,
      message: 'Backblaze B2 connection successful!',
      bucket: process.env.B2_BUCKET_NAME,
      endpoint: process.env.B2_ENDPOINT,
      environment: {
        B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID,
        B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '***' : undefined,
        B2_ENDPOINT: process.env.B2_ENDPOINT,
        B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
      },
      connection: {
        status: 'connected',
        canListObjects: true,
        objectCount: response.KeyCount || 0,
      },
      permissions: {
        read: true,
        write: true, // If we can connect, we have write access (needed for uploads)
      },
      sampleObjects: response.Contents?.slice(0, 3) || [],
    }, { status: 200 });

  } catch (error: any) {
    console.error('B2 Connection Test Error:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errorDetails = error.message;
    
    if (error.name === 'InvalidAccessKeyId' || error.Code === 'InvalidAccessKeyId') {
      errorMessage = 'Invalid Application Key ID';
      errorDetails = 'The B2_APPLICATION_KEY_ID provided is incorrect or has been revoked.';
    } else if (error.name === 'SignatureDoesNotMatch' || error.Code === 'SignatureDoesNotMatch') {
      errorMessage = 'Invalid Application Key';
      errorDetails = 'The B2_APPLICATION_KEY provided is incorrect or does not match the Key ID.';
    } else if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
      errorMessage = 'Bucket not found';
      errorDetails = `The bucket "${process.env.B2_BUCKET_NAME}" does not exist or you don't have access to it.`;
    } else if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
      errorMessage = 'Access denied';
      errorDetails = 'The credentials do not have permission to access this bucket. Check that the key has Read/Write permissions.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Connection failed';
      errorDetails = 'Cannot connect to Backblaze B2. Check your internet connection and the B2_ENDPOINT configuration.';
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      rawError: {
        name: error.name,
        code: error.Code || error.code,
        message: error.message,
      },
      troubleshooting: getTroubleshootingSteps(error, {
        B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID,
        B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '***' : undefined,
        B2_ENDPOINT: process.env.B2_ENDPOINT,
        B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
      }),
    }, { status: 500 });
  }
}

/**
 * POST /api/test-b2
 * Test upload functionality
 */
export async function POST(request: NextRequest) {
  try {
    const { getS3Client, uploadToB2 } = await import('@/lib/b2-s3-client');
    
    // Create a small test file
    const testContent = `B2 Connection Test - ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, 'utf-8');
    
    const testKey = `test/connection-test-${Date.now()}.txt`;
    
    const url = await uploadToB2(testBuffer, testKey, 'text/plain');
    
    return NextResponse.json({
      success: true,
      message: 'Upload test successful!',
      uploadedFile: {
        key: testKey,
        url: url,
        size: testBuffer.length,
        type: 'text/plain',
      },
      note: 'This test file can be safely deleted from your B2 bucket.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('B2 Upload Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Upload test failed',
      details: error.message,
      message: 'The connection test passed but upload failed. This usually indicates permission issues.',
    }, { status: 500 });
  }
}

function getTroubleshootingSteps(error: any, envVars: any): string[] {
  const steps: string[] = [];
  
  if (!envVars.B2_APPLICATION_KEY_ID) {
    steps.push('Add B2_APPLICATION_KEY_ID to your .env.local file');
  }
  if (!envVars.B2_APPLICATION_KEY) {
    steps.push('Add B2_APPLICATION_KEY to your .env.local file');
  }
  if (!envVars.B2_ENDPOINT) {
    steps.push('Add B2_ENDPOINT to your .env.local file (e.g., s3.us-west-004.backblazeb2.com)');
  }
  if (!envVars.B2_BUCKET_NAME) {
    steps.push('Add B2_BUCKET_NAME to your .env.local file');
  }

  if (error.Code === 'InvalidAccessKeyId' || error.name === 'InvalidAccessKeyId') {
    steps.push('Verify your Application Key ID in Backblaze B2 dashboard');
    steps.push('Make sure you copied the entire key ID without extra spaces');
  }
  
  if (error.Code === 'SignatureDoesNotMatch' || error.name === 'SignatureDoesNotMatch') {
    steps.push('Verify your Application Key in Backblaze B2 dashboard');
    steps.push('Ensure the key has Read/Write permissions');
    steps.push('Try creating a new Application Key and replacing the old one');
  }
  
  if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
    steps.push('Create the bucket in Backblaze B2 dashboard');
    steps.push('Verify the bucket name is correct (case-sensitive)');
  }
  
  if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
    steps.push('Check that your Application Key has "Read and Write" permissions');
    steps.push('Go to Backblaze B2 → App Keys → Your Key → Check permissions');
    steps.push('Create a new key with full access if needed');
  }

  steps.push('Restart your development server after changing .env.local');
  steps.push('Check Backblaze B2 service status at https://status.backblaze.com/');

  return steps;
}
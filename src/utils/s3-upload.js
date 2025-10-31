// S3 Upload utility for logo files
// Handles direct upload to S3 temp folder for resource submissions

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 configuration from environment variables
const S3_CONFIG = {
  region: import.meta.env.PUBLIC_AWS_REGION || 'us-east-1',
  bucketName: import.meta.env.PUBLIC_S3_BUCKET_NAME || 'kelifax-resources',
  prefix: import.meta.env.PUBLIC_S3_BUCKET_PREFIX || 'dev'
};

/**
 * Create S3 client with credentials
 * Note: In production, you should use IAM roles or temporary credentials
 * For now, we'll use the access keys from environment
 */
function createS3Client() {
  return new S3Client({
    region: S3_CONFIG.region,
    credentials: {
      accessKeyId: import.meta.env.PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.PUBLIC_AWS_SECRET_ACCESS_KEY
    }
  });
}

/**
 * Generate the S3 key (file path) for a logo file
 * @param {string} resourceName - The resource name to create filename from
 * @returns {string} - S3 key path
 */
export function generateLogoKey(resourceName) {
  // Convert resource name to filename: "Amazing Dev Tool" → "amazing_dev_tool.png"
  const filename = resourceName.toLowerCase().replace(/\s+/g, '_') + '.png';
  return `${S3_CONFIG.prefix}/uploads/temp/${filename}`;
}

/**
 * Validate logo file before upload
 * @param {File} file - The file to validate
 * @returns {object} - Validation result with isValid and error properties
 */
export function validateLogoFile(file) {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/png'];

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PNG files are allowed' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 2MB' };
  }

  return { isValid: true, error: null };
}

/**
 * Upload logo file to S3 temp folder
 * @param {File} file - The logo file to upload
 * @param {string} resourceName - The resource name for filename generation
 * @returns {Promise<object>} - Upload result with success status and filename
 */
export async function uploadLogoToS3(file, resourceName) {
  try {
    // Validate file first
    const validation = validateLogoFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate S3 key
    const key = generateLogoKey(resourceName);
    
    // Create S3 client
    const s3Client = createS3Client();

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      ContentLength: file.size,
      // Optional: Add metadata
      Metadata: {
        'original-name': file.name,
        'resource-name': resourceName,
        'uploaded-at': new Date().toISOString()
      }
    });

    // Execute upload
    await s3Client.send(command);

    // Return success result
    return {
      success: true,
      filename: key.split('/').pop(), // Extract just the filename
      key: key,
      url: `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`
    };

  } catch (error) {
    console.error('S3 upload error:', error);
    
    let errorMessage = error.message || 'Failed to upload logo to S3';
    
    // Handle common S3 errors
    if (error.name === 'AccessDenied') {
      errorMessage = 'Access denied to S3 bucket. Check AWS credentials and permissions.';
    } else if (error.name === 'NoSuchBucket') {
      errorMessage = 'S3 bucket not found. Check bucket name configuration.';
    } else if (error.name === 'NetworkError' || error.message.includes('CORS')) {
      errorMessage = 'Network error or CORS issue. Check S3 bucket CORS configuration.';
    } else if (error.message.includes('Forbidden')) {
      errorMessage = 'Access forbidden. Check AWS credentials and S3 bucket policies.';
    }
    
    return {
      success: false,
      error: errorMessage,
      originalError: error
    };
  }
}

/**
 * Check if S3 is properly configured
 * @returns {boolean} - True if S3 configuration is available
 */
export function isS3Configured() {
  const hasCredentials = !!(
    import.meta.env.PUBLIC_AWS_ACCESS_KEY_ID &&
    import.meta.env.PUBLIC_AWS_SECRET_ACCESS_KEY &&
    S3_CONFIG.region &&
    S3_CONFIG.bucketName
  );
  
  const hasPlaceholders = (
    import.meta.env.PUBLIC_AWS_ACCESS_KEY_ID === 'your_access_key_here' ||
    import.meta.env.PUBLIC_AWS_SECRET_ACCESS_KEY === 'your_secret_key_here'
  );
  
  return hasCredentials && !hasPlaceholders;
}

/**
 * Test S3 connection and permissions
 * @returns {Promise<object>} - Test result
 */
export async function testS3Connection() {
  try {
    if (!isS3Configured()) {
      return {
        success: false,
        error: 'S3 not configured - missing AWS credentials or configuration'
      };
    }

    const s3Client = createS3Client();
    
    // Try to list objects in the temp folder (this tests basic connectivity)
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: `${S3_CONFIG.prefix}/uploads/temp/`,
      MaxKeys: 1
    });

    await s3Client.send(command);
    
    return {
      success: true,
      message: 'S3 connection successful'
    };

  } catch (error) {
    console.error('S3 connection test failed:', error);
    return {
      success: false,
      error: `S3 connection failed: ${error.message}`,
      originalError: error
    };
  }
}

/**
 * Mock S3 upload for development/testing without AWS credentials
 * @param {File} file - The logo file to validate
 * @param {string} resourceName - The resource name for filename generation
 * @returns {Promise<object>} - Mock upload result
 */
export async function mockLogoUpload(file, resourceName) {
  // Validate file first
  const validation = validateLogoFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const filename = resourceName.toLowerCase().replace(/\s+/g, '_') + '.png';
  const key = `${S3_CONFIG.prefix}/uploads/temp/${filename}`;
  
  return {
    success: true,
    filename: filename,
    key: key,
    url: `https://example.s3.amazonaws.com/${key}`,
    mock: true
  };
}

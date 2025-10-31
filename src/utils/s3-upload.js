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
 * Generate a random 4-letter string
 * @returns {string} - Random 4-letter string
 */
function generateRandomString() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate the S3 key (file path) for a logo file
 * @param {string} resourceName - The resource name to create filename from
 * @returns {string} - S3 key path
 */
export function generateLogoKey(resourceName) {
  // Convert resource name to filename: "Amazing Dev Tool" → "amazing-dev-tool-a1b2.png"
  const cleanName = resourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const randomSuffix = generateRandomString();
  const filename = `${cleanName}-${randomSuffix}.png`;
  return `${S3_CONFIG.prefix}/uploads/temp/${filename}`;
}

/**
 * Validate logo file before upload
 * @param {File} file - The file to validate
 * @returns {object} - Validation result with isValid and error properties
 */
export function validateLogoFile(file) {
  const maxSize = 600 * 1024; // 600KB
  const allowedTypes = ['image/png'];

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PNG files are allowed' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 600KB' };
  }

  return { isValid: true, error: null };
}

/**
 * Upload logo file via API endpoint
 * @param {File} file - The logo file to upload
 * @param {string} resourceName - The resource name for filename generation
 * @returns {Promise<object>} - Upload result with success status and filename
 */
export async function uploadLogoToS3(file, resourceName) {
  try {
    // Validate file first - Updated to 600KB limit
    const maxSize = 600 * 1024; // 600KB
    const allowedTypes = ['image/png'];

    if (!file) {
      throw new Error('No file selected');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PNG files are allowed');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 600KB');
    }

    // Generate filename using resource name with hyphens and random suffix
    const cleanResourceName = resourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const randomSuffix = generateRandomString();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const filename = `${cleanResourceName}-${randomSuffix}.${fileExtension}`;

    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Get API configuration
    const API_BASE_URL = import.meta.env.PUBLIC_API_URL;
    const API_KEY = import.meta.env.PUBLIC_API_KEY;

    if (!API_BASE_URL || !API_KEY) {
      throw new Error('API configuration missing. Please check environment variables.');
    }

    // Prepare request payload
    const payload = {
      file_name: filename,
      image: base64
    };

    // Make API request
    const response = await fetch(`${API_BASE_URL}/upload-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    // Return success result
    return {
      success: true,
      filename: result.data.original_filename,
      key: result.data.s3_key,
      url: result.data.file_url
    };

  } catch (error) {
    console.error('Logo upload error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to upload logo',
      originalError: error
    };
  }
}

/**
 * Convert file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data:image/...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if API is properly configured for logo upload
 * @returns {boolean} - True if API configuration is available
 */
export function isS3Configured() {
  const hasApiConfig = !!(
    import.meta.env.PUBLIC_API_URL &&
    import.meta.env.PUBLIC_API_KEY
  );
  
  const hasPlaceholders = (
    import.meta.env.PUBLIC_API_URL === 'your_api_url_here' ||
    import.meta.env.PUBLIC_API_KEY === 'your_api_key_here'
  );
  
  return hasApiConfig && !hasPlaceholders;
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
 * Mock S3 upload for development/testing without API configuration
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

  // Generate filename using resource name with hyphens and random suffix
  const cleanResourceName = resourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const randomSuffix = generateRandomString();
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const filename = `${cleanResourceName}-${randomSuffix}.${fileExtension}`;
  const key = `${S3_CONFIG.prefix}/uploads/temp/${filename}`;
  
  return {
    success: true,
    filename: filename,
    key: key,
    url: `https://example.s3.amazonaws.com/${key}`,
    mock: true
  };
}

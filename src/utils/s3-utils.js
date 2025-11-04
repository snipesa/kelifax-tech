// S3 utility functions for Kelifax
// Handles dynamic S3 URL generation based on environment configuration

import { S3_CONFIG } from './config.js';

/**
 * Generate S3 URL for assets
 * @param {string} key - The S3 object key/path
 * @param {string} prefix - Optional prefix to prepend to the key
 * @returns {string} - Complete S3 URL
 */
export function getS3Url(key, prefix = '') {
  if (!key) return '';
  
  // Build the full path with environment prefix
  const environmentPath = S3_CONFIG.ENVIRONMENT_PREFIX;
  const fullPath = prefix 
    ? `${environmentPath}/${prefix}/${key}` 
    : `${environmentPath}/${key}`;
  
  // Use custom base URL if configured (CloudFront/custom domain)
  if (S3_CONFIG.BASE_URL) {
    return `${S3_CONFIG.BASE_URL}/${fullPath}`;
  }
  
  // Use standard S3 URL format
  return `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${fullPath}`;
}

/**
 * Generate URL for pending resource logos
 * @param {string} logoFilename - Logo filename
 * @returns {string} - Complete S3 URL for pending logo
 */
export function getPendingLogoUrl(logoFilename) {
  if (!logoFilename) return '';
  return getS3Url(logoFilename, S3_CONFIG.PENDING_LOGOS_PREFIX);
}

/**
 * Generate URL for approved resource logos
 * @param {string} logoFilename - Logo filename
 * @returns {string} - Complete S3 URL for approved logo
 */
export function getApprovedLogoUrl(logoFilename) {
  if (!logoFilename) return '';
  return getS3Url(logoFilename, S3_CONFIG.APPROVED_LOGOS_PREFIX);
}

/**
 * Generate URL for resource logos (auto-detects status)
 * @param {string} logoFilename - Logo filename
 * @param {string} status - Resource status ('pending', 'approved', etc.)
 * @returns {string} - Complete S3 URL for logo
 */
export function getResourceLogoUrl(logoFilename, status = 'approved') {
  if (!logoFilename) return '';
  
  switch (status?.toLowerCase()) {
    case 'pending':
      return getPendingLogoUrl(logoFilename);
    case 'approved':
    default:
      return getApprovedLogoUrl(logoFilename);
  }
}

/**
 * Generate URL for general logos (uses base logos prefix)
 * @param {string} logoFilename - Logo filename
 * @returns {string} - Complete S3 URL for logo
 */
export function getLogoUrl(logoFilename) {
  if (!logoFilename) return '';
  return getS3Url(logoFilename, S3_CONFIG.LOGOS_PREFIX);
}

/**
 * Extract filename from S3 URL
 * @param {string} s3Url - Full S3 URL
 * @returns {string} - Filename only
 */
export function extractFilenameFromS3Url(s3Url) {
  if (!s3Url) return '';
  
  try {
    const url = new URL(s3Url);
    const pathname = url.pathname;
    return pathname.split('/').pop() || '';
  } catch (error) {
    console.warn('Failed to extract filename from S3 URL:', error);
    return '';
  }
}

/**
 * Check if URL is an S3 URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's an S3 URL
 */
export function isS3Url(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('s3') || urlObj.hostname.includes(S3_CONFIG.BUCKET_NAME);
  } catch (error) {
    return false;
  }
}

/**
 * Get S3 configuration for debugging
 * @returns {object} - S3 configuration object
 */
export function getS3Config() {
  return {
    bucketName: S3_CONFIG.BUCKET_NAME,
    region: S3_CONFIG.REGION,
    baseUrl: S3_CONFIG.BASE_URL,
    logosPrefix: S3_CONFIG.LOGOS_PREFIX,
    pendingLogosPrefix: S3_CONFIG.PENDING_LOGOS_PREFIX,
    approvedLogosPrefix: S3_CONFIG.APPROVED_LOGOS_PREFIX,
  };
}

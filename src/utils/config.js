// Configuration constants for Kelifax
// This centralizes all configuration values and makes them easy to update

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Default API endpoints
  BASE_URL: import.meta.env.PUBLIC_API_URL || 'https://ds7z6al08j.execute-api.us-east-1.amazonaws.com/dev',
  API_KEY: import.meta.env.PUBLIC_API_KEY,
  
  // Request timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 10000,
  LONG_TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

/**
 * Application Constants
 */
export const APP_CONFIG = {
  // Site metadata
  SITE_NAME: 'Kelifax',
  SITE_DESCRIPTION: 'Curated tech resources platform for developers, students, and technology enthusiasts',
  CONTACT_EMAIL: import.meta.env.PUBLIC_CONTACT_EMAIL || 'contact@kelifax.com',
  
  // Pagination
  RESOURCES_PER_PAGE: 12,
  RELATED_RESOURCES_COUNT: 3,
  
  // Search configuration
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  
  // UI constants
  LOADING_DELAY_MS: 200, // Minimum time to show loading indicators
  ANIMATION_DURATION_MS: 200,
};

/**
 * Feature Flags
 */
export const FEATURES = {
  // API features
  ENABLE_API_ENHANCEMENT: true,
  ENABLE_ADMIN_FEATURES: true,
  ENABLE_SEARCH: true,
  
  // UI features
  ENABLE_DARK_MODE: false, // Future feature
  ENABLE_BOOKMARKS: false, // Future feature
  ENABLE_NEWSLETTER: true,
  
  // Development features
  ENABLE_DEBUG_LOGGING: import.meta.env.MODE === 'development',
  ENABLE_MOCK_DATA: false,
};

/**
 * Resource Categories
 */
export const CATEGORIES = [
  'development',
  'design', 
  'learning',
  'productivity',
  'marketing',
  'business',
  'tools',
  'frameworks',
  'databases'
];

/**
 * Resource Status Types (for admin)
 */
export const RESOURCE_STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  PENDING: 'pending'
};

/**
 * Default fallback values
 */
export const DEFAULTS = {
  RESOURCE_IMAGE: '/logos/kelifax.png',
  ERROR_MESSAGE: 'Something went wrong. Please try again later.',
  SUCCESS_MESSAGE: 'Operation completed successfully!',
  LOADING_MESSAGE: 'Loading...',
};

/**
 * Validation rules
 */
export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
};

/**
 * Environment helper
 */
export const ENV = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isPreview: import.meta.env.MODE === 'preview',
};

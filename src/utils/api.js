// API utility functions for Kelifax frontend
// This will be used to interact with AWS Lambda functions via API Gateway

import { API_CONFIG, FEATURES, ENV } from './config.js';

const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<any>} - API response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add API key if available
  const apiKey = API_CONFIG.API_KEY;
  if (apiKey) {
    defaultHeaders['X-Api-Key'] = apiKey;
  } else if (API_CONFIG.USE_API) {
    console.warn('API is enabled but no API key is configured. Requests may fail.');
  }

  const defaultOptions = {
    headers: defaultHeaders,
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      if (FEATURES.ENABLE_DEBUG_LOGGING) {
        console.error('API Error Details:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorText
        });
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (FEATURES.ENABLE_DEBUG_LOGGING) {
      console.error('API Request Error:', error);
    }
    throw error;
  }
}

/**
 * Get existing approved resources in batches for public listing
 * @param {object} options - Request options
 * @param {number} options.batchSize - Number of resources per batch (default: 10, max: 50)
 * @param {string} options.pageToken - Token for pagination (optional)
 * @param {string} options.category - Category filter ('all' or specific category)
 * @returns {Promise<object>} - Response with resources and pagination info
 */
export async function getExistingResources(options = {}) {
  const { batchSize = 10, pageToken = null, category = 'all' } = options;
  
  // Check if API is enabled
  if (API_CONFIG.USE_API) {
    try {
      const requestBody = {
        batchSize: Math.min(batchSize, 50), // Enforce max batch size
        category: category
      };
      
      // Add page token if provided
      if (pageToken) {
        requestBody.pageToken = pageToken;
      }
      
      const response = await apiRequest('/resources', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (response.success && response.data) {
        return {
          resources: response.data.resources || [],
          pagination: response.data.pagination || {}
        };
      } else {
        throw new Error(response.message || 'Failed to fetch resources');
      }
    } catch (error) {
      console.error('Failed to fetch resources from API:', error);
      throw error;
    }
  }
  
  // Throw error if API is disabled
  throw new Error('API is disabled. Please enable API access to load resources.');
}

/**
 * Fetch resources with optional admin privileges (legacy function for admin use)
 * @param {object} filters - Optional filters (resourceStatus, category, etc.)
 * @param {string} authToken - Optional admin authentication token
 * @returns {Promise<Array>} - Array of resources
 */
export async function getResources(filters = {}, authToken = null) {
  // If admin token is provided, use real API for submitted resources
  if (authToken) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/resources${queryParams ? `?${queryParams}` : ''}`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    };

    try {
      const response = await apiRequest(endpoint, options);
      
      // Handle the response format from your Lambda function
      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('API returned error:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch admin resources from API:', error);
      throw error;
    }
  }
  
  // For non-admin usage, always use API
  if (API_CONFIG.USE_API) {
    try {
      const result = await getExistingResources({ batchSize: 100 });
      return result.resources;
    } catch (error) {
      console.error('Failed to fetch resources from API:', error);
      throw error;
    }
  }
  
  // Throw error if API is disabled
  throw new Error('API is disabled. Please enable API access to load resources.');
}

/**
 * Get a specific resource by ID (for backward compatibility)
 * @param {string} id - Resource ID
 * @returns {Promise<object>} - Resource object
 */
export async function getResource(id) {
  try {
    const response = await apiRequest(`/resources/${id}`);
    return response.resource;
  } catch (error) {
    console.error('Failed to fetch resource:', error);
    throw error;
  }
}

/**
 * Get detailed resource data from DynamoDB via API or local fallback
 * This is used when user visits a resource detail page (/resources/{slug})
 * @param {string} slug - Resource slug
 * @returns {Promise<object>} - Full resource details
 */
export async function getResourceDetails(slug) {
  // Check if API is enabled
  if (API_CONFIG.USE_API) {
    try {
      const response = await apiRequest(`/get-resource`, {
        method: 'POST',
        body: JSON.stringify({ slug: slug })
      });
      
      // Handle the response format from your Lambda function
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Resource details not found');
      }
    } catch (error) {
      console.error('Failed to fetch resource details from API:', error);
      throw error;
    }
  }
  
  // Throw error if API is disabled
  throw new Error('API is disabled. Please enable API access to load resource details.');
}

/**
 * Submit a new resource suggestion
 * @param {object} resourceData - Resource data to submit
 * @returns {Promise<object>} - Submission response
 */
export async function submitResource(resourceData) {
  try {
    const response = await apiRequest('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
    return response;
  } catch (error) {
    console.error('Failed to submit resource to API:', error);
    throw error;
  }
}

/**
 * Submit a new resource for review
 * @param {object} resourceSubmission - Complete resource submission data
 * @returns {Promise<object>} - Submission response
 */
export async function submitResourceSubmission(resourceSubmission) {
  try {
    console.log('Resource submission data:', resourceSubmission);
    
    const response = await apiRequest('/submit-resource', {
      method: 'POST',
      body: JSON.stringify(resourceSubmission),
    });
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Resource submitted successfully',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to submit resource',
        errors: response.errors
      };
    }
  } catch (error) {
    console.error('Failed to submit resource:', error);
    throw error;
  }
}

// Old authenticateAdmin function removed - now using AWS Cognito authentication

/**
 * Update resource status (admin only)
 * @param {string} resourceSlug - Resource slug
 * @param {string} resourceStatus - New status (approved, rejected, pending)
 * @param {string} authToken - Admin authentication token
 * @returns {Promise<object>} - Update response
 */
export async function updateResourceStatus(resourceSlug, resourceStatus, authToken) {
  try {
    const response = await apiRequest(`/resources/${resourceSlug}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ resourceStatus }),
    });
    
    // Handle the response format from your Lambda function
    if (response.success) {
      return {
        success: true,
        message: response.message || `Resource status updated to ${resourceStatus}`
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to update resource status'
      };
    }
  } catch (error) {
    console.error('Failed to update resource status:', error);
    throw error;
  }
}

/**
 * Delete a resource (admin only)
 * @param {string} resourceSlug - Resource slug
 * @param {string} authToken - Admin authentication token
 * @returns {Promise<object>} - Delete response
 */
export async function deleteResource(resourceSlug, authToken) {
  try {
    const response = await apiRequest(`/resources/${resourceSlug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    // Handle the response format from your Lambda function
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Resource deleted successfully'
      };
    } else {
      return {
        success: false,
        message: response.message || 'Failed to delete resource'
      };
    }
  } catch (error) {
    console.error('Failed to delete resource:', error);
    throw error;
  }
}

/**
 * Submit contact form
 * @param {object} contactData - Contact form data
 * @returns {Promise<object>} - Submission response
 */
export async function submitContact(contactData) {
  try {
    const response = await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    return response;
  } catch (error) {
    console.error('Failed to submit contact form:', error);
    throw error;
  }
}

// Export utility functions
export {
  apiRequest,
};

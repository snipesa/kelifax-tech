// API utility functions for Kelifax frontend
// This will be used to interact with AWS Lambda functions via API Gateway

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://af3e78t7db.execute-api.us-east-1.amazonaws.com/dev';

// Mock data for development testing
const MOCK_RESOURCES = [
  {
    resourceSlug: 'github-submitted',
    title: 'GitHub',
    description: 'Version control and code collaboration',
    url: 'https://github.com',
    companyEmail: 'contact@github.com',
    status: 'submitted',
    submissionTimestamp: '2024-10-15T10:30:00Z',
    tags: ['development', 'version-control']
  },
  {
    resourceSlug: 'figma-approved',
    title: 'Figma',
    description: 'Design and prototyping tool',
    url: 'https://figma.com',
    companyEmail: 'hello@figma.com',
    status: 'approved',
    submissionTimestamp: '2024-10-14T14:20:00Z',
    tags: ['design', 'prototyping']
  },
  {
    resourceSlug: 'notion-rejected',
    title: 'Notion',
    description: 'All-in-one workspace',
    url: 'https://notion.so',
    companyEmail: 'team@notion.so',
    status: 'rejected',
    submissionTimestamp: '2024-10-13T09:15:00Z',
    tags: ['productivity', 'notes']
  }
];

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
  const apiKey = import.meta.env.PUBLIC_API_KEY;
  if (apiKey) {
    defaultHeaders['x-api-key'] = apiKey;
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
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Fetch resources with optional admin privileges
 * @param {object} filters - Optional filters (status, category, etc.)
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
  
  // For main site (no admin token), use local resources.json
  try {
    const response = await fetch('/src/data/resources.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch resources.json: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.resources || []);
  } catch (error) {
    console.error('Failed to load local resources:', error);
    return [];
  }
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
 * Get detailed resource data from DynamoDB via API
 * This is used when user visits a resource detail page (/resources/{slug})
 * @param {string} slug - Resource slug
 * @returns {Promise<object>} - Full resource details from DynamoDB
 */
export async function getResourceDetails(slug) {
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
    console.error('Failed to fetch resource details:', error);
    throw error;
  }
}

/**
 * Search resources
 * @param {string} query - Search query
 * @param {object} filters - Additional filters
 * @returns {Promise<Array>} - Array of matching resources
 */
export async function searchResources(query, filters = {}) {
  const searchParams = {
    q: query,
    ...filters,
  };
  
  return getResources(searchParams);
}

/**
 * Submit a new resource suggestion
 * @param {object} resourceData - Resource data to submit
 * @returns {Promise<object>} - Submission response
 */
export async function submitResource(resourceData) {
  // Always use real API for resource submission (DynamoDB)
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
 * Authenticate admin user
 * @param {string} password - Admin password
 * @returns {Promise<object>} - Authentication response with token
 */
export async function authenticateAdmin(password) {
  try {
    const response = await apiRequest('/admin-auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    // Handle the response format from your Lambda function
    if (response.success && response.data) {
      return {
        success: true,
        token: response.data.sessionToken,
        expiresAt: response.data.expiresAt
      };
    } else {
      return {
        success: false,
        message: response.message || 'Authentication failed'
      };
    }
  } catch (error) {
    console.error('Failed to authenticate admin:', error);
    return { 
      success: false, 
      message: 'Authentication failed. Please try again.' 
    };
  }
}

/**
 * Update resource status (admin only)
 * @param {string} resourceSlug - Resource slug
 * @param {string} status - New status (approved, rejected, submitted)
 * @param {string} authToken - Admin authentication token
 * @returns {Promise<object>} - Update response
 */
export async function updateResourceStatus(resourceSlug, status, authToken) {
  try {
    const response = await apiRequest(`/resources/${resourceSlug}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status }),
    });
    
    // Handle the response format from your Lambda function
    if (response.success) {
      return {
        success: true,
        message: response.message || `Status updated to ${status}`
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

/**
 * Get resource categories
 * @returns {Promise<Array>} - Array of categories
 */
export async function getCategories() {
  try {
    const response = await apiRequest('/categories');
    return response.categories || [];
  } catch (error) {
    console.warn('Failed to fetch categories from API');
    // Fallback categories
    return ['development', 'design', 'learning', 'productivity', 'marketing', 'business'];
  }
}

/**
 * Get featured resources
 * @returns {Promise<Array>} - Array of featured resources
 */
export async function getFeaturedResources() {
  try {
    const response = await apiRequest('/resources/featured');
    return response.resources || [];
  } catch (error) {
    console.warn('Failed to fetch featured resources from API');
    return [];
  }
}

/**
 * Subscribe to newsletter
 * @param {string} email - Email address
 * @returns {Promise<object>} - Subscription response
 */
export async function subscribeNewsletter(email) {
  try {
    const response = await apiRequest('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  } catch (error) {
    console.error('Failed to subscribe to newsletter:', error);
    throw error;
  }
}

/**
 * Get popular tags
 * @returns {Promise<Array>} - Array of popular tags
 */
export async function getPopularTags() {
  try {
    const response = await apiRequest('/tags/popular');
    return response.tags || [];
  } catch (error) {
    console.warn('Failed to fetch popular tags from API');
    return [];
  }
}

// Export utility functions
export {
  apiRequest,
};

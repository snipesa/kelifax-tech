// API utility functions for Kelifax frontend
// This will be used to interact with AWS Lambda functions via API Gateway

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://api.kelifax.com';

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<any>} - API response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Fetch all resources from the API
 * @param {object} filters - Optional filters (category, tags, search)
 * @returns {Promise<Array>} - Array of resources
 */
export async function getResources(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `/resources${queryParams ? `?${queryParams}` : ''}`;
  
  try {
    const response = await apiRequest(endpoint);
    return response.resources || [];
  } catch (error) {
    console.warn('Failed to fetch resources from API, using fallback data');
    // Fallback to local data when API is not available
    return [];
  }
}

/**
 * Get a specific resource by ID
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
  try {
    const response = await apiRequest('/resources/submit', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
    return response;
  } catch (error) {
    console.error('Failed to submit resource:', error);
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

// Admin API utilities for Kelifax admin section with cookie-based JWT authentication

import { API_CONFIG } from './config.js';

/**
 * Make authenticated admin API request
 * JWT token automatically included via HTTP-only cookies by CloudFront Lambda@Edge
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {object} data - Request data
 * @returns {Promise<any>} - API response
 */
async function adminApiRequest(endpoint, data = {}) {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Include cookies in the request
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }

  return await response.json();
}

/**
 * Get all submitted resources awaiting approval
 * @returns {Promise<Array>} - Array of submitted resources
 */
export async function getSubmittedResources() {
  try {
    const response = await adminApiRequest('/admin/submitted-resources', {
      resourceStatus: 'pending'
    });
    
    // Extract the data array from the API response
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response structure is unexpected, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching submitted resources:', error);
    throw error;
  }
}

/**
 * Approve a submitted resource
 * @param {string} resourceName - Name of resource to approve
 * @returns {Promise<any>} - API response
 */
export async function approveResource(resourceName) {
  try {
    return await adminApiRequest('/admin/approve-resource', {
      resourceName
    });
  } catch (error) {
    console.error('Error approving resource:', error);
    throw error;
  }
}

/**
 * Decline a submitted resource
 * @param {string} resourceName - Name of resource to decline
 * @returns {Promise<any>} - API response
 */
export async function declineResource(resourceName) {
  try {
    return await adminApiRequest('/admin/decline-resource', {
      resourceName
    });
  } catch (error) {
    console.error('Error declining resource:', error);
    throw error;
  }
}

/**
 * Get resource details by name
 * @param {string} resourceName - Name of resource to search for
 * @returns {Promise<any>} - Resource data
 */
export async function getResourceByName(resourceName) {
  try {
    // Convert resource name to slug (lowercase, spaces to hyphens)
    const resourceSlug = resourceName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    // Use public endpoint for resource lookup (no auth required)
    const response = await fetch(`${API_CONFIG.BASE_URL}/get-resource`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: resourceName // Use original name, backend will process it
      })
    });

    if (!response.ok) {
      throw new Error('Resource not found');
    }

    const data = await response.json();
    
    // Extract resource data from API response
    if (response && response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Resource not found');
  } catch (error) {
    console.error('Error getting resource:', error);
    throw error;
  }
}

/**
 * Delete an existing resource
 * @param {string} resourceName - Name of resource to delete
 * @returns {Promise<any>} - API response
 */
export async function deleteResource(resourceName) {
  try {
    return await adminApiRequest('/admin/delete-resource', {
      resourceName
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

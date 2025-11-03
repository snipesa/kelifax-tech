// Admin API utilities for Kelifax admin section

import { API_CONFIG } from './config.js';
import { getAdminToken } from './admin-auth.js';

/**
 * Make authenticated admin API request
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {object} data - Request data
 * @returns {Promise<any>} - API response
 */
async function adminApiRequest(endpoint, data = {}) {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error('No admin token found');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
    return await adminApiRequest('/admin-auth/submitted-resources');
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
    return await adminApiRequest('/admin-auth/approve-resource', {
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
    return await adminApiRequest('/admin-auth/decline-resource', {
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/get-resource`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: resourceName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get resource: ${errorText}`);
    }

    return await response.json();
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
    return await adminApiRequest('/admin-auth/delete-resource', {
      resourceName
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

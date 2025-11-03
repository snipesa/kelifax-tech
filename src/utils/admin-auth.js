// Admin authentication utilities for Kelifax admin section

import { API_CONFIG } from './config.js';

/**
 * Hash password using SHA-256
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - SHA-256 hashed password
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Authenticate admin user
 * @param {string} username - Admin username
 * @param {string} password - Plain text password
 * @returns {Promise<object>} - Authentication result with token
 */
export async function authenticateAdmin(username, password) {
  try {
    const hashedPassword = await hashPassword(password);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/admin-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password: hashedPassword
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Store session token in localStorage
    if (data.data && data.data.sessionToken) {
      localStorage.setItem('admin_token', data.data.sessionToken);
      localStorage.setItem('admin_username', username);
    }
    
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Get stored admin session token
 * @returns {string|null} - Session token or null if not found
 */
export function getAdminToken() {
  return localStorage.getItem('admin_token');
}

/**
 * Get stored admin username
 * @returns {string|null} - Username or null if not found
 */
export function getAdminUsername() {
  return localStorage.getItem('admin_username');
}

/**
 * Check if admin is authenticated
 * @returns {boolean} - True if authenticated
 */
export function isAdminAuthenticated() {
  return !!getAdminToken();
}

/**
 * Logout admin user
 */
export function logoutAdmin() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  window.location.href = '/admin';
}

/**
 * Redirect to login if not authenticated
 */
export function requireAdminAuth() {
  if (!isAdminAuthenticated()) {
    window.location.href = '/admin';
    return false;
  }
  return true;
}

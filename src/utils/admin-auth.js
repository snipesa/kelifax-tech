// Admin authentication utilities for Kelifax admin section using AWS Cognito

import { UserManager } from "oidc-client-ts";

const cognitoAuthConfig = {
    authority: `https://cognito-idp.us-east-1.amazonaws.com/${import.meta.env.PUBLIC_COGNITO_USER_POOL_ID}`,
    client_id: import.meta.env.PUBLIC_COGNITO_CLIENT_ID,
    redirect_uri: import.meta.env.DEV ? 
        import.meta.env.PUBLIC_COGNITO_CALLBACK_URL : 
        `${window.location.origin}/admin/callback`,
    response_type: "code",
    scope: "email openid"
};

// Create a UserManager instance
export const userManager = new UserManager({
    ...cognitoAuthConfig,
});

/**
 * Start Cognito authentication process
 */
export async function initiateAdminLogin() {
    try {
        await userManager.signinRedirect();
    } catch (error) {
        console.error('Login initiation error:', error);
        throw error;
    }
}

/**
 * Handle Cognito callback after authentication
 */
export async function handleAuthCallback() {
    try {
        const user = await userManager.signinRedirectCallback();
        
        // Store Cognito tokens in localStorage with kelifax-specific naming
        localStorage.setItem('kelifax_cognito_access_token', user.access_token);
        localStorage.setItem('kelifax_cognito_id_token', user.id_token);
        localStorage.setItem('kelifax_cognito_refresh_token', user.refresh_token);
        localStorage.setItem('kelifax_cognito_expires_at', user.expires_at);
        
        return user;
    } catch (error) {
        console.error('Auth callback error:', error);
        throw error;
    }
}

/**
 * Get stored Cognito access token
 * @returns {string|null} - Access token or null if not found
 */
export function getAdminToken() {
    const expiresAt = localStorage.getItem('kelifax_cognito_expires_at');
    if (expiresAt && Date.now() / 1000 > parseInt(expiresAt)) {
        // Token expired, try to refresh
        refreshTokenIfNeeded();
        return null;
    }
    return localStorage.getItem('kelifax_cognito_access_token');
}

/**
 * Refresh access token if needed
 */
export async function refreshTokenIfNeeded() {
    try {
        const refreshToken = localStorage.getItem('kelifax_cognito_refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const user = await userManager.signinSilent();
        if (user) {
            localStorage.setItem('kelifax_cognito_access_token', user.access_token);
            localStorage.setItem('kelifax_cognito_id_token', user.id_token);
            localStorage.setItem('kelifax_cognito_expires_at', user.expires_at);
            return user.access_token;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        logoutAdmin();
    }
    return null;
}

/**
 * Check if admin is authenticated
 * @returns {boolean} - True if authenticated
 */
export function isAdminAuthenticated() {
    const accessToken = localStorage.getItem('kelifax_cognito_access_token');
    const expiresAt = localStorage.getItem('kelifax_cognito_expires_at');
    
    if (!accessToken || !expiresAt) {
        return false;
    }
    
    // Check if token is expired
    if (Date.now() / 1000 > parseInt(expiresAt)) {
        return false;
    }
    
    return true;
}

/**
 * Logout admin user and clear all session data
 */
export async function logoutAdmin() {
    // Clear all Cognito tokens from localStorage
    localStorage.removeItem('kelifax_cognito_access_token');
    localStorage.removeItem('kelifax_cognito_id_token');
    localStorage.removeItem('kelifax_cognito_refresh_token');
    localStorage.removeItem('kelifax_cognito_expires_at');
    
    // Redirect to Cognito logout
    const clientId = import.meta.env.PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = `${window.location.origin}/admin`;
    const cognitoDomain = import.meta.env.PUBLIC_COGNITO_DOMAIN;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

/**
 * Redirect to login if not authenticated
 */
export function requireAdminAuth() {
    if (!isAdminAuthenticated()) {
        initiateAdminLogin();
        return false;
    }
    return true;
}

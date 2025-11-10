// Admin authentication utilities for Kelifax admin section using AWS Cognito

import { UserManager } from "oidc-client-ts";

// Validate environment variables
const validateConfig = () => {
    const userPoolId = import.meta.env.PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = import.meta.env.PUBLIC_COGNITO_CLIENT_ID;
    const callbackUrl = import.meta.env.PUBLIC_COGNITO_CALLBACK_URL;
    
    if (!userPoolId) {
        throw new Error('PUBLIC_COGNITO_USER_POOL_ID is not defined in environment variables');
    }
    if (!clientId) {
        throw new Error('PUBLIC_COGNITO_CLIENT_ID is not defined in environment variables');
    }
    
    console.log('Cognito config loaded:', {
        userPoolId,
        clientId,
        callbackUrl: callbackUrl || `${window.location.origin}/admin/callback`
    });
    
    return { userPoolId, clientId, callbackUrl };
};

const { userPoolId, clientId, callbackUrl } = validateConfig();

const cognitoAuthConfig = {
    authority: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`,
    client_id: clientId,
    redirect_uri: callbackUrl || `${window.location.origin}/admin/callback`,
    response_type: "code",
    scope: "email openid phone"
};

// Create a UserManager instance
export const userManager = new UserManager({
    ...cognitoAuthConfig,
    loadUserInfo: true,
    automaticSilentRenew: true,
    includeIdTokenInSilentRenew: true,
    post_logout_redirect_uri: `${window.location.origin}/admin`
});

/**
 * Start Cognito authentication process
 */
export async function initiateAdminLogin() {
    try {
        console.log('Initiating admin login...');
        console.log('Cognito config:', {
            authority: cognitoAuthConfig.authority,
            client_id: cognitoAuthConfig.client_id,
            redirect_uri: cognitoAuthConfig.redirect_uri,
            scope: cognitoAuthConfig.scope
        });
        await userManager.signinRedirect();
    } catch (error) {
        console.error('Login initiation error:', error);
        throw new Error(`Login failed: ${error.message}`);
    }
}

/**
 * Handle Cognito callback after authentication
 */
export async function handleAuthCallback() {
    try {
        console.log('Starting callback processing...');
        console.log('Current URL parameters:', window.location.search);
        
        const user = await userManager.signinRedirectCallback();
        console.log('User received from callback:', {
            profile: user.profile,
            access_token: user.access_token ? 'present' : 'missing',
            id_token: user.id_token ? 'present' : 'missing',
            expires_at: user.expires_at
        });
        
        // Store Cognito tokens in localStorage with kelifax-specific naming
        localStorage.setItem('kelifax_cognito_access_token', user.access_token);
        localStorage.setItem('kelifax_cognito_id_token', user.id_token);
        localStorage.setItem('kelifax_cognito_refresh_token', user.refresh_token || '');
        localStorage.setItem('kelifax_cognito_expires_at', user.expires_at);
        
        console.log('Tokens stored successfully');
        return user;
    } catch (error) {
        console.error('Auth callback error:', error);
        console.error('Error stack:', error.stack);
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

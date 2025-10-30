// Simple client-side API utility for resource details
// This is loaded directly in the browser without module dependencies

// API Configuration from environment
const CLIENT_API_CONFIG = {
  USE_API: true,
  BASE_URL: 'https://ds7z6al08j.execute-api.us-east-1.amazonaws.com/dev',
  API_KEY: 'C50mHXZdBz2JCCArzXIYu6XkapO08G56UhoU9kN0',
};

// Simple API request function
async function clientApiRequest(endpoint, options = {}) {
  const url = `${CLIENT_API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (CLIENT_API_CONFIG.API_KEY) {
    defaultHeaders['X-Api-Key'] = CLIENT_API_CONFIG.API_KEY;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Get detailed resource data
window.getResourceDetails = async function(slug) {
  const response = await clientApiRequest(`/get-resource`, {
    method: 'POST',
    body: JSON.stringify({ slug: slug })
  });
  
  if (response.success && response.data) {
    return response.data;
  } else {
    throw new Error(response.message || 'Resource details not found');
  }
};

// Get resources for related section
window.getResourcesForRelated = async function(options = {}) {
  const { batchSize = 10, pageToken = null, category = 'all' } = options;
  
  const requestBody = {
    batchSize: Math.min(batchSize, 50),
    category: category
  };
  
  if (pageToken) {
    requestBody.pageToken = pageToken;
  }
  
  const response = await clientApiRequest('/resources', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
  
  if (response.success && response.data) {
    return response.data.resources || [];
  } else {
    throw new Error(response.message || 'Failed to fetch resources');
  }
};

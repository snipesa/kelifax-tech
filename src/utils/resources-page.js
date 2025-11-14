// Resources page functionality with API integration
// This handles the batched loading of resources with infinite scroll

// API Configuration - inline to avoid module import issues
const API_CONFIG = {
  USE_API: import.meta.env?.PUBLIC_USE_API === 'true' || window.ENV?.PUBLIC_USE_API === 'true',
  BASE_URL: import.meta.env?.PUBLIC_API_URL || window.ENV?.PUBLIC_API_URL || 'https://ds7z6al08j.execute-api.us-east-1.amazonaws.com/dev',
  API_KEY: import.meta.env?.PUBLIC_API_KEY || window.ENV?.PUBLIC_API_KEY,
};

// State management
let currentCategory = 'all';
let currentPageToken = null;
let loading = false;
let hasMore = true;
let loadedResources = [];
let featuredResources = [];

// DOM elements
let resourcesGrid, featuredGrid, featuredSection, loadingSpinner;
let loadMoreContainer, loadMoreBtn, noMoreResources, resourcesCount, categoryFilters;

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add API key if available
  if (API_CONFIG.API_KEY) {
    defaultHeaders['X-Api-Key'] = API_CONFIG.API_KEY;
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
      console.error('API Error Details:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Get existing approved resources in batches
async function getExistingResources(options = {}) {
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
      console.error('Failed to fetch resources from API, falling back to local data:', error);
      // Fall back to local resources.json
      return await getLocalResources(category, batchSize);
    }
  }
  
  // Use local resources.json when API is disabled
  return await getLocalResources(category, batchSize);
}

// Fallback function to get resources from local JSON file
async function getLocalResources(category = 'all', batchSize = 10) {
  try {
    const response = await fetch('/src/data/resources.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch resources.json: ${response.status}`);
    }
    const data = await response.json();
    const allResources = Array.isArray(data) ? data : (data.resources || []);
    
    // Filter by category if specified
    const filteredResources = category === 'all' 
      ? allResources 
      : allResources.filter(r => r.category === category);
    
    return {
      resources: filteredResources.slice(0, batchSize),
      pagination: {
        hasMore: filteredResources.length > batchSize,
        nextPageToken: null,
        batchSize: batchSize,
        count: Math.min(filteredResources.length, batchSize),
        category: category
      }
    };
  } catch (error) {
    console.error('Failed to load local resources:', error);
    return {
      resources: [],
      pagination: {
        hasMore: false,
        nextPageToken: null,
        batchSize: batchSize,
        count: 0,
        category: category
      }
    };
  }
}

// Initialize page
function initializeResourcesPage() {
  // Get DOM elements
  resourcesGrid = document.getElementById('resources-grid');
  featuredGrid = document.getElementById('featured-grid');
  featuredSection = document.getElementById('featured-section');
  loadingSpinner = document.getElementById('loading-spinner');
  loadMoreContainer = document.getElementById('load-more-container');
  loadMoreBtn = document.getElementById('load-more-btn');
  noMoreResources = document.getElementById('no-more-resources');
  resourcesCount = document.getElementById('resources-count');
  categoryFilters = document.querySelectorAll('.category-filter');

  if (!resourcesGrid) {
    console.error('Resources grid not found');
    return;
  }

  loadInitialResources();
  setupEventListeners();
  setupInfiniteScroll();
}

// Load initial batch of resources
async function loadInitialResources() {
  try {
    loading = true;
    showLoading();
    
    const result = await getExistingResources({ 
      batchSize: 10, 
      category: currentCategory 
    });
    
    loadedResources = result.resources || [];
    currentPageToken = result.pagination?.nextPageToken || null;
    hasMore = result.pagination?.hasMore || false;
    
    // Separate featured resources
    featuredResources = loadedResources.filter(r => r.featured);
    
    renderFeaturedResources();
    renderResources(loadedResources);
    updateResourcesCount(loadedResources.length);
    
    loading = false;
    hideLoading();
    updateLoadMoreButton();
    
  } catch (error) {
    console.error('Error loading initial resources:', error);
    showError('Failed to load resources. Please try again later.');
    loading = false;
    hideLoading();
  }
}

// Load more resources
async function loadMoreResources() {
  if (loading || !hasMore) return;
  
  try {
    loading = true;
    showLoading();
    
    const result = await getExistingResources({ 
      batchSize: 10, 
      category: currentCategory,
      pageToken: currentPageToken
    });
    
    const newResources = result.resources || [];
    loadedResources = [...loadedResources, ...newResources];
    currentPageToken = result.pagination?.nextPageToken || null;
    hasMore = result.pagination?.hasMore || false;
    
    renderResources(newResources, true); // Append mode
    updateResourcesCount(loadedResources.length);
    
    loading = false;
    hideLoading();
    updateLoadMoreButton();
    
  } catch (error) {
    console.error('Error loading more resources:', error);
    showError('Failed to load more resources. Please try again.');
    loading = false;
    hideLoading();
  }
}

// Handle category filter changes
async function handleCategoryChange(newCategory) {
  if (newCategory === currentCategory || loading) return;
  
  currentCategory = newCategory;
  currentPageToken = null;
  hasMore = true;
  loadedResources = [];
  featuredResources = [];
  
  // Update filter button styles
  categoryFilters.forEach(btn => {
    if (btn.dataset.category === newCategory) {
      btn.className = 'category-filter px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors';
    } else {
      btn.className = 'category-filter px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors capitalize';
    }
  });
  
  // Clear grids and reload
  resourcesGrid.innerHTML = '';
  if (featuredGrid) {
    featuredGrid.innerHTML = '';
    featuredSection.style.display = 'none';
  }
  
  await loadInitialResources();
}

// Render featured resources
function renderFeaturedResources() {
  if (!featuredGrid || featuredResources.length === 0) {
    if (featuredSection) featuredSection.style.display = 'none';
    return;
  }
  
  featuredSection.style.display = 'block';
  featuredGrid.innerHTML = featuredResources.slice(0, 6).map(resource => 
    createResourceCardHTML(resource)
  ).join('');
}

// Render resources
function renderResources(resources, append = false) {
  const resourcesHTML = resources.map(resource => 
    createResourceCardHTML(resource)
  ).join('');
  
  if (append) {
    resourcesGrid.innerHTML += resourcesHTML;
  } else {
    resourcesGrid.innerHTML = resourcesHTML;
  }
}

// Create resource card HTML
function createResourceCardHTML(resource) {
  const imageUrl = resource.image ? `/logos/${resource.image}` : '/logos/kelifax.png';
  const tagsHTML = resource.tags?.slice(0, 3).map(tag => 
    `<span class="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">${tag}</span>`
  ).join('') || '';
  
  return `
    <article class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <img src="${imageUrl}" alt="${resource.title}" class="w-12 h-12 rounded-lg object-cover bg-gray-100" onerror="this.src='/logos/kelifax.png'">
            <div>
              <h3 class="font-semibold text-gray-900 text-lg">${resource.title}</h3>
              <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full capitalize">${resource.category}</span>
            </div>
          </div>
          ${resource.featured ? '<span class="text-yellow-500 text-sm">★ Featured</span>' : ''}
        </div>
        
        <p class="text-gray-600 text-sm mb-4 line-clamp-3">${resource.description}</p>
        
        <div class="flex flex-wrap gap-1 mb-4">
          ${tagsHTML}
        </div>
        
        <div class="flex items-center justify-between">
          <a href="/resource/${resource.slug}" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Learn More →
          </a>
          <a href="${resource.url || '#'}" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-gray-700 text-sm">
            Visit Site ↗
          </a>
        </div>
      </div>
    </article>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Category filter buttons
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      handleCategoryChange(btn.dataset.category);
    });
  });
  
  // Load more button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreResources);
  }
}

// Setup infinite scroll
function setupInfiniteScroll() {
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.offsetHeight;
        
        // Load more when user is 200px from bottom
        if (scrollTop + windowHeight >= docHeight - 200 && hasMore && !loading) {
          loadMoreResources();
        }
        
        ticking = false;
      });
      ticking = true;
    }
  });
}

// UI helper functions
function showLoading() {
  if (loadingSpinner) loadingSpinner.style.display = 'flex';
}

function hideLoading() {
  if (loadingSpinner) loadingSpinner.style.display = 'none';
}

function updateLoadMoreButton() {
  if (hasMore && !loading) {
    if (loadMoreContainer) loadMoreContainer.style.display = 'flex';
    if (noMoreResources) noMoreResources.style.display = 'none';
  } else if (!hasMore) {
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    if (noMoreResources) noMoreResources.style.display = 'block';
  } else {
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    if (noMoreResources) noMoreResources.style.display = 'none';
  }
}

function updateResourcesCount(count) {
  if (resourcesCount) {
    resourcesCount.textContent = `${count} resource${count !== 1 ? 's' : ''} loaded`;
  }
}

function showError(message) {
  if (resourcesGrid) {
    resourcesGrid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-600">${message}</p>
        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeResourcesPage);
} else {
  initializeResourcesPage();
}

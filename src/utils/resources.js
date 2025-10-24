import resourcesData from '../data/resources.json';

/**
 * Get all resources from local JSON
 * @returns {Promise<Array>} All resources
 */
export async function getAllResources() {
  // Always use local JSON for main resource listing
  return resourcesData;
}

/**
 * Get a resource by title (case-insensitive)
 * @param {string} title - Resource title
 * @returns {Promise<Object|null>} Resource object or null if not found
 */
export async function getResourceByTitle(title) {
  const allResources = await getAllResources();
  return allResources.find(resource => 
    resource.title.toLowerCase() === title.toLowerCase()
  ) || null;
}

/**
 * Get a resource by slug from local JSON
 * @param {string} slug - Resource slug
 * @returns {Promise<Object|null>} Resource object or null if not found
 */
export async function getResourceBySlug(slug) {
  // Always use local JSON for basic resource lookup
  const allResources = await getAllResources();
  return allResources.find(resource => resource.slug === slug) || null;
}

/**
 * Get resources by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of resources in the category
 */
export async function getResourcesByCategory(category) {
  const allResources = await getAllResources();
  return allResources.filter(resource => 
    resource.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get featured resources
 * @returns {Promise<Array>} Array of featured resources
 */
export async function getFeaturedResources() {
  const allResources = await getAllResources();
  return allResources.filter(resource => resource.featured === true);
}

/**
 * Get resources with enhanced data (keyFeatures, useCases, learningResources)
 * @returns {Promise<Array>} Array of enhanced resources
 */
export async function getEnhancedResources() {
  const allResources = await getAllResources();
  return allResources.filter(resource => 
    resource.keyFeatures || resource.useCases || resource.learningResources
  );
}

/**
 * Search resources by title, description, or tags
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching resources
 */
export async function searchResources(query) {
  const allResources = await getAllResources();
  const searchTerm = query.toLowerCase();
  return allResources.filter(resource => 
    resource.title.toLowerCase().includes(searchTerm) ||
    resource.description.toLowerCase().includes(searchTerm) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

/**
 * Get all unique categories
 * @returns {Promise<Array>} Array of unique category names
 */
export async function getCategories() {
  const allResources = await getAllResources();
  return [...new Set(allResources.map(resource => resource.category))];
}

/**
 * Get all unique tags
 * @returns {Promise<Array>} Array of unique tag names
 */
export async function getAllTags() {
  const allResources = await getAllResources();
  const allTags = allResources.flatMap(resource => resource.tags);
  return [...new Set(allTags)];
}

/**
 * Get related resources based on category and tags
 * @param {Object} resource - The reference resource
 * @param {number} limit - Maximum number of related resources to return
 * @returns {Promise<Array>} Array of related resources
 */
export async function getRelatedResources(resource, limit = 3) {
  if (!resource) return [];
  
  const allResources = await getAllResources();
  return allResources
    .filter(r => r.slug !== resource.slug)
    .map(r => {
      let score = 0;
      
      // Same category gets higher score
      if (r.category === resource.category) score += 3;
      
      // Common tags increase score
      const commonTags = r.tags.filter(tag => resource.tags.includes(tag));
      score += commonTags.length;
      
      return { resource: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.resource);
}

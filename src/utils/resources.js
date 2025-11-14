import resourcesData from '../data/resources.json';

/**
 * Get a resource by slug from local JSON
 * @param {string} slug - Resource slug
 * @returns {Object|null} Resource object or null if not found
 */
export function getResourceBySlug(slug) {
  return resourcesData.find(resource => resource.slug === slug) || null;
}

/**
 * Get related resources based on category and tags
 * @param {Object} resource - The reference resource
 * @param {number} limit - Maximum number of related resources to return
 * @returns {Array} Array of related resources
 */
export function getRelatedResources(resource, limit = 3) {
  if (!resource) return [];
  
  return resourcesData
    .filter(r => r.slug !== resource.slug)
    .map(r => {
      let score = 0;
      
      // Same category gets higher score
      if (r.category === resource.category) score += 3;
      
      // Common tags increase score
      const commonTags = r.tags?.filter(tag => resource.tags?.includes(tag)) || [];
      score += commonTags.length;
      
      return { resource: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.resource);
}

/**
 * Search resources by title, description, or tags
 * @param {string} query - Search query
 * @returns {Array} Array of matching resources
 */
export function searchResources(query) {
  const searchTerm = query.toLowerCase();
  return resourcesData.filter(resource => 
    resource.title.toLowerCase().includes(searchTerm) ||
    resource.description.toLowerCase().includes(searchTerm) ||
    resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

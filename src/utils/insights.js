// Utility functions for insights management
import { getCollection } from 'astro:content';

/**
 * Get all insights sorted by publish date
 * @param {number} limit - Limit number of insights returned
 * @returns {Promise<Array>} - Array of insights
 */
export async function getInsights(limit = null) {
  const insights = await getCollection('insights');
  const sortedInsights = insights.sort((a, b) => 
    new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
  );
  
  if (limit) {
    return sortedInsights.slice(0, limit);
  }
  
  return sortedInsights;
}

/**
 * Get featured insights only
 * @param {number} limit - Limit number of insights returned
 * @returns {Promise<Array>} - Array of featured insights
 */
export async function getFeaturedInsights(limit = null) {
  const insights = await getInsights();
  const featured = insights.filter(insight => insight.data.featured);
  
  if (limit) {
    return featured.slice(0, limit);
  }
  
  return featured;
}

/**
 * Get insights by category
 * @param {string} category - Category to filter by
 * @param {number} limit - Limit number of insights returned
 * @returns {Promise<Array>} - Array of insights in category
 */
export async function getInsightsByCategory(category, limit = null) {
  const insights = await getInsights();
  const filtered = insights.filter(insight => 
    insight.data.category === category
  );
  
  if (limit) {
    return filtered.slice(0, limit);
  }
  
  return filtered;
}

/**
 * Get insights by tag
 * @param {string} tag - Tag to filter by
 * @param {number} limit - Limit number of insights returned
 * @returns {Promise<Array>} - Array of insights with tag
 */
export async function getInsightsByTag(tag, limit = null) {
  const insights = await getInsights();
  const filtered = insights.filter(insight => 
    insight.data.tags.includes(tag)
  );
  
  if (limit) {
    return filtered.slice(0, limit);
  }
  
  return filtered;
}

/**
 * Get related insights based on tags and category
 * @param {object} currentInsight - Current insight object
 * @param {number} limit - Limit number of related insights
 * @returns {Promise<Array>} - Array of related insights
 */
export async function getRelatedInsights(currentInsight, limit = 3) {
  const allInsights = await getInsights();
  
  // Filter out current insight
  const otherInsights = allInsights.filter(
    insight => insight.slug !== currentInsight.slug
  );
  
  // Score insights based on shared tags and category
  const scoredInsights = otherInsights.map(insight => {
    let score = 0;
    
    // Same category gets higher score
    if (insight.data.category === currentInsight.data.category) {
      score += 10;
    }
    
    // Shared tags get points
    const sharedTags = insight.data.tags.filter(tag => 
      currentInsight.data.tags.includes(tag)
    );
    score += sharedTags.length * 5;
    
    return { ...insight, score };
  });
  
  // Sort by score and return top results
  return scoredInsights
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get all unique tags from insights
 * @returns {Promise<Array>} - Array of unique tags
 */
export async function getAllInsightTags() {
  const insights = await getInsights();
  const allTags = insights.flatMap(insight => insight.data.tags);
  return [...new Set(allTags)].sort();
}

/**
 * Get all unique categories from insights
 * @returns {Promise<Array>} - Array of unique categories
 */
export async function getAllInsightCategories() {
  const insights = await getInsights();
  const allCategories = insights
    .map(insight => insight.data.category)
    .filter(Boolean);
  return [...new Set(allCategories)].sort();
}

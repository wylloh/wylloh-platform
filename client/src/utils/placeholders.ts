/**
 * Utility for generating placeholder images with categories based on content title
 */

/**
 * Analyzes the title to determine the most relevant image category
 */
function getCategoryFromTitle(title: string): string {
  // Convert title to lowercase for easier matching
  const lowerTitle = title.toLowerCase();
  
  // Define category mappings with keywords
  const categoryMappings: Record<string, string[]> = {
    'nature': ['nature', 'wildlife', 'forest', 'mountain', 'ocean', 'unveiled'],
    'technology': ['digital', 'tech', 'blockchain', 'future', 'innovation', 'frontier'],
    'urban': ['city', 'urban', 'architecture', 'building', 'street', 'metropolitan', 'landscape'],
    'food': ['culinary', 'cuisine', 'food', 'cooking', 'gastronomy', 'chef', 'restaurant'],
    'music': ['music', 'symphony', 'concert', 'song', 'musical', 'orchestra', 'melody', 'emotional'],
    'sports': ['sport', 'athlete', 'game', 'Olympic', 'championship', 'legend', 'competition'],
    'science-fiction': ['future', 'sci-fi', 'space', 'alien', 'robot', 'horizon', 'technolog'],
    'art': ['art', 'painting', 'creative', 'design', 'artist', 'gallery', 'exhibition'],
    'history': ['history', 'ancient', 'vintage', 'classic', 'historical', 'past', 'legacy'],
    'travel': ['travel', 'journey', 'adventure', 'explore', 'destination', 'tourism']
  };
  
  // Check for each category if the title contains any of its keywords
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }
  
  // If no specific category is matched, use film type classification
  if (lowerTitle.includes('documentary')) return 'documentary';
  if (lowerTitle.includes('animation')) return 'animation';
  if (lowerTitle.includes('horror')) return 'dark';
  if (lowerTitle.includes('comedy')) return 'funny';
  
  // Default to cinematic if no matches
  return 'cinematic';
}

/**
 * Generates a placeholder image URL with appropriate category based on title
 */
export function generatePlaceholderImage(
  seed: string, 
  width: number = 800, 
  height: number = 500
): string {
  // Use a consistent hash function to generate a stable placeholder
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Determine appropriate category based on the title
  const category = getCategoryFromTitle(seed);
  
  // Generate and return URL with the seed's hash and appropriate category
  const seedNumber = hashCode(seed);
  return `https://picsum.photos/seed/${seedNumber}/${width}/${height}?${category}`;
}
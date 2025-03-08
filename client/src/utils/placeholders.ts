export function generatePlaceholderImage(
    seed: string, 
    width: number = 800, 
    height: number = 500, 
    category: string = 'cinematic-adventure'
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
  
    const seedNumber = hashCode(seed);
    return `https://picsum.photos/seed/${seedNumber}/${width}/${height}?${category}`;
  }
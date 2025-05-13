import { LibraryItem } from '../../services/library.service';
import { TokenCollection } from './ContentSelectionToolbar';

// Extended LibraryItem with UI-specific fields that are present in the app but not in the base type
interface ExtendedLibraryItem extends LibraryItem {
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  genre?: string;
  contentType?: string;
  director?: string;
  creator?: string;
  year?: number;
}

/**
 * Organizes library items into collections based on content/film
 * Each collection represents tokens for the same content
 */
export const organizeTokenCollections = (items: LibraryItem[]): TokenCollection[] => {
  // Group items by their underlying content
  const collectionMap = new Map<string, LibraryItem[]>();
  
  // First, identify content by contract address and token ID prefix
  // Tokens from the same film will have the same contract address and often similar token IDs
  items.forEach(item => {
    if (!item.tokenData) return; // Skip non-tokenized items
    
    const contractAddress = item.tokenData.contractAddress;
    let collectionKey = '';
    
    const extendedItem = item as ExtendedLibraryItem;
    
    // Try to identify the collection
    // Option 1: Use contractAddress + any collection identifier in the token metadata
    if (item.tokenData.metadata && 
        item.tokenData.metadata.collectionId) {
      collectionKey = `${contractAddress}-${item.tokenData.metadata.collectionId}`;
    } 
    // Option 2: Use the contract address and title
    else if (extendedItem.title) {
      collectionKey = `${contractAddress}-${extendedItem.title}`;
    }
    // Option 3: Just use the contract address
    else {
      collectionKey = contractAddress;
    }
    
    // Add item to the collection
    if (!collectionMap.has(collectionKey)) {
      collectionMap.set(collectionKey, []);
    }
    collectionMap.get(collectionKey)!.push(item);
  });
  
  // Transform the map into TokenCollection array
  const collections: TokenCollection[] = Array.from(collectionMap.entries())
    .map(([key, collectionItems]) => {
      // Use the first item to get collection details
      const firstItem = collectionItems[0] as ExtendedLibraryItem;
      
      // Calculate total value of all tokens in the collection
      const totalValue = collectionItems.reduce((sum, item) => sum + (item.currentValue || 0), 0);
      
      return {
        contentId: key,
        title: firstItem.title || `Collection (${collectionItems.length} tokens)`,
        totalTokens: collectionItems.length,
        selectedTokens: 0, // Start with no selected tokens
        items: collectionItems,
        value: totalValue
      };
    })
    // Sort by token count (descending)
    .sort((a, b) => b.totalTokens - a.totalTokens);
  
  return collections;
};

/**
 * Updates the selectedTokens count in collections based on the selected items
 */
export const updateCollectionSelections = (
  collections: TokenCollection[],
  selectedIds: string[]
): TokenCollection[] => {
  return collections.map(collection => {
    // Count how many items from this collection are selected
    const selectedCount = collection.items.filter(
      item => selectedIds.includes(item.contentId)
    ).length;
    
    return {
      ...collection,
      selectedTokens: selectedCount
    };
  });
};

/**
 * Gets a flattened list of all collection items
 */
export const getAllCollectionItems = (collections: TokenCollection[]): LibraryItem[] => {
  return collections.flatMap(collection => collection.items);
}; 
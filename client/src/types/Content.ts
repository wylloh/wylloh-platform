export interface Content {
  id: string;
  title: string;
  description: string;
  contentType: string;
  creator: string;
  creatorAddress: string;
  mainFileCid: string;
  previewCid?: string;
  thumbnailCid?: string;
  image?: string;
  metadata: Record<string, any>;
  tokenized: boolean;
  tokenId?: string;
  price?: number;
  available?: number;
  totalSupply?: number;
  createdAt: string;
  status: 'draft' | 'pending' | 'active';
  visibility: 'public' | 'private' | 'unlisted';
  views: number;
  sales: number;
  rightsThresholds?: Array<{quantity: number, type: string}>;
}

// Add interface for purchased content
export interface PurchasedContent extends Content {
  purchaseDate: string;
  purchasePrice: number;
  purchaseQuantity: number;
} 
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { storageService } from './storage.service';
import { cdnService } from './cdn.service';

/**
 * Standard metadata field types
 */
export enum MetadataFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  BOOLEAN = 'boolean',
  REFERENCE = 'reference'
}

/**
 * Content type definitions
 */
export enum ContentType {
  MOVIE = 'movie',
  SERIES = 'series',
  SHORT = 'short',
  MUSIC = 'music',
  PODCAST = 'podcast',
  EBOOK = 'ebook',
  ART = 'art',
  OTHER = 'other'
}

/**
 * Metadata field definition
 */
export interface MetadataField {
  name: string;
  displayName: string;
  type: MetadataFieldType;
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: any;
  validation?: RegExp | string;
  contentTypes: ContentType[];
}

/**
 * Metadata schema version
 */
export interface MetadataSchema {
  version: string;
  fields: MetadataField[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata validation error
 */
export interface MetadataValidationError {
  field: string;
  message: string;
}

/**
 * Content metadata interface
 */
export interface ContentMetadata {
  title: string;
  description?: string;
  contentType: ContentType;
  creator?: string;
  creatorAddress?: string;
  releaseYear?: number;
  duration?: number;
  genre?: string[];
  tags?: string[];
  language?: string;
  country?: string;
  cast?: string[];
  director?: string;
  producer?: string;
  writer?: string;
  studio?: string;
  awards?: string[];
  rating?: {
    value: number;
    source?: string;
    count?: number;
  };
  parentalRating?: string;
  explicit?: boolean;
  references?: {
    imdb?: string;
    tmdb?: string;
    tvdb?: string;
    musicbrainz?: string;
    custom?: Record<string, string>;
  };
  customFields?: Record<string, any>;
  version: string;
  [key: string]: any;
}

/**
 * Metadata search filters
 */
export interface MetadataSearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';
  value: any;
}

/**
 * Metadata query options
 */
export interface MetadataQueryOptions {
  filters?: MetadataSearchFilter[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
  includeFields?: string[];
  excludeFields?: string[];
}

/**
 * Metadata service for managing content metadata
 */
class MetadataService {
  private schema: MetadataSchema | null = null;
  private metadataCache = new Map<string, ContentMetadata>();
  private initialized = false;
  
  /**
   * Initialize metadata service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Get current schema
      await this.getSchema();
      
      // Load cached metadata
      this.loadCachedMetadata();
      
      this.initialized = true;
      console.log('MetadataService: Initialized successfully');
    } catch (error) {
      console.error('MetadataService: Initialization failed', error);
    }
  }
  
  /**
   * Load cached metadata from storage
   */
  private loadCachedMetadata(): void {
    try {
      const cachedMetadataKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('wylloh_meta_'));
        
      for (const key of cachedMetadataKeys) {
        const metadataStr = localStorage.getItem(key);
        if (metadataStr) {
          try {
            const metadata = JSON.parse(metadataStr);
            if (metadata.contentId) {
              this.metadataCache.set(metadata.contentId, metadata);
            }
          } catch (e) {
            console.warn(`MetadataService: Failed to parse cached metadata for ${key}`);
          }
        }
      }
      
      console.log(`MetadataService: Loaded ${this.metadataCache.size} cached metadata items`);
    } catch (error) {
      console.error('MetadataService: Error loading cached metadata', error);
    }
  }
  
  /**
   * Get current metadata schema
   */
  public async getSchema(): Promise<MetadataSchema> {
    try {
      if (this.schema) return this.schema;
      
      // Try to get from cache first
      const cachedSchema = storageService.retrieve('metadata_schema');
      if (cachedSchema) {
        this.schema = JSON.parse(cachedSchema);
        return this.schema;
      }
      
      // Get from API
      const response = await axios.get(`${API_BASE_URL}/api/metadata/schema`);
      this.schema = response.data;
      
      // Cache the schema
      storageService.store('metadata_schema', JSON.stringify(this.schema), {
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
      
      return this.schema;
    } catch (error) {
      console.error('MetadataService: Error getting schema', error);
      
      // Use default schema if API fails
      this.schema = this.getDefaultSchema();
      return this.schema;
    }
  }
  
  /**
   * Get default metadata schema
   */
  private getDefaultSchema(): MetadataSchema {
    const now = new Date().toISOString();
    
    return {
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      fields: [
        {
          name: 'title',
          displayName: 'Title',
          type: MetadataFieldType.TEXT,
          required: true,
          description: 'Title of the content',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'description',
          displayName: 'Description',
          type: MetadataFieldType.TEXT,
          required: false,
          description: 'Description of the content',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'contentType',
          displayName: 'Content Type',
          type: MetadataFieldType.TEXT,
          required: true,
          description: 'Type of content',
          options: Object.values(ContentType),
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'releaseYear',
          displayName: 'Release Year',
          type: MetadataFieldType.NUMBER,
          required: false,
          description: 'Year the content was released',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'duration',
          displayName: 'Duration',
          type: MetadataFieldType.NUMBER,
          required: false,
          description: 'Duration in seconds',
          contentTypes: [ContentType.MOVIE, ContentType.SERIES, ContentType.SHORT, ContentType.MUSIC, ContentType.PODCAST]
        },
        {
          name: 'genre',
          displayName: 'Genre',
          type: MetadataFieldType.ARRAY,
          required: false,
          description: 'Genres of the content',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'tags',
          displayName: 'Tags',
          type: MetadataFieldType.ARRAY,
          required: false,
          description: 'Tags for the content',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'language',
          displayName: 'Language',
          type: MetadataFieldType.TEXT,
          required: false,
          description: 'Primary language of the content',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'country',
          displayName: 'Country',
          type: MetadataFieldType.TEXT,
          required: false,
          description: 'Country of origin',
          contentTypes: Object.values(ContentType)
        },
        {
          name: 'cast',
          displayName: 'Cast',
          type: MetadataFieldType.ARRAY,
          required: false,
          description: 'Cast members',
          contentTypes: [ContentType.MOVIE, ContentType.SERIES, ContentType.SHORT]
        },
        {
          name: 'director',
          displayName: 'Director',
          type: MetadataFieldType.TEXT,
          required: false,
          description: 'Director of the content',
          contentTypes: [ContentType.MOVIE, ContentType.SERIES, ContentType.SHORT]
        },
        {
          name: 'studio',
          displayName: 'Studio',
          type: MetadataFieldType.TEXT,
          required: false,
          description: 'Studio or publisher',
          contentTypes: Object.values(ContentType)
        }
      ]
    };
  }
  
  /**
   * Create or update content metadata
   * 
   * @param contentId Content ID
   * @param metadata Metadata to store
   * @returns Updated metadata
   */
  public async updateMetadata(contentId: string, metadata: Partial<ContentMetadata>): Promise<ContentMetadata> {
    try {
      // Validate metadata
      const validationErrors = this.validateMetadata(metadata);
      if (validationErrors.length > 0) {
        throw new Error(`Metadata validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      
      // Get existing metadata if any
      const existingMetadata = await this.getMetadata(contentId);
      
      // Merge with existing metadata
      const updatedMetadata: ContentMetadata = {
        ...existingMetadata,
        ...metadata,
        version: this.schema?.version || '1.0.0'
      };
      
      // Update metadata on the API
      const response = await axios.post(
        `${API_BASE_URL}/api/content/${contentId}/metadata`,
        { metadata: updatedMetadata },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Save to cache
      this.metadataCache.set(contentId, updatedMetadata);
      
      // Save to local storage
      storageService.store(`content_metadata_${contentId}`, JSON.stringify(updatedMetadata), {
        contentId,
        updatedAt: Date.now()
      });
      
      return updatedMetadata;
    } catch (error) {
      console.error(`MetadataService: Error updating metadata for ${contentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get metadata for content
   * 
   * @param contentId Content ID
   * @returns Content metadata
   */
  public async getMetadata(contentId: string): Promise<ContentMetadata> {
    try {
      // Check cache first
      if (this.metadataCache.has(contentId)) {
        return this.metadataCache.get(contentId)!;
      }
      
      // Check local storage
      const cachedMetadata = storageService.retrieve(`content_metadata_${contentId}`);
      if (cachedMetadata) {
        const parsedMetadata = JSON.parse(cachedMetadata);
        this.metadataCache.set(contentId, parsedMetadata);
        return parsedMetadata;
      }
      
      // Fetch from API
      const response = await axios.get(`${API_BASE_URL}/api/content/${contentId}/metadata`);
      
      if (response.data && response.data.metadata) {
        // Cache the metadata
        this.metadataCache.set(contentId, response.data.metadata);
        
        // Store in local storage
        storageService.store(
          `content_metadata_${contentId}`,
          JSON.stringify(response.data.metadata),
          {
            contentId,
            updatedAt: Date.now()
          }
        );
        
        return response.data.metadata;
      } else {
        throw new Error('No metadata found');
      }
    } catch (error) {
      console.error(`MetadataService: Error getting metadata for ${contentId}`, error);
      
      // Return empty metadata with version
      return {
        title: '',
        contentType: ContentType.OTHER,
        version: this.schema?.version || '1.0.0'
      };
    }
  }
  
  /**
   * Get metadata from IPFS by metadata CID
   * 
   * @param metadataCid IPFS CID for metadata
   * @returns Content metadata
   */
  public async getMetadataFromIpfs(metadataCid: string): Promise<ContentMetadata> {
    try {
      // Get gateway URL
      const gatewayUrl = cdnService.getOptimizedUrl(metadataCid);
      
      // Fetch metadata
      const response = await axios.get(gatewayUrl);
      
      // Validate and return
      const metadata = response.data;
      return metadata;
    } catch (error) {
      console.error(`MetadataService: Error getting metadata from IPFS ${metadataCid}`, error);
      throw error;
    }
  }
  
  /**
   * Validate metadata against schema
   * 
   * @param metadata Metadata to validate
   * @returns Array of validation errors
   */
  public validateMetadata(metadata: Partial<ContentMetadata>): MetadataValidationError[] {
    if (!this.schema) {
      this.getSchema().catch(err => console.error('Error loading schema:', err));
      return [{ field: 'schema', message: 'Schema not loaded' }];
    }
    
    const errors: MetadataValidationError[] = [];
    
    // Check required fields
    for (const field of this.schema.fields) {
      if (field.required) {
        // If field is required for this content type
        if (
          !metadata.contentType || 
          field.contentTypes.includes(metadata.contentType as ContentType)
        ) {
          if (metadata[field.name] === undefined || metadata[field.name] === null || metadata[field.name] === '') {
            errors.push({
              field: field.name,
              message: `${field.displayName} is required`
            });
          }
        }
      }
      
      // Check field type if value is provided
      if (metadata[field.name] !== undefined && metadata[field.name] !== null) {
        const value = metadata[field.name];
        
        switch (field.type) {
          case MetadataFieldType.TEXT:
            if (typeof value !== 'string') {
              errors.push({
                field: field.name,
                message: `${field.displayName} must be text`
              });
            }
            break;
            
          case MetadataFieldType.NUMBER:
            if (typeof value !== 'number') {
              errors.push({
                field: field.name,
                message: `${field.displayName} must be a number`
              });
            }
            break;
            
          case MetadataFieldType.DATE:
            if (isNaN(Date.parse(value))) {
              errors.push({
                field: field.name,
                message: `${field.displayName} must be a valid date`
              });
            }
            break;
            
          case MetadataFieldType.ARRAY:
            if (!Array.isArray(value)) {
              errors.push({
                field: field.name,
                message: `${field.displayName} must be an array`
              });
            }
            break;
            
          case MetadataFieldType.BOOLEAN:
            if (typeof value !== 'boolean') {
              errors.push({
                field: field.name,
                message: `${field.displayName} must be a boolean`
              });
            }
            break;
        }
        
        // Check options if defined
        if (field.options && field.options.length > 0) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (!field.options.includes(item)) {
                errors.push({
                  field: field.name,
                  message: `${item} is not a valid option for ${field.displayName}`
                });
              }
            }
          } else if (!field.options.includes(value)) {
            errors.push({
              field: field.name,
              message: `${value} is not a valid option for ${field.displayName}`
            });
          }
        }
        
        // Check custom validation if defined
        if (field.validation) {
          let isValid = true;
          
          if (field.validation instanceof RegExp) {
            isValid = field.validation.test(String(value));
          } else if (typeof field.validation === 'string') {
            const regex = new RegExp(field.validation);
            isValid = regex.test(String(value));
          }
          
          if (!isValid) {
            errors.push({
              field: field.name,
              message: `${field.displayName} has an invalid format`
            });
          }
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Search metadata by query and filters
   * 
   * @param contentType Optional content type to filter by
   * @param query Text query to search
   * @param options Query options
   * @returns Array of content metadata matching the query
   */
  public async searchMetadata(
    contentType?: ContentType,
    query?: string,
    options: MetadataQueryOptions = {}
  ): Promise<{ metadata: ContentMetadata[], total: number }> {
    try {
      // Build query parameters
      const params: any = {
        limit: options.limit || 20,
        offset: options.offset || 0
      };
      
      if (contentType) {
        params.contentType = contentType;
      }
      
      if (query) {
        params.query = query;
      }
      
      if (options.filters && options.filters.length > 0) {
        params.filters = JSON.stringify(options.filters);
      }
      
      if (options.sort) {
        params.sort = `${options.sort.field}:${options.sort.direction}`;
      }
      
      if (options.includeFields && options.includeFields.length > 0) {
        params.fields = options.includeFields.join(',');
      }
      
      if (options.excludeFields && options.excludeFields.length > 0) {
        params.exclude = options.excludeFields.join(',');
      }
      
      // Make API request
      const response = await axios.get(`${API_BASE_URL}/api/metadata/search`, { params });
      
      return {
        metadata: response.data.items,
        total: response.data.total
      };
    } catch (error) {
      console.error('MetadataService: Error searching metadata', error);
      return { metadata: [], total: 0 };
    }
  }
  
  /**
   * Index metadata for faster searching
   * 
   * @param contentId Content ID
   * @param metadata Metadata to index
   */
  public async indexMetadata(contentId: string, metadata: ContentMetadata): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/metadata/index`,
        { contentId, metadata },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log(`MetadataService: Indexed metadata for ${contentId}`);
    } catch (error) {
      console.error(`MetadataService: Error indexing metadata for ${contentId}`, error);
    }
  }
  
  /**
   * Generate metadata from content
   * 
   * @param contentId Content ID
   * @param contentType Content type
   * @returns Generated metadata
   */
  public async generateMetadata(contentId: string, contentType: ContentType): Promise<ContentMetadata> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/metadata/generate`,
        { contentId, contentType },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data.metadata;
    } catch (error) {
      console.error(`MetadataService: Error generating metadata for ${contentId}`, error);
      
      // Return basic metadata
      return {
        title: 'Generated Title',
        description: 'Generated description',
        contentType,
        version: this.schema?.version || '1.0.0'
      };
    }
  }
  
  /**
   * Get metadata for multiple content items
   * 
   * @param contentIds Array of content IDs
   * @returns Map of content ID to metadata
   */
  public async getBulkMetadata(contentIds: string[]): Promise<Map<string, ContentMetadata>> {
    try {
      // Create a map for results
      const results = new Map<string, ContentMetadata>();
      
      // First check cache for all IDs
      const missingIds: string[] = [];
      
      for (const id of contentIds) {
        if (this.metadataCache.has(id)) {
          results.set(id, this.metadataCache.get(id)!);
        } else {
          missingIds.push(id);
        }
      }
      
      // If all found in cache, return immediately
      if (missingIds.length === 0) {
        return results;
      }
      
      // Fetch missing metadata from API
      const response = await axios.post(
        `${API_BASE_URL}/api/metadata/bulk`,
        { contentIds: missingIds },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Process response
      if (response.data && response.data.metadata) {
        for (const [id, metadata] of Object.entries(response.data.metadata)) {
          results.set(id, metadata as ContentMetadata);
          
          // Update cache
          this.metadataCache.set(id, metadata as ContentMetadata);
          
          // Store in local storage
          storageService.store(
            `content_metadata_${id}`,
            JSON.stringify(metadata),
            {
              contentId: id,
              updatedAt: Date.now()
            }
          );
        }
      }
      
      return results;
    } catch (error) {
      console.error('MetadataService: Error getting bulk metadata', error);
      
      // Return what we have from cache
      const results = new Map<string, ContentMetadata>();
      
      for (const id of contentIds) {
        if (this.metadataCache.has(id)) {
          results.set(id, this.metadataCache.get(id)!);
        }
      }
      
      return results;
    }
  }
}

export const metadataService = new MetadataService();
export default metadataService; 
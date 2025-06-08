import { Request, Response } from 'express';
import Content from '../models/Content';
import createError from '../utils/createError';
import asyncHandler from '../middleware/asyncHandler';
import axios from 'axios';

// In-memory schema version for metadata
// In a production environment, this would be stored in a database
const currentMetadataSchema = {
  version: '1.0.0',
  fields: [
    {
      name: 'title',
      displayName: 'Title',
      type: 'text',
      required: true,
      description: 'Title of the content',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'description',
      displayName: 'Description',
      type: 'text',
      required: false,
      description: 'Description of the content',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: 'text',
      required: true,
      description: 'Type of content',
      options: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other'],
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'releaseYear',
      displayName: 'Release Year',
      type: 'number',
      required: false,
      description: 'Year the content was released',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'duration',
      displayName: 'Duration',
      type: 'number',
      required: false,
      description: 'Duration in seconds',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast']
    },
    {
      name: 'genre',
      displayName: 'Genre',
      type: 'array',
      required: false,
      description: 'Genres of the content',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'tags',
      displayName: 'Tags',
      type: 'array',
      required: false,
      description: 'Tags for the content',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'language',
      displayName: 'Language',
      type: 'text',
      required: false,
      description: 'Primary language of the content',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'country',
      displayName: 'Country',
      type: 'text',
      required: false,
      description: 'Country of origin',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    },
    {
      name: 'cast',
      displayName: 'Cast',
      type: 'array',
      required: false,
      description: 'Cast members',
      contentTypes: ['movie', 'series', 'short']
    },
    {
      name: 'director',
      displayName: 'Director',
      type: 'text',
      required: false,
      description: 'Director of the content',
      contentTypes: ['movie', 'series', 'short']
    },
    {
      name: 'studio',
      displayName: 'Studio',
      type: 'text',
      required: false,
      description: 'Studio or publisher',
      contentTypes: ['movie', 'series', 'short', 'music', 'podcast', 'ebook', 'art', 'other']
    }
  ],
  createdAt: '2023-05-01T00:00:00.000Z',
  updatedAt: '2023-05-01T00:00:00.000Z'
};

// In-memory metadata search index
// In a production environment, this would use Elasticsearch or a similar search engine
const metadataIndex = new Map<string, any>();

/**
 * Get metadata schema
 * @route GET /api/metadata/schema
 */
export const getMetadataSchema = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(currentMetadataSchema);
});

/**
 * Search metadata
 * @route GET /api/metadata/search
 */
export const searchMetadata = asyncHandler(async (req: Request, res: Response) => {
  const {
    query,
    contentType,
    limit = 20,
    offset = 0,
    filters,
    sort,
    fields,
    exclude
  } = req.query;

  // Build search filter
  const searchFilter: any = {};
  
  // Add content type filter
  if (contentType) {
    searchFilter['metadata.contentType'] = contentType;
  }
  
  // Add text search
  if (query && typeof query === 'string') {
    searchFilter.$text = { $search: query };
  }
  
  // Add custom filters
  if (filters && typeof filters === 'string') {
    try {
      const parsedFilters = JSON.parse(filters);
      
      for (const filter of parsedFilters) {
        if (filter.field && filter.operator && filter.value !== undefined) {
          const fieldPath = filter.field.startsWith('metadata.') 
            ? filter.field 
            : `metadata.${filter.field}`;
          
          switch (filter.operator) {
            case 'eq':
              searchFilter[fieldPath] = filter.value;
              break;
            case 'ne':
              searchFilter[fieldPath] = { $ne: filter.value };
              break;
            case 'gt':
              searchFilter[fieldPath] = { $gt: filter.value };
              break;
            case 'gte':
              searchFilter[fieldPath] = { $gte: filter.value };
              break;
            case 'lt':
              searchFilter[fieldPath] = { $lt: filter.value };
              break;
            case 'lte':
              searchFilter[fieldPath] = { $lte: filter.value };
              break;
            case 'in':
              searchFilter[fieldPath] = { $in: Array.isArray(filter.value) ? filter.value : [filter.value] };
              break;
            case 'nin':
              searchFilter[fieldPath] = { $nin: Array.isArray(filter.value) ? filter.value : [filter.value] };
              break;
            case 'regex':
              searchFilter[fieldPath] = { $regex: filter.value, $options: 'i' };
              break;
            case 'exists':
              searchFilter[fieldPath] = { $exists: filter.value };
              break;
          }
        }
      }
    } catch (error) {
      throw createError('Invalid filters format', 400);
    }
  }
  
  // Create projection for fields
  const projection: any = {};
  
  if (fields && typeof fields === 'string') {
    const fieldsList = fields.split(',');
    for (const field of fieldsList) {
      projection[field.trim()] = 1;
    }
  }
  
  if (exclude && typeof exclude === 'string') {
    const excludeList = exclude.split(',');
    for (const field of excludeList) {
      projection[field.trim()] = 0;
    }
  }
  
  // Create sort options
  const sortOptions: any = { createdAt: -1 }; // Default sort
  
  if (sort && typeof sort === 'string') {
    const [sortField, sortDirection] = sort.split(':');
    
    if (sortField && sortDirection) {
      const direction = sortDirection.toLowerCase() === 'asc' ? 1 : -1;
      sortOptions[sortField.startsWith('metadata.') ? sortField : `metadata.${sortField}`] = direction;
    }
  }
  
  try {
    // Get total count
    const totalCount = await Content.countDocuments(searchFilter);
    
    // Execute search
    const results = await Content.find(searchFilter, projection)
      .sort(sortOptions)
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();
      
    // Extract and format metadata for response
    const items = results.map(item => ({
      contentId: item._id,
      ...item.metadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.status(200).json({
      items,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    throw createError('Error searching metadata', 500);
  }
});

/**
 * Index metadata for search
 * @route POST /api/metadata/index
 */
export const indexMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { contentId, metadata } = req.body;
  
  if (!contentId || !metadata) {
    throw createError('Content ID and metadata are required', 400);
  }
  
  try {
    // In a production environment, this would send the metadata to a search engine like Elasticsearch
    // For this implementation, we'll just store it in memory
    metadataIndex.set(contentId, {
      ...metadata,
      indexed_at: new Date().toISOString()
    });
    
    // Update MongoDB document
    await Content.findByIdAndUpdate(contentId, {
      $set: { metadata }
    });
    
    res.status(200).json({
      message: 'Metadata indexed successfully',
      contentId
    });
  } catch (error) {
    throw createError('Error indexing metadata', 500);
  }
});

/**
 * Get bulk metadata for multiple content items
 * @route POST /api/metadata/bulk
 */
export const getBulkMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { contentIds } = req.body;
  
  if (!contentIds || !Array.isArray(contentIds)) {
    throw createError('Valid array of content IDs is required', 400);
  }
  
  try {
    // Get content items with metadata
    const contents = await Content.find(
      { _id: { $in: contentIds } },
      { metadata: 1 }
    ).lean();
    
    // Convert to Map for response
    const metadataMap: Record<string, any> = {};
    
    for (const content of contents) {
      if (content._id && content.metadata) {
        metadataMap[content._id.toString()] = content.metadata;
      }
    }
    
    res.status(200).json({
      message: 'Bulk metadata retrieved successfully',
      metadata: metadataMap
    });
  } catch (error) {
    throw createError('Error retrieving bulk metadata', 500);
  }
});

/**
 * Generate metadata from external sources
 * @route POST /api/metadata/generate
 */
export const generateMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { contentId, contentType, title } = req.body;
  
  if (!contentId || !contentType) {
    throw createError('Content ID and type are required', 400);
  }
  
  try {
    // Check if content exists
    const content = await Content.findById(contentId);
    
    if (!content) {
      throw createError('Content not found', 404);
    }
    
    // In a real implementation, we would use external APIs like TMDB or MusicBrainz
    // to fetch metadata based on the title and content type
    // For demonstration, we'll just generate some placeholder metadata
    
    const searchTitle = title || content.title;
    let metadata;
    
    // Simulated API call to external service
    try {
      if (contentType === 'movie' || contentType === 'series' || contentType === 'short') {
        // For movies/videos, you would call something like TMDB or IMDB API
        // Simulated response
        metadata = {
          title: searchTitle,
          contentType,
          description: `Generated description for ${searchTitle}`,
          releaseYear: new Date().getFullYear(),
          duration: 5400, // 90 minutes
          genre: ['Drama', 'Action'],
          tags: ['generated', 'wylloh', contentType],
          language: 'en',
          country: 'US',
          cast: ['Actor 1', 'Actor 2'],
          director: 'Director Name',
          studio: 'Wylloh Studios',
          rating: {
            value: 7.5,
            source: 'generated',
            count: 100
          },
          version: currentMetadataSchema.version
        };
      } else if (contentType === 'music' || contentType === 'podcast') {
        // For music/audio, you would call something like MusicBrainz or Spotify API
        metadata = {
          title: searchTitle,
          contentType,
          description: `Generated description for ${searchTitle}`,
          releaseYear: new Date().getFullYear(),
          duration: 240, // 4 minutes
          genre: ['Pop', 'Electronic'],
          tags: ['generated', 'wylloh', contentType],
          language: 'en',
          country: 'US',
          artist: 'Artist Name',
          album: 'Album Title',
          studio: 'Wylloh Records',
          version: currentMetadataSchema.version
        };
      } else {
        // For other content types
        metadata = {
          title: searchTitle,
          contentType,
          description: `Generated description for ${searchTitle}`,
          releaseYear: new Date().getFullYear(),
          genre: ['General'],
          tags: ['generated', 'wylloh', contentType],
          language: 'en',
          country: 'US',
          version: currentMetadataSchema.version
        };
      }
    } catch (error) {
      console.error('Error calling external metadata API:', error);
      // Fallback basic metadata
      metadata = {
        title: searchTitle,
        contentType,
        description: 'No external metadata found',
        version: currentMetadataSchema.version
      };
    }
    
    // Update content with generated metadata
    content.metadata = metadata;
    await content.save();
    
    res.status(200).json({
      message: 'Metadata generated successfully',
      metadata
    });
  } catch (error) {
    throw createError('Error generating metadata', 500);
  }
});

/**
 * Validate metadata against schema
 * @route POST /api/metadata/validate
 */
export const validateMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { metadata } = req.body;
  
  if (!metadata) {
    throw createError('Metadata is required', 400);
  }
  
  const validationErrors = [];
  
  // Check required fields based on content type
  for (const field of currentMetadataSchema.fields) {
    if (field.required) {
      // If field is required for this content type
      if (
        !metadata.contentType || 
        field.contentTypes.includes(metadata.contentType)
      ) {
        if (metadata[field.name] === undefined || metadata[field.name] === null || metadata[field.name] === '') {
          validationErrors.push({
            field: field.name,
            message: `${field.displayName} is required`
          });
        }
      }
    }
  }
  
  res.status(200).json({
    valid: validationErrors.length === 0,
    errors: validationErrors
  });
}); 
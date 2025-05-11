import { useState, useEffect, useCallback } from 'react';
import metadataService, { 
  ContentMetadata, 
  ContentType, 
  MetadataValidationError,
  MetadataQueryOptions,
  MetadataSearchFilter
} from '../services/metadata.service';

/**
 * Result of using the metadata hook
 */
interface UseMetadataResult {
  metadata: ContentMetadata | null;
  loading: boolean;
  error: string | null;
  validationErrors: MetadataValidationError[];
  updateMetadata: (updates: Partial<ContentMetadata>) => Promise<void>;
  validateMetadata: (data: Partial<ContentMetadata>) => MetadataValidationError[];
  generateMetadata: () => Promise<void>;
  searchMetadata: (
    contentType?: ContentType,
    query?: string,
    options?: MetadataQueryOptions
  ) => Promise<{ metadata: ContentMetadata[], total: number }>;
}

/**
 * Hook for using content metadata
 * 
 * @param contentId Content ID to get metadata for
 * @param contentType Content type for generating metadata
 * @returns Metadata hook result
 */
export function useMetadata(
  contentId?: string,
  contentType?: ContentType
): UseMetadataResult {
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<MetadataValidationError[]>([]);
  
  // Load metadata when contentId changes
  useEffect(() => {
    if (!contentId) return;
    
    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await metadataService.getMetadata(contentId);
        setMetadata(data);
      } catch (err) {
        setError('Failed to load metadata');
        console.error('Error loading metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetadata();
  }, [contentId]);
  
  // Update metadata
  const updateMetadata = useCallback(async (updates: Partial<ContentMetadata>) => {
    if (!contentId) {
      setError('Cannot update metadata: Content ID is missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    
    try {
      // Validate metadata before updating
      const errors = metadataService.validateMetadata(updates);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        setError('Validation failed. Please fix the errors.');
        return;
      }
      
      // Update metadata
      const updatedMetadata = await metadataService.updateMetadata(contentId, updates);
      setMetadata(updatedMetadata);
      
      // Index metadata for search
      await metadataService.indexMetadata(contentId, updatedMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to update metadata');
      console.error('Error updating metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);
  
  // Validate metadata
  const validateMetadata = useCallback((data: Partial<ContentMetadata>): MetadataValidationError[] => {
    const errors = metadataService.validateMetadata(data);
    setValidationErrors(errors);
    return errors;
  }, []);
  
  // Generate metadata
  const generateMetadata = useCallback(async () => {
    if (!contentId || !contentType) {
      setError('Cannot generate metadata: Content ID or type is missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const generatedMetadata = await metadataService.generateMetadata(contentId, contentType);
      setMetadata(generatedMetadata);
    } catch (err) {
      setError('Failed to generate metadata');
      console.error('Error generating metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType]);
  
  // Search metadata
  const searchMetadata = useCallback(async (
    type?: ContentType,
    query?: string,
    options?: MetadataQueryOptions
  ) => {
    try {
      return await metadataService.searchMetadata(type, query, options);
    } catch (err) {
      console.error('Error searching metadata:', err);
      return { metadata: [], total: 0 };
    }
  }, []);
  
  return {
    metadata,
    loading,
    error,
    validationErrors,
    updateMetadata,
    validateMetadata,
    generateMetadata,
    searchMetadata
  };
}

export default useMetadata; 
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import RecommendationsList from './RecommendationsList';
import { RecommendationType } from '../../services/recommendation.service';
import { ContentType } from '../../services/metadata.service';

interface SimilarContentProps {
  contentId: string;
  contentType?: ContentType;
  title?: string;
  maxItems?: number;
}

/**
 * Component for displaying similar content recommendations
 * on the content details page
 */
const SimilarContent: React.FC<SimilarContentProps> = ({
  contentId,
  contentType,
  title = 'You Might Also Like',
  maxItems = 6
}) => {
  if (!contentId) {
    return null;
  }
  
  // Set up options for similar content recommendations
  const options = {
    sourceContentId: contentId,
    contentType,
    limit: maxItems,
    includeSameCreator: true
  };
  
  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 3 }} />
      <RecommendationsList
        title={title}
        type={RecommendationType.SIMILAR}
        options={options}
        maxItems={maxItems}
        emptyMessage="No similar content found"
      />
    </Box>
  );
};

export default SimilarContent; 
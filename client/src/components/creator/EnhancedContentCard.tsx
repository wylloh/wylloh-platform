import React from 'react';
import { Content } from '../../services/content.service';
import EnhancedContentCard from '../common/EnhancedContentCard';
import ContentQuickActions from './ContentQuickActions';

interface CreatorEnhancedContentCardProps {
  content: Content;
  loading?: boolean;
  onDelete?: (contentId: string) => void;
  onTokenize?: (contentId: string) => void;
  onSetVisibility?: (contentId: string, visibility: 'public' | 'private' | 'unlisted') => void;
  onSetStatus?: (contentId: string, status: 'draft' | 'pending' | 'active') => void;
  onShare?: (contentId: string) => void;
  onDuplicate?: (contentId: string) => void;
  onView?: (contentId: string) => void;
  elevation?: number;
  variant?: 'compact' | 'standard' | 'detailed';
}

/**
 * @deprecated Use common/EnhancedContentCard instead with context="pro"
 * This is a wrapper for backward compatibility
 */
const CreatorEnhancedContentCard: React.FC<CreatorEnhancedContentCardProps> = ({
  content,
  loading = false,
  onDelete,
  onTokenize,
  onSetVisibility,
  onSetStatus,
  onShare,
  onDuplicate,
  onView,
  elevation = 1,
  variant = 'standard',
}) => {
  // Simply pass through to the common component with pro context
  return (
    <EnhancedContentCard
      content={content}
      loading={loading}
      context="pro"
      onView={onView}
      elevation={elevation}
      variant={variant}
      hideStatus={false}
      showPrice={content.tokenized}
    />
  );
};

export default CreatorEnhancedContentCard; 
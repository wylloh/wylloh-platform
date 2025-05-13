import React from 'react';
import ContentStatusBadge from '../common/ContentStatusBadge';

/**
 * @deprecated Use common/ContentStatusBadge instead
 * This is a wrapper for backward compatibility
 */
interface ContentStatusBadgeProps {
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'processing';
  visibility?: 'public' | 'private' | 'unlisted';
  tokenized?: boolean;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  variant?: 'outlined' | 'filled';
}

const CreatorContentStatusBadge: React.FC<ContentStatusBadgeProps> = (props) => {
  return <ContentStatusBadge {...props} context="pro" />;
};

export default CreatorContentStatusBadge; 
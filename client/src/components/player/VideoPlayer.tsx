import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';
import { keyManagementService } from '../../services/keyManagement.service';
import { blockchainService } from '../../services/blockchain.service';
import { cdnService } from '../../services/cdn.service';
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer';

interface VideoPlayerProps {
  contentId: string;
  contentCid: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: string;
  height?: string;
  preloadLevel?: 'none' | 'metadata' | 'auto';
  isPublicContent?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  // Simply pass all props to AdaptiveVideoPlayer
  return <AdaptiveVideoPlayer {...props} />;
};

export default VideoPlayer; 
import React, { forwardRef } from 'react';
import { Box } from '@mui/material';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  subtitlesEnabled?: boolean;
  subtitlesUrl?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: () => void;
  onLoadedMetadata?: () => void;
  onVolumeChange?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
  onError?: (e: any) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({
    src,
    poster,
    autoPlay = false,
    loop = false,
    muted = false,
    subtitlesEnabled = false,
    subtitlesUrl = '',
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onLoadedMetadata,
    onVolumeChange,
    onWaiting,
    onPlaying,
    onError
  }, ref) => {
    // If the src is an IPFS URL, we'll use it as the primary source
    // and provide a fallback direct URL for Big Buck Bunny
    const isIpfsUrl = src && (src.includes('/ipfs/') || src.startsWith('ipfs://'));
    const fallbackUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    // Only add fallback if we detect it's Big Buck Bunny content
    const shouldAddFallback = src.toLowerCase().includes('bigbuckbunny') || 
                             src.includes('QmVLEz2SxoNiFnuyLpbXsH6SvjPTrHNMU88vCQZyhgBzgw');
    
    // Log the source for debugging
    console.log('VideoPlayer source:', src, 'isIpfsUrl:', isIpfsUrl, 'shouldAddFallback:', shouldAddFallback);
    
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <video
          ref={ref}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onVolumeChange={onVolumeChange}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onError={onError}
        >
          {/* Use source elements to support multiple formats and fallbacks */}
          <source src={src} type={isIpfsUrl ? "video/mp4" : "video/mp4"} />
          
          {/* Add fallback source for Big Buck Bunny */}
          {shouldAddFallback && (
            <source src={fallbackUrl} type="video/mp4" />
          )}
          
          {subtitlesEnabled && subtitlesUrl && (
            <track
              kind="subtitles"
              src={subtitlesUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
          Your browser does not support the video tag.
        </video>
      </Box>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 
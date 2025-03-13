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
    onPlaying
  }, ref) => {
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <video
          ref={ref}
          src={src}
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
        >
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
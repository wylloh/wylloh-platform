import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { usePlayerStore } from '../../state/playerStore';

export interface VideoPlayerProps {
  src?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Core VideoPlayer component that handles video playback and communicates with the global state
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  crossOrigin,
  className,
  style,
  children,
}) => {
  // Reference to the video element
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Get state and actions from the store
  const {
    playing,
    currentTime,
    volume,
    muted: storeMuted,
    playbackRate,
    subtitlesEnabled,
    setPlaying,
    setCurrentTime,
    setDuration,
    setBuffering,
    setEnded,
    setVolume,
    setMuted,
  } = usePlayerStore();
  
  // Initialize video when component mounts or source changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) return;
    
    // Set initial playback state
    videoElement.volume = volume;
    videoElement.muted = storeMuted;
    videoElement.playbackRate = playbackRate;
    
    // If playing is true, try to start playback
    if (playing) {
      try {
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
          setPlaying(false);
        });
      } catch (error) {
        console.error('Error playing video:', error);
        setPlaying(false);
      }
    }
    
    return () => {
      // Stop video playback when component unmounts
      try {
        videoElement.pause();
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    };
  }, [src, playing, volume, storeMuted, playbackRate, setPlaying]);
  
  // Sync current time from the store to the video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) return;
    
    // Only update if the difference is significant to avoid loops
    if (Math.abs(videoElement.currentTime - currentTime) > 0.5) {
      videoElement.currentTime = currentTime;
    }
  }, [currentTime, src]);
  
  // Set up event listeners for video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => {
      setPlaying(true);
    };
    
    const handlePause = () => {
      setPlaying(false);
    };
    
    const handleWaiting = () => {
      setBuffering(true);
    };
    
    const handlePlaying = () => {
      setBuffering(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setMuted(videoElement.muted);
    };
    
    const handleEnded = () => {
      setPlaying(false);
      setEnded(true);
    };
    
    // Add event listeners
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ended', handleEnded);
    
    // Remove event listeners on cleanup
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, setPlaying, setBuffering, setVolume, setMuted, setEnded]);
  
  return (
    <Box className={className} style={{ position: 'relative', ...style }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        preload={preload}
        crossOrigin={crossOrigin}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
        }}
        playsInline
      >
        {/* Support for subtitles */}
        {subtitlesEnabled && children}
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

export default VideoPlayer; 
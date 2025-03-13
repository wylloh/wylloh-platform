import { create } from 'zustand';

// Define player state type
export interface PlayerState {
  // Playback state
  playing: boolean;
  currentTime: number;
  duration: number;
  buffering: boolean;
  playbackRate: number;
  ended: boolean;
  
  // UI state
  showControls: boolean;
  fullscreen: boolean;
  
  // Audio state
  volume: number;
  muted: boolean;
  
  // Subtitle state
  subtitlesEnabled: boolean;
  
  // Content state
  contentId: string | null;
  isPreview: boolean;
  
  // Actions
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBuffering: (buffering: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setEnded: (ended: boolean) => void;
  setShowControls: (show: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setContentId: (id: string | null) => void;
  setIsPreview: (isPreview: boolean) => void;
  
  // Combined actions
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleSubtitles: () => void;
  reset: () => void;
}

// Default state values
const DEFAULT_VOLUME = 0.7;

// Create the store
export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  playing: false,
  currentTime: 0,
  duration: 0,
  buffering: false,
  playbackRate: 1,
  ended: false,
  showControls: true,
  fullscreen: false,
  volume: DEFAULT_VOLUME,
  muted: false,
  subtitlesEnabled: false,
  contentId: null,
  isPreview: false,
  
  // Actions
  setPlaying: (playing) => set({ playing }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffering: (buffering) => set({ buffering }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setEnded: (ended) => set({ ended }),
  setShowControls: (showControls) => set({ showControls }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
  setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),
  setContentId: (contentId) => set({ contentId }),
  setIsPreview: (isPreview) => set({ isPreview }),
  
  // Combined actions
  togglePlay: () => set((state) => ({ playing: !state.playing })),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  toggleFullscreen: () => set((state) => ({ fullscreen: !state.fullscreen })),
  toggleSubtitles: () => set((state) => ({ subtitlesEnabled: !state.subtitlesEnabled })),
  reset: () => set({
    playing: false,
    currentTime: 0,
    duration: 0,
    buffering: false,
    playbackRate: 1,
    ended: false,
    showControls: true,
    fullscreen: false,
    volume: DEFAULT_VOLUME,
    muted: false,
    subtitlesEnabled: false,
    contentId: null,
    isPreview: false,
  }),
})); 
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../playerStore';

describe('Player Store', () => {
  // Reset the store before each test
  beforeEach(() => {
    const { reset } = usePlayerStore.getState();
    reset();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const state = usePlayerStore.getState();
      
      expect(state.playing).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.buffering).toBe(false);
      expect(state.playbackRate).toBe(1);
      expect(state.ended).toBe(false);
      expect(state.showControls).toBe(true);
      expect(state.fullscreen).toBe(false);
      expect(state.volume).toBe(0.7); // DEFAULT_VOLUME
      expect(state.muted).toBe(false);
      expect(state.subtitlesEnabled).toBe(false);
      expect(state.contentId).toBe(null);
      expect(state.isPreview).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should update playing state', () => {
      const { setPlaying } = usePlayerStore.getState();
      
      setPlaying(true);
      
      expect(usePlayerStore.getState().playing).toBe(true);
    });

    it('should update current time', () => {
      const { setCurrentTime } = usePlayerStore.getState();
      
      setCurrentTime(30);
      
      expect(usePlayerStore.getState().currentTime).toBe(30);
    });

    it('should update duration', () => {
      const { setDuration } = usePlayerStore.getState();
      
      setDuration(120);
      
      expect(usePlayerStore.getState().duration).toBe(120);
    });

    it('should update buffering state', () => {
      const { setBuffering } = usePlayerStore.getState();
      
      setBuffering(true);
      
      expect(usePlayerStore.getState().buffering).toBe(true);
    });

    it('should update playback rate', () => {
      const { setPlaybackRate } = usePlayerStore.getState();
      
      setPlaybackRate(1.5);
      
      expect(usePlayerStore.getState().playbackRate).toBe(1.5);
    });

    it('should update ended state', () => {
      const { setEnded } = usePlayerStore.getState();
      
      setEnded(true);
      
      expect(usePlayerStore.getState().ended).toBe(true);
    });

    it('should update show controls state', () => {
      const { setShowControls } = usePlayerStore.getState();
      
      setShowControls(false);
      
      expect(usePlayerStore.getState().showControls).toBe(false);
    });

    it('should update fullscreen state', () => {
      const { setFullscreen } = usePlayerStore.getState();
      
      setFullscreen(true);
      
      expect(usePlayerStore.getState().fullscreen).toBe(true);
    });
  });

  describe('Combined Actions', () => {
    it('should toggle play state', () => {
      const { togglePlay } = usePlayerStore.getState();
      
      togglePlay();
      expect(usePlayerStore.getState().playing).toBe(true);
      
      togglePlay();
      expect(usePlayerStore.getState().playing).toBe(false);
    });

    it('should toggle mute state', () => {
      const { toggleMute } = usePlayerStore.getState();
      
      toggleMute();
      expect(usePlayerStore.getState().muted).toBe(true);
      
      toggleMute();
      expect(usePlayerStore.getState().muted).toBe(false);
    });

    it('should toggle fullscreen state', () => {
      const { toggleFullscreen } = usePlayerStore.getState();
      
      toggleFullscreen();
      expect(usePlayerStore.getState().fullscreen).toBe(true);
      
      toggleFullscreen();
      expect(usePlayerStore.getState().fullscreen).toBe(false);
    });

    it('should toggle subtitles state', () => {
      const { toggleSubtitles } = usePlayerStore.getState();
      
      toggleSubtitles();
      expect(usePlayerStore.getState().subtitlesEnabled).toBe(true);
      
      toggleSubtitles();
      expect(usePlayerStore.getState().subtitlesEnabled).toBe(false);
    });

    it('should reset the store to default values', () => {
      const { 
        setPlaying, 
        setCurrentTime, 
        setDuration, 
        setFullscreen, 
        reset 
      } = usePlayerStore.getState();
      
      // Change some values
      setPlaying(true);
      setCurrentTime(45);
      setDuration(90);
      setFullscreen(true);
      
      // Verify changes
      expect(usePlayerStore.getState().playing).toBe(true);
      expect(usePlayerStore.getState().currentTime).toBe(45);
      
      // Reset
      reset();
      
      // Verify reset
      expect(usePlayerStore.getState().playing).toBe(false);
      expect(usePlayerStore.getState().currentTime).toBe(0);
      expect(usePlayerStore.getState().duration).toBe(0);
      expect(usePlayerStore.getState().fullscreen).toBe(false);
    });
  });
}); 
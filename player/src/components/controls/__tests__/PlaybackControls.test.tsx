import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlaybackControls from '../PlaybackControls';
import { usePlayerStore } from '../../../state/playerStore';

// Mock Material UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, className, sx, ...props }) => (
    <div className={className} data-testid="mui-box" {...props}>
      {children}
    </div>
  ),
  IconButton: ({ children, onClick, ...props }) => (
    <button onClick={onClick} data-testid="mui-icon-button" {...props}>
      {children}
    </button>
  ),
  Slider: ({ value, onChange, min, max, ...props }) => (
    <input 
      type="range" 
      value={value} 
      onChange={(e) => onChange(e, Number(e.target.value))} 
      min={min} 
      max={max} 
      data-testid="mui-slider"
      {...props}
    />
  )
}));

// Mock Material UI icons
vi.mock('@mui/icons-material', () => ({
  PlayArrow: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>
}));

// Mock the player store
vi.mock('../../../state/playerStore', () => ({
  usePlayerStore: vi.fn()
}));

describe('PlaybackControls Component', () => {
  // Default mock implementation for usePlayerStore
  const mockStore = {
    playing: false,
    currentTime: 30,
    duration: 120,
    togglePlay: vi.fn(),
    setCurrentTime: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePlayerStore as any).mockImplementation(() => mockStore);
  });

  it('renders the play button when not playing', () => {
    render(<PlaybackControls />);
    
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
  });

  it('renders the pause button when playing', () => {
    (usePlayerStore as any).mockImplementation(() => ({
      ...mockStore,
      playing: true
    }));
    
    render(<PlaybackControls />);
    
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
  });

  it('calls togglePlay when play/pause button is clicked', () => {
    render(<PlaybackControls />);
    
    fireEvent.click(screen.getByTestId('mui-icon-button'));
    
    expect(mockStore.togglePlay).toHaveBeenCalledTimes(1);
  });

  it('renders a slider with correct values', () => {
    render(<PlaybackControls />);
    
    const slider = screen.getByTestId('mui-slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '120');
    expect(slider).toHaveAttribute('value', '30');
  });

  it('calls setCurrentTime when slider value changes', () => {
    render(<PlaybackControls />);
    
    const slider = screen.getByTestId('mui-slider');
    fireEvent.change(slider, { target: { value: '50' } });
    
    expect(mockStore.setCurrentTime).toHaveBeenCalledWith(50);
  });

  it('applies custom styling when provided', () => {
    render(<PlaybackControls className="custom-class" style={{ color: 'red' }} />);
    
    const container = screen.getByTestId('mui-box');
    expect(container).toHaveClass('custom-class');
  });
}); 
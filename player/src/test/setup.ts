import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Make vi available globally
globalThis.vi = vi;

// Mock media playback capabilities that aren't available in jsdom
window.HTMLMediaElement.prototype.load = vi.fn();
window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.canPlayType = vi.fn().mockImplementation(() => true);

// Mock requestFullscreen functionality
Element.prototype.requestFullscreen = vi.fn().mockImplementation(() => Promise.resolve());
document.exitFullscreen = vi.fn().mockImplementation(() => Promise.resolve());

// Add any additional environment setup/mocks below 

// Define global mocks for testing
global.vi = vi;

// Setup mock implementations for media playback capabilities
vi.stubGlobal('HTMLMediaElement', {
  prototype: {
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    canPlayType: vi.fn(() => true),
    addTextTrack: vi.fn(),
  },
});

// Mock for requestFullscreen
Element.prototype.requestFullscreen = vi.fn(() => Promise.resolve());

// Run cleanup after each test
afterEach(() => {
  cleanup();
}); 
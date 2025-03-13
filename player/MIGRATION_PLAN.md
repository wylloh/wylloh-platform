# Migration Plan: Web Player Implementation

This document outlines the plan for migrating the existing web player functionality from `client/src/pages/player/PlayerPage.tsx` to the new web-based player architecture.

## Overview

The current `PlayerPage.tsx` already implements many of the core features needed for our web player, including:

- Basic video playback
- Playback controls (play/pause, volume, seek)
- Fullscreen support
- Subtitles toggle
- Playback speed control
- Basic content metadata display
- Preview/full content handling
- License verification UI flow

We will leverage this existing code while adapting it to a more modular, extensible architecture in the new player structure.

## Phase 1: Component Extraction

1. **Extract Core Player Component**
   - Create `player/src/components/VideoPlayer.tsx` from existing player code
   - Separate UI controls from playback logic
   - Refactor to use React hooks for player logic

2. **Extract Control Components**
   - Create separated components for:
     - `PlaybackControls.tsx` (play/pause, seek)
     - `VolumeControls.tsx` (volume, mute)
     - `DisplayControls.tsx` (fullscreen, subtitles)
     - `InfoDisplay.tsx` (time, duration, metadata)

3. **Extract State Management**
   - Move player state to Zustand store
   - Create `player/src/state/playerStore.ts`
   - Separate playback state from UI state

## Phase 2: License Verification Integration

1. **Extract License Verification**
   - Create shared verification logic in `shared/blockchain/verification`
   - Adapt from existing code in `seed-one/src/utils/licenseVerifier.js`
   - Create React hooks for verification process

2. **Integrate Wallet Connection**
   - Use existing wallet context from `client/src/contexts/WalletContext.tsx` 
   - Create adapter for shared blockchain library

3. **Implement Offline Verification**
   - Add logic for caching verification results
   - Create verification receipt storage

## Phase 3: IPFS Integration

1. **Extract Gateway Logic**
   - Create `shared/ipfs/gateways` for gateway management
   - Add multi-gateway support with fallback
   - Implement gateway health checking

2. **Implement Content Retrieval**
   - Create common content addressing scheme
   - Add download management for offline playback
   - Implement content cache

## Phase 4: Enhanced Playback Features

1. **Upgrade Media Player**
   - Replace native HTML5 video with Shaka Player
   - Add adaptive streaming support
   - Improve subtitle and audio track handling

2. **Add Analytics**
   - Create playback analytics framework
   - Add metrics for quality of service
   - Implement content popularity tracking

## Phase 5: Native Extensions

1. **Define Extension Interfaces**
   - Create TypeScript interfaces for native extensions
   - Document extension points

2. **Implement Desktop Extensions**
   - Add Electron/Tauri wrapper for desktop
   - Implement local file access
   - Add hardware acceleration

3. **Implement Seed One Extensions**
   - Create Raspberry Pi optimizations
   - Add HDMI-CEC support
   - Implement kiosk mode browser

## Timeline

- Phase 1: 1-2 weeks
- Phase 2: 1-2 weeks
- Phase 3: 1-2 weeks
- Phase 4: 2-3 weeks
- Phase 5: 3-4 weeks

Total estimated timeline: 8-13 weeks for complete implementation.

## Initial Next Steps

1. Set up basic project structure with Vite and React
2. Create skeleton components based on existing player
3. Implement basic playback functionality
4. Begin extracting and adapting shared libraries 
# Archived: Kodi-based Wylloh Player

This directory contains the archived code for the original Wylloh Player implementation, which was based on a fork of Kodi.

## Why This Was Archived

On March 12, 2025, we made a strategic decision to pivot from a Kodi-based player approach to a web-based player with native extensions. This decision was based on several factors:

1. **Alignment with Open Values**: A web-based approach better aligns with our mission of openness and accessibility
2. **Cross-Platform Consistency**: Allows for a synchronized experience across web, mobile, and Seed One hardware
3. **Development Simplicity**: Reduces the complexity of maintaining a full Kodi fork
4. **Modern Technology Stack**: Takes advantage of modern web standards and WebAssembly performance

## Historical Context

The Kodi-based approach was initially chosen following the example of Plex, which successfully forked XBMC/Kodi to create their player. However, we encountered several challenges:

- Complexity of the Kodi codebase and build system
- Difficulties in integrating blockchain and IPFS functionality
- Dependency management issues, particularly with FFmpeg version requirements
- Limited development resources compared to larger companies like Plex

## Potentially Reusable Components

While we've moved away from this implementation, some components may still be valuable references:

- Media playback pipeline configurations
- Hardware acceleration implementations
- Platform-specific optimizations
- UI/UX designs and workflows

## Current Approach

The current Wylloh Player implementation uses a web-based architecture with native extensions where needed. See the `/player` directory for the current implementation.

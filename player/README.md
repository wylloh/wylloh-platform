# Wylloh Web Player

This is Wylloh's web-based media player implementation, designed to run both in web browsers and on the Seed One hardware via Chromium in kiosk mode.

## Architecture Overview

The Wylloh Player is built using modern web technologies:

- **React**: For UI components and state management
- **TypeScript**: For type safety and better developer experience
- **Material UI**: For consistent design language
- **Zustand**: For global state management
- **React Router**: For navigation
- **Web APIs**: For video playback and hardware acceleration

## Key Features

- **Cross-platform compatibility**: Works in browsers and on Seed One hardware
- **Responsive design**: Adapts to different screen sizes
- **Blockchain integration**: Verifies content ownership using wallet connection
- **IPFS content retrieval**: Loads content from IPFS through configurable gateways
- **Offline support**: Progressive Web App capabilities for offline playback
- **Advanced playback controls**: Including subtitles, playback speed, quality selection

## Component Organization

The player is organized into several key component groups:

- `src/components/player/`: Core player components like VideoPlayer and PlayerContainer
- `src/components/controls/`: UI controls for playback, volume, display, and time
- `src/state/`: Global state management with Zustand
- `src/utils/`: Helper functions and utilities
- `src/pages/`: Page-level components, including PlayerPage
- `src/hooks/`: Custom React hooks for player functionality
- `src/integration/`: Platform-specific adapters for web and Seed One

## Quick Start

For the fastest way to test the player:

```bash
cd player
./scripts/quick-test.sh
```

This will check dependencies, install packages if needed, and start the player in development mode.

To test the Seed One version locally:

```bash
./scripts/quick-test.sh --seedone
```

## Development

To start the development server:

```bash
cd player
yarn install
yarn dev
```

The player will be available at `http://localhost:3000`

## Building for Production

To build for production:

```bash
cd player
yarn install
yarn build
```

The build output will be in the `dist` directory.

## Integration with Demo Environment

To integrate the player with the demo environment:

```bash
./scripts/integrate-with-demo.sh
```

For Seed One integration:

```bash
./scripts/integrate-with-demo.sh --seedone
```

## Seed One Deployment

The player is designed to run on the Seed One hardware through Chromium in kiosk mode. 
See the main [README.md](../README.md) and [DEMO-README.MD](../DEMO-README.MD) for setup instructions.

## Testing

To run tests:

```bash
yarn test
```

For detailed testing instructions, see:
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [INTEGRATION-README.md](./INTEGRATION-README.md) - Integration testing guide

## Previous Implementations

This web-based player replaces previous Kodi-based implementations, which are now archived in the `/archive` directory. The web-based approach offers:

1. **Easier development**: Using familiar web technologies
2. **Better cross-platform support**: Same codebase for web and Seed One
3. **Improved maintainability**: No complex C++ dependencies
4. **Faster iteration**: Quick development and deployment cycles
5. **Modern UI**: Consistent design across platforms 
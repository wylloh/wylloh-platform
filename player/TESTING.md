# Wylloh Player Testing Guide

This document provides step-by-step instructions for testing the Wylloh Player and its integration with both the web platform and Seed One.

## Prerequisites

- Node.js 18+ installed
- Yarn package manager installed
- Git repository cloned and dependencies installed

## Local Development Testing

### 1. Run the Player in Development Mode

```bash
# Navigate to the player directory
cd player

# Make sure dependencies are installed
yarn install

# Start the player in development mode
yarn start
# or for platform-specific testing
yarn start:web      # Web platform
yarn start:seedone  # Seed One optimized
```

The development server will start at http://localhost:3001. Open this URL in your browser to see the player.

### 2. Test Basic Player Functionality

Verify the following features work correctly:

- [ ] Video playback starts and stops correctly
- [ ] Playback controls (play, pause, seek) function as expected
- [ ] Volume controls work properly
- [ ] Full-screen mode functions correctly
- [ ] Preview mode displays as expected

### 3. Test Advanced Features

- [ ] License verification shows appropriate messages
- [ ] Wallet connection works (for web platform)
- [ ] Content metadata is displayed correctly
- [ ] Responsive design works on different screen sizes

## Demo Environment Testing

### 1. Prepare the Player for Demo Integration

```bash
# Navigate to the player directory
cd player

# Make the integration script executable (if needed)
chmod +x scripts/integrate-with-demo.sh

# Run the integration script
./scripts/integrate-with-demo.sh
```

### 2. Start the Demo Environment

```bash
# Navigate to the workspace root
cd ..

# Start the demo
yarn demo
```

### 3. Test Player in Demo Context

Navigate to the player route in the demo application (usually http://localhost:3000/player) and verify:

- [ ] Player loads correctly within the application
- [ ] Navigation between the home page and player works
- [ ] Player properly displays content from the demo data
- [ ] Wallet integration works with the demo environment

## Seed One Testing

### 1. Build for Seed One

```bash
# Navigate to the player directory
cd player

# Run the integration script with Seed One flag
./scripts/integrate-with-demo.sh --seedone
```

### 2. Test on Seed One Device (if available)

If you have a Seed One device:

1. Follow the setup instructions in the demo to install Wylloh on the Seed One device
2. Verify that the player loads correctly on the device
3. Test touch controls and kiosk mode functionality

### 3. Test Seed One Mode Locally

If you don't have a physical device:

```bash
# Start in Seed One mode locally
yarn start:seedone
```

Verify:
- [ ] Touch-optimized UI is displayed
- [ ] Kiosk-mode features are active
- [ ] UI is properly scaled for the Seed One display resolution

## Integration Testing

### 1. Test Web Platform Adapter

Verify that the `WebPlayerAdapter` correctly:
- [ ] Communicates with the web wallet
- [ ] Retrieves content from web sources
- [ ] Handles user authentication properly
- [ ] Manages content licenses through the web platform

### 2. Test Seed One Adapter

Verify that the `SeedOnePlayerAdapter` correctly:
- [ ] Works with local content storage
- [ ] Handles the Seed One authentication flow
- [ ] Optimizes UI for kiosk display
- [ ] Manages offline license verification

## Cross-Platform Consistency Testing

Verify that the following features work consistently across platforms:

- [ ] Content playback quality
- [ ] License verification processes
- [ ] User interface design principles (accounting for platform differences)
- [ ] Error handling and messaging

## Reporting Issues

If you encounter any issues during testing:

1. Check the browser console for error messages
2. Verify that all dependencies are installed correctly
3. Try running `yarn clean && yarn install` to refresh your dependencies
4. Report issues with specific steps to reproduce the problem

## Automated Tests

To run the automated test suite:

```bash
# Navigate to the player directory
cd player

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode during development
yarn test:watch
```

Ensure that all tests pass before submitting your changes.

## Next Steps After Testing

Once testing is complete:

1. Document any issues found in the issue tracker
2. Make necessary adjustments based on testing feedback
3. Prepare for integration into the main branch
4. Update documentation to reflect any changes in functionality or usage 
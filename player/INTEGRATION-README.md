# Wylloh Player Integration Guide

This guide explains how to test the new Wylloh Player integration with both the web platform and Seed One.

## Overview

The Wylloh Player has been rewritten as a web application that works across different platforms:

- **Web Platform**: Integrated with the existing web application
- **Seed One**: Optimized for the Seed One kiosk environment

The new implementation uses a common core with platform-specific adapters to ensure consistent functionality while optimizing for each environment.

## Testing on Web Platform

### Option 1: Standalone Testing

To test the player independently:

```bash
# Navigate to the player directory
cd player

# Install dependencies (if not already done)
yarn install

# Start the development server
yarn start
# or
yarn start:web
```

This will start the player on http://localhost:3001. You can test features like:

- Content playback
- License verification
- Preview mode
- UI controls

### Option 2: Integrated with Demo Environment

To test the player as part of the full demo environment:

```bash
# Navigate to the player directory
cd player

# Run the integration script
./scripts/integrate-with-demo.sh

# Navigate back to the workspace root
cd ..

# Start the demo environment
yarn demo
```

This will:
1. Build the player
2. Integrate it with the client application
3. Start the full demo environment

You can then access the player at http://localhost:3000/player.

## Testing on Seed One

### Option 1: Using the Demo Environment

```bash
# Navigate to the player directory
cd player

# Run the integration script with the --seedone flag
./scripts/integrate-with-demo.sh --seedone

# Navigate back to the workspace root
cd ..

# Start the demo environment
yarn demo
```

The demo will show Seed One installation instructions. Follow those instructions to set up your Seed One device.

### Option 2: Manual Seed One Testing

If you want to manually test on the Seed One:

1. Build the player for Seed One:
   ```bash
   cd player
   yarn build:seedone
   ```

2. Copy the build to your Seed One device:
   ```bash
   scp -r dist/* pi@<SEED_ONE_IP>:/home/pi/wylloh/player/
   ```

3. Configure the Seed One to use the local player:
   ```bash
   ssh pi@<SEED_ONE_IP> "sudo nano /etc/wylloh/config.json"
   ```

   Update the config with:
   ```json
   {
     "playerUrl": "file:///home/pi/wylloh/player/index.html",
     "demoMode": true
   }
   ```

4. Restart the Wylloh service:
   ```bash
   ssh pi@<SEED_ONE_IP> "sudo systemctl restart wylloh"
   ```

## Verifying Integration Features

### Cross-Platform Features

- **License Verification**: Verify that license ownership is checked consistently across platforms
- **Preview Mode**: Test that preview mode works the same way on both web and Seed One
- **Content Metadata**: Verify that content metadata is displayed correctly everywhere

### Web-Specific Features

- **Integration with Web Wallet**: Test connecting your wallet and verifying licenses
- **Controls Integration**: Verify that all player controls work correctly in the web environment

### Seed One Features

- **Kiosk Mode**: Verify full-screen operation and touch-friendly controls
- **Auto-Launch**: Verify that the player automatically starts on boot
- **Responsive Controls**: Test the large, touch-optimized UI elements

## Troubleshooting

If you encounter issues:

1. **Build Problems**:
   - Ensure all dependencies are installed with `yarn install`
   - Check the Vite configuration in `vite.config.ts`

2. **Runtime Errors**:
   - Check browser console for errors
   - Check permissions for file access
   - Verify wallet connectivity

3. **Integration Issues**:
   - Verify the symlink is correctly created in the client directory
   - Check if the player is accessible via the expected URLs

4. **Seed One Issues**:
   - Check connectivity between your development machine and the Seed One device
   - Verify that the correct build is deployed to the Seed One
   - Check the Seed One logs with `journalctl -u wylloh -f`

## Next Steps

After successful testing, you can:

1. Deploy the player to production environments
2. Add more platform-specific optimizations
3. Extend the content provider implementations for real-world data sources
4. Enhance the authentication providers for more secure license verification 
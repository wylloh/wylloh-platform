# Wylloh Player

<p align="center">
  <strong>
    A media player for your tokenized content
  </strong>
</p>

<h1 align="center">
  Welcome to Wylloh Player!
</h1>

Wylloh Player is a specialized media player designed specifically for the Wylloh ecosystem. Based on the powerful Kodi media center codebase, Wylloh Player has been customized to provide seamless integration with blockchain-based content licensing and IPFS content delivery.

## Key Features

### Token-Based Content Access

Wylloh Player verifies your ownership of content through blockchain tokens:

- **Wallet Integration**: Connect your crypto wallet directly to the player
- **Ownership Verification**: Automatic verification of content access rights
- **Token Browser**: Easily browse and play content you own
- **QR Code Connection**: Simple wallet connection via QR code

### IPFS Integration

Wylloh Player provides a robust IPFS implementation optimized for media playback:

- **Multi-Gateway Support**: Configure and use multiple IPFS gateways with automatic fallback for reliable content retrieval
- **Gateway Management**: Add, remove, test, and prioritize gateways through an intuitive UI
- **Content Caching**: Intelligent local caching of content with configurable size limits and expiry times
- **Content Pinning**: Pin important content to prevent it from being removed from cache
- **Auto-Pinning**: Automatically pin content owned by your connected wallet
- **Network Participation**: Foundation for future participation in the Wylloh distributed storage network with potential rewards

### Content Playback

- **High-Quality Playback**: Support for 4K video, high-resolution audio, and various media formats
- **Enhanced Metadata**: View detailed information about your tokenized content
- **Seamless Streaming**: Stream content directly from IPFS with adaptive buffering
- **Resume Playback**: Automatically resume content where you left off

## Network Participation (Coming Soon)

The groundwork has been laid for future features allowing users to:

- Contribute storage space to the Wylloh network
- Earn rewards for sharing and storing content
- Participate in content distribution through a distributed approach
- Help build a more resilient content ecosystem

## Platform Support

Wylloh Player is available for:

- Linux (including Raspberry Pi OS)
- macOS
- Windows
- Android (coming soon)

## Building from Source

Wylloh Player follows the same build process as Kodi. For detailed platform-specific instructions, see:

- [Linux build guide](docs/README.Linux.md)
- [macOS build guide](docs/README.macOS.md)
- [Windows build guide](docs/README.Windows.md)
- [Android build guide](docs/README.Android.md)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/wy1bur/wylloh-platform.git
cd wylloh-platform/wylloh-player

# Configure the build
mkdir build && cd build
cmake ..

# Build
make

# Run
./wylloh-player
```

## Configuration

Wylloh Player settings can be configured through the UI:

1. Navigate to Settings > Wylloh
2. Configure API URL and wallet connection settings
3. Adjust IPFS settings for optimal performance on your network
4. Configure network participation settings (if enabled)

## License

Wylloh Player is based on Kodi which is licensed under the GPL v2.0 or later. See [LICENSE.md](LICENSE.md) for details.

## Credits

Wylloh Player is built on the work of the Kodi community. We express our gratitude to all Kodi contributors. See [CREDITS.md](CREDITS.md) for details.

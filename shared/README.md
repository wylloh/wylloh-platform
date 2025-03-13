# Wylloh Shared Libraries

This directory contains shared code used across multiple Wylloh platform components.

## Structure

The shared libraries are organized by functional domain:

- **`/blockchain`**: Integration with blockchain networks and tokens
  - Wallet connection
  - Token verification
  - Smart contract interactions
  - License validation

- **`/ipfs`**: Decentralized storage integration
  - Content retrieval
  - Multi-gateway management
  - Caching strategies
  - Content addressing

- **`/media`**: Media handling utilities
  - Format detection
  - Metadata extraction
  - Playback helpers
  - Content encryption/decryption

## Usage

These shared libraries can be imported by other components of the Wylloh platform, including:

- The web client
- The Wylloh Player
- The Seed One application
- Backend services

## Design Principles

1. **Modularity**: Each library should have a clear, focused purpose
2. **Minimal Dependencies**: Minimize external dependencies to reduce complexity
3. **Cross-Platform**: Code should work in both browser and Node.js environments where possible
4. **Well-Documented**: Clear documentation and type definitions
5. **Test Coverage**: Comprehensive unit tests for all shared code

## Development

When adding or modifying shared code:

1. Consider where the code will be used and ensure it meets the needs of all consumers
2. Add appropriate tests and documentation
3. Avoid platform-specific code where possible; use adapters for platform differences
4. Maintain backward compatibility or provide clear migration paths

## Implementation Status

Currently, these libraries are in the early stages of extraction and organization from the existing codebase. 
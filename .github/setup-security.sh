#!/bin/bash
# Setup script for Wylloh Platform Security Tools in CI/CD
# This installs tools needed for security scanning in GitHub Actions

set -e

echo "Setting up security tools for GitHub Actions..."

# Update package lists
apt-get update

# Install required utilities
apt-get install -y curl jq

# Install Node.js security tools
npm install -g npm-audit-reporter snyk

echo "Security tools setup complete." 
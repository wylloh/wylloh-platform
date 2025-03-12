# Wylloh Player Build Dependencies and Setup Guide

This document lists all dependencies and setup requirements needed to successfully build the Wylloh Player for Seed One. These instructions have been tested on Debian-based systems (including Raspberry Pi OS).

## Automatic Setup

The easiest way to set up your build environment is to use the provided setup script:

```bash
sudo ./setup-build-environment.sh
```

This script will install all required dependencies and make necessary code modifications.

## Manual Setup

If you prefer to set up the environment manually, follow these steps:

### Required Dependencies

Install these packages using the package manager (apt-get):

#### Core Build Tools
- build-essential
- cmake
- git

#### Media Libraries
- libass-dev
- libtag1-dev
- libtinyxml-dev
- libtinyxml2-dev
- libspdlog-dev
- libfstrcmp-dev
- libcdio-dev

#### Graphics and Display Libraries
- libdrm-dev
- libgbm-dev
- libxrandr-dev
- libxkbcommon-dev
- libinput-dev
- wayland-protocols
- libwayland-dev

#### Tools and Runtime
- swig
- default-jre
- libgtest-dev

### Required Workarounds

Several modifications are needed to fix issues in the build process:

1. **Fix target name in CMakeLists.txt**
   ```
   sed -i 's/add_custom_target(wylloh-player-libraries)/add_custom_target(wyllohplayer-libraries)/' CMakeLists.txt
   ```

2. **Disable problematic file COPY in CMakeLists.txt (around line 658)**
   ```
   sed -i '658s|file(COPY.*|# Disabled file copy that requires root permissions|' CMakeLists.txt
   ```

3. **Fix application name in version.txt**
   ```
   sed -i 's/APP_NAME: Wylloh Player/APP_NAME: WyllohPlayer/' version.txt
   ```

4. **Create required directories and files**
   - Create `xbmc/wylloh/wallet/CMakeLists.txt` with:
     ```cmake
     set(SOURCES)
     set(HEADERS)
     core_add_library(wylloh_wallet)
     ```
   - Create `xbmc/addons/AddonBindings.cmake` with:
     ```cmake
     # Empty AddonBindings.cmake file
     ```

## CMake Configuration

When configuring the build, use these options:

```bash
cmake \
  -DAPP_RENDER_SYSTEM=gles \
  -DENABLE_INTERNAL_FLATBUFFERS=ON \
  -DENABLE_INTERNAL_FFMPEG=ON \
  -DCORE_PLATFORM_NAME=x11 \
  -DENABLE_TESTING=OFF \
  ..
```

## Common Build Issues

### 1. Space in Application Name
The application name in `version.txt` must not contain spaces, as this causes issues with target names.

### 2. Missing AddonBindings.cmake
The build process looks for `xbmc/addons/AddonBindings.cmake`, which doesn't exist in the repository. Create an empty file.

### 3. Target Name Mismatch
The codebase references `wyllohplayer-libraries` but the CMakeLists.txt defines `wylloh-player-libraries`, causing a target name mismatch.

### 4. File Copy Permission Issue
The CMakeLists.txt attempts to copy system files (`/etc/gshadow`) which requires root permissions and isn't necessary.

### 5. Missing Wallet Directory
The codebase references a wallet module that requires a minimal CMakeLists.txt file to build properly.

## Platform-Specific Notes

### Raspberry Pi OS (Seed One)
- The X11 platform works better than GBM or Wayland for now
- For optimal performance, make sure to enable GPU memory allocation in raspi-config

### Debian/Ubuntu
- All required packages are available in standard repositories
- For older distributions, you might need to build some dependencies from source

## After Building

After a successful build, you can create installation packages or run the player directly:

```bash
# Run directly from build directory
./wyllohplayer

# Create Debian package
make package
``` 
# WyllohBranding.cmake
# Custom branding configuration for Wylloh Player

# Set application name (overrides APP_NAME in version.txt during build)
set(APP_NAME "WyllohPlayer")

# Set company details
set(COMPANY_NAME "Wylloh")
set(COMPANY_DOMAIN "wylloh.com")

# Copyright and license information
set(COPYRIGHT_YEARS "2023-2025")
set(LICENSE_DESCRIPTION "Proprietary")

# App identity
set(APP_PACKAGE "com.wylloh.player")
set(APP_DESCRIPTION "Wylloh Player is a specialized media player for accessing and playing tokenized content from the Wylloh blockchain-based media licensing platform.")

# Website and support URLs
set(WEBSITE "https://wylloh.com")
set(FORUM_WEBSITE "https://forum.wylloh.com")
set(DOCS_WEBSITE "https://docs.wylloh.com")

# Version information
set(VERSION_MAJOR 1)
set(VERSION_MINOR 0)
set(VERSION_TAG "ALPHA1")
set(VERSION_CODE "1.0.100")

# Set branding paths
set(BRANDING_DIR "${CMAKE_SOURCE_DIR}/branding")
set(BRANDING_IMAGES_DIR "${BRANDING_DIR}/images")
set(BRANDING_SPLASH_DIR "${BRANDING_DIR}/splash")

# Custom branding function
function(apply_wylloh_branding)
  message(STATUS "Applying Wylloh branding...")
  
  # Replace icon files during build process
  if(EXISTS "${BRANDING_IMAGES_DIR}/icon.png")
    configure_file(
      "${BRANDING_IMAGES_DIR}/icon.png"
      "${CMAKE_BINARY_DIR}/media/icon.png"
      COPYONLY
    )
  endif()
  
  # Replace splash screen
  if(EXISTS "${BRANDING_SPLASH_DIR}/splash.jpg")
    configure_file(
      "${BRANDING_SPLASH_DIR}/splash.jpg"
      "${CMAKE_BINARY_DIR}/media/splash.jpg"
      COPYONLY
    )
  endif()
  
  # Additional branding substitution can be added here
  
  message(STATUS "Wylloh branding applied")
endfunction() 
# Wylloh Logo Usage Guide

## 📁 **Available Logo Assets**

### SVG Files (Vector - Recommended)
- `logo-white.svg` - White logo for dark backgrounds
- `logo-black.svg` - Black logo for light backgrounds  
- `logo-horizontal.svg` - Horizontal layout with text for navigation bars

### PNG Files (Raster - For specific use cases)
- `logo192.png` - 192x192px for PWA manifest
- `logo512.png` - 512x512px for PWA manifest
- `favicon.svg` - SVG favicon for modern browsers

## 🎨 **QC Improvements Made**

### ✅ **Centering & Symmetry**
- Adjusted viewBox from `0 0 367 354` to `0 0 400 400`
- Added `translate(16.5, 23)` transform for perfect centering
- Ensured vertical symmetry and proper margins

### ✅ **Standardized Dimensions**
- All logos now use consistent 400x400 base canvas
- Horizontal variant optimized for 600x200 navigation use
- Proper aspect ratio preservation

### ✅ **Professional Margins**
- 16.5px horizontal margins
- 23px vertical margins
- Consistent spacing across all variants

## 🔧 **React Component Usage**

```tsx
import WyllohLogo from '../components/common/WyllohLogo';

// Basic usage
<WyllohLogo />

// With variants and sizes
<WyllohLogo variant="black" size="large" />
<WyllohLogo variant="horizontal" size="medium" />

// With click handler
<WyllohLogo 
  variant="white" 
  size="xlarge" 
  onClick={() => navigate('/')} 
/>

// With custom styling
<WyllohLogo 
  variant="black"
  size="medium"
  sx={{ 
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
    '&:hover': { opacity: 0.8 }
  }}
/>
```

## 📐 **Size Guidelines**

### Standard Logo Sizes
- **Small**: 32x32px - For buttons, icons
- **Medium**: 48x48px - For cards, thumbnails  
- **Large**: 64x64px - For headers, prominent placement
- **XLarge**: 96x96px - For hero sections, splash screens

### Horizontal Logo Sizes
- **Small**: 120x40px - For compact navigation
- **Medium**: 180x60px - For standard navigation bars
- **Large**: 240x80px - For prominent headers
- **XLarge**: 300x100px - For hero sections

## 🎯 **Usage Recommendations**

### ✅ **DO**
- Use white logo on dark backgrounds (#000000, dark themes)
- Use black logo on light backgrounds (#ffffff, light themes)
- Use horizontal variant in navigation bars
- Maintain minimum clear space around logo
- Use SVG format when possible for crisp scaling

### ❌ **DON'T**
- Stretch or distort the logo proportions
- Use white logo on light backgrounds
- Use black logo on dark backgrounds
- Place logo on busy or low-contrast backgrounds
- Modify the logo colors or add effects

## 🔄 **Generating PNG Assets**

To generate the PNG files from SVG (requires ImageMagick or Inkscape):

```bash
# Using ImageMagick
convert logo-white.svg -resize 192x192 logo192.png
convert logo-white.svg -resize 512x512 logo512.png

# Using Inkscape
inkscape --export-png=logo192.png --export-width=192 --export-height=192 logo-white.svg
inkscape --export-png=logo512.png --export-width=512 --export-height=512 logo-white.svg
```

## 🌐 **Web Integration**

### HTML Meta Tags
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/logo192.png">
<meta property="og:image" content="/logo512.png">
```

### PWA Manifest
```json
{
  "icons": [
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png", 
      "type": "image/png",
      "sizes": "512x512"
    }
  ]
}
```

## 🎨 **Brand Colors**

- **Primary Black**: #000000
- **Primary White**: #ffffff
- **Background Dark**: #121212
- **Background Light**: #fafafa

---

*For questions about logo usage or to request additional formats, please contact the design team.* 
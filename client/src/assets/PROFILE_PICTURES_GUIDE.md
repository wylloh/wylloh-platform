# Wylloh Profile Pictures & GitHub Migration Guide

## 📸 Profile Picture Assets

### Available Profile Pictures

#### **Black Logo on White Background** (Light Theme)
- `pfp-black-on-white.png` - 400×400px (High Resolution)
- `pfp-black-on-white-200.png` - 200×200px (Standard Resolution)

#### **White Logo on Black Background** (Dark Theme)
- `pfp-white-on-black.png` - 400×400px (High Resolution)
- `pfp-white-on-black-200.png` - 200×200px (Standard Resolution)

### Usage Recommendations

#### **GitHub Organization Profile**
- **Primary**: `pfp-black-on-white.png` (400×400px)
- **Fallback**: `pfp-black-on-white-200.png` (200×200px)
- **Reason**: GitHub's interface typically uses light backgrounds

#### **Social Media Platforms**
- **Twitter/X**: `pfp-black-on-white-200.png` (adapts well to both light/dark themes)
- **LinkedIn**: `pfp-black-on-white-200.png` (professional appearance)
- **Discord**: `pfp-white-on-black-200.png` (matches Discord's dark theme)

#### **Documentation & Websites**
- **Light Theme**: `pfp-black-on-white.png`
- **Dark Theme**: `pfp-white-on-black.png`
- **Adaptive**: Use CSS media queries to switch between versions

### Technical Specifications

- **Format**: PNG with transparency support
- **Dimensions**: Square (1:1 aspect ratio)
- **Color Depth**: 24-bit RGB
- **Background**: Solid color (white or black)
- **Logo**: Centered with appropriate margins

## 🏢 GitHub Organization Migration

### Step 1: Create GitHub Organization

1. **Go to GitHub**: https://github.com/organizations/new
2. **Organization Name**: `wylloh`
3. **Contact Email**: Use your professional email
4. **Organization Type**: Choose appropriate plan
5. **Upload Profile Picture**: Use `pfp-black-on-white.png`

### Step 2: Transfer Repository

#### Option A: Transfer Existing Repository (Recommended)
1. **In Current Repository**: Go to Settings → General → Transfer ownership
2. **New Owner**: `wylloh`
3. **Repository Name**: Keep as `wylloh-platform` or rename as desired
4. **Confirm Transfer**: Type repository name to confirm

#### Option B: Create New Repository and Push
```bash
# Create new repository at github.com/wylloh/wylloh-platform
# Then update remote:
git remote set-url origin https://github.com/wylloh/wylloh-platform.git
git push -u origin main
```

### Step 3: Update Repository Settings

1. **Repository Description**: "Professional blockchain-based content management platform for Hollywood filmmakers"
2. **Website**: Add your domain when ready
3. **Topics**: Add relevant tags (blockchain, filmmaking, content-management, web3)
4. **README**: Update with professional branding
5. **License**: Ensure appropriate license is set

### Step 4: Update Documentation

Update all references to the old repository URL:
- README.md
- Package.json
- Documentation files
- CI/CD configurations

### Step 5: Professional Repository Setup

#### **Branch Protection Rules**
- Require pull request reviews
- Require status checks
- Restrict pushes to main branch

#### **Repository Secrets**
- Move environment variables
- Update deployment keys
- Configure CI/CD secrets

#### **Team Management**
- Add team members with appropriate permissions
- Set up code review requirements
- Configure notification settings

## 🎨 Brand Consistency

### Profile Picture Usage Guidelines

#### **Do's**
✅ Use the appropriate version for the platform's theme  
✅ Maintain the square aspect ratio  
✅ Use high-resolution versions for important platforms  
✅ Keep the logo centered and properly sized  

#### **Don'ts**
❌ Don't stretch or distort the logo  
❌ Don't add additional elements or text  
❌ Don't use low-resolution versions for high-visibility platforms  
❌ Don't modify the colors or design  

### Platform-Specific Recommendations

#### **GitHub Organization**
- **Profile Picture**: `pfp-black-on-white.png`
- **Banner**: Consider creating a banner with the horizontal logo
- **Bio**: "Professional blockchain platform for Hollywood filmmakers"

#### **Social Media Consistency**
- Use the same profile picture across all platforms
- Maintain consistent bio/description
- Use the horizontal logo for banners when possible

## 📋 Migration Checklist

### Pre-Migration
- [ ] Create GitHub organization `wylloh`
- [ ] Upload profile picture
- [ ] Set up organization settings
- [ ] Prepare team member list

### During Migration
- [ ] Transfer repository or create new one
- [ ] Update remote URLs
- [ ] Verify all branches transferred
- [ ] Check repository settings
- [ ] Update documentation

### Post-Migration
- [ ] Update all external references
- [ ] Notify team members
- [ ] Update CI/CD configurations
- [ ] Test deployment pipelines
- [ ] Update domain/DNS if applicable

### Professional Polish
- [ ] Add comprehensive README
- [ ] Set up branch protection
- [ ] Configure team permissions
- [ ] Add repository topics/tags
- [ ] Create organization profile README

## 🚀 Next Steps

1. **Create Organization**: Set up `github.com/wylloh`
2. **Transfer Repository**: Move to professional organization
3. **Update Branding**: Apply new profile pictures
4. **Team Setup**: Add collaborators and set permissions
5. **Documentation**: Update all references and links
6. **Deployment**: Ensure CI/CD works with new repository

This migration will significantly enhance your professional presence and prepare Wylloh for production deployment and potential investor/partner presentations. 
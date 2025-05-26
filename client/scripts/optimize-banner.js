#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../src/assets/Wylloh-Hero_upscaled.jpeg');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/images');
const BASE_NAME = 'wylloh-hero-banner';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Image configurations
const configs = [
  // Desktop versions (1920x640 - 3:1 ratio)
  {
    width: 1920,
    height: 640,
    quality: 85,
    format: 'webp',
    suffix: '',
    description: 'Desktop WebP (primary)'
  },
  {
    width: 1920,
    height: 640,
    quality: 80,
    format: 'jpeg',
    suffix: '',
    description: 'Desktop JPEG (fallback)'
  },
  
  // Tablet versions (1200x400 - 3:1 ratio)
  {
    width: 1200,
    height: 400,
    quality: 85,
    format: 'webp',
    suffix: '-tablet',
    description: 'Tablet WebP'
  },
  {
    width: 1200,
    height: 400,
    quality: 80,
    format: 'jpeg',
    suffix: '-tablet',
    description: 'Tablet JPEG'
  },
  
  // Mobile versions (800x267 - 3:1 ratio)
  {
    width: 800,
    height: 267,
    quality: 85,
    format: 'webp',
    suffix: '-mobile',
    description: 'Mobile WebP'
  },
  {
    width: 800,
    height: 267,
    quality: 80,
    format: 'jpeg',
    suffix: '-mobile',
    description: 'Mobile JPEG'
  },
  
  // High-DPI versions (2x scale for retina displays)
  {
    width: 3840,
    height: 1280,
    quality: 75,
    format: 'webp',
    suffix: '-2x',
    description: 'Desktop 2x WebP (retina)'
  },
  {
    width: 3840,
    height: 1280,
    quality: 70,
    format: 'jpeg',
    suffix: '-2x',
    description: 'Desktop 2x JPEG (retina)'
  }
];

async function optimizeImage(config) {
  const outputPath = path.join(OUTPUT_DIR, `${BASE_NAME}${config.suffix}.${config.format}`);
  
  try {
    console.log(`🎬 Processing: ${config.description}...`);
    
    let pipeline = sharp(INPUT_FILE)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      });
    
    if (config.format === 'webp') {
      pipeline = pipeline.webp({ 
        quality: config.quality,
        effort: 6 // Higher effort for better compression
      });
    } else if (config.format === 'jpeg') {
      pipeline = pipeline.jpeg({ 
        quality: config.quality,
        progressive: true,
        mozjpeg: true // Better compression
      });
    }
    
    const info = await pipeline.toFile(outputPath);
    
    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    console.log(`✅ ${config.description}: ${config.width}x${config.height} → ${fileSizeKB}KB`);
    
    return {
      ...config,
      outputPath,
      fileSize: fileSizeKB,
      info
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${config.description}:`, error.message);
    return null;
  }
}

async function generateOptimizedImages() {
  console.log('🎭 Wylloh Banner Optimization Script');
  console.log('=====================================\n');
  
  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  // Get original file info
  const originalStats = fs.statSync(INPUT_FILE);
  const originalSizeMB = Math.round(originalStats.size / (1024 * 1024) * 10) / 10;
  
  console.log(`📁 Input: ${path.basename(INPUT_FILE)} (${originalSizeMB}MB)`);
  console.log(`📂 Output: ${OUTPUT_DIR}\n`);
  
  // Process all configurations
  const results = [];
  for (const config of configs) {
    const result = await optimizeImage(config);
    if (result) {
      results.push(result);
    }
  }
  
  // Generate summary
  console.log('\n🎯 Optimization Summary:');
  console.log('========================');
  
  const totalOriginalSize = originalSizeMB * 1024; // Convert to KB
  const totalOptimizedSize = results.reduce((sum, result) => sum + result.fileSize, 0);
  const savings = Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100);
  
  console.log(`📊 Original: ${originalSizeMB}MB`);
  console.log(`📊 Optimized: ${Math.round(totalOptimizedSize / 1024 * 10) / 10}MB (${results.length} files)`);
  console.log(`💾 Space savings: ${savings}%\n`);
  
  // Generate usage examples
  console.log('🚀 Usage Examples:');
  console.log('==================');
  console.log(`
// React component with responsive images
<picture>
  <source 
    media="(max-width: 768px)" 
    srcSet="./assets/images/${BASE_NAME}-mobile.webp"
    type="image/webp" 
  />
  <source 
    media="(max-width: 768px)" 
    srcSet="./assets/images/${BASE_NAME}-mobile.jpeg"
    type="image/jpeg" 
  />
  <source 
    media="(max-width: 1200px)" 
    srcSet="./assets/images/${BASE_NAME}-tablet.webp"
    type="image/webp" 
  />
  <source 
    media="(max-width: 1200px)" 
    srcSet="./assets/images/${BASE_NAME}-tablet.jpeg"
    type="image/jpeg" 
  />
  <source 
    srcSet="./assets/images/${BASE_NAME}.webp"
    type="image/webp" 
  />
  <img 
    src="./assets/images/${BASE_NAME}.jpeg" 
    alt="Wylloh Platform - Hollywood's Digital Content Hub"
    style={{ width: '100%', height: 'auto' }}
  />
</picture>
  `);
  
  console.log('✨ Optimization complete! Your banner is now web-ready.');
}

// Run the optimization
if (require.main === module) {
  generateOptimizedImages().catch(console.error);
}

module.exports = { generateOptimizedImages }; 
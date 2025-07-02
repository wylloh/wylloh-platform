#!/bin/bash

# 🎭 THE COCOANUTS (1929) - FEATURE FILM PROCESSING PIPELINE
# Wylloh Platform - Marx Brothers Tokenization Pipeline
# Processes 96-minute feature film for blockchain streaming

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INPUT_DIR="$PROJECT_ROOT/film_test/The Cocoanuts (1929)"
OUTPUT_DIR="$PROJECT_ROOT/processed/The Cocoanuts (1929)"
TEMP_DIR="$OUTPUT_DIR/temp"

# Create output directories
mkdir -p "$OUTPUT_DIR/video"
mkdir -p "$OUTPUT_DIR/audio"
mkdir -p "$OUTPUT_DIR/thumbnails"
mkdir -p "$OUTPUT_DIR/chapters"
mkdir -p "$OUTPUT_DIR/metadata"
mkdir -p "$TEMP_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎭 THE COCOANUTS (1929) - FEATURE FILM PROCESSING PIPELINE${NC}"
echo -e "${BLUE}Processing Marx Brothers classic for blockchain tokenization${NC}"
echo ""

# Input file
INPUT_FILE="$INPUT_DIR/The Cocoanuts (1929).mp4"
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: Source file not found: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Source file found: $(basename "$INPUT_FILE")${NC}"
echo -e "${YELLOW}📊 Analyzing source video...${NC}"

# Get video information
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$INPUT_FILE")
DURATION_FORMATTED=$(date -u -d @${DURATION%.*} +%H:%M:%S)
echo -e "${BLUE}📽️  Duration: $DURATION_FORMATTED (${DURATION%.*} seconds)${NC}"

# Get video dimensions
VIDEO_INFO=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height,codec_name,bit_rate -of csv=s=x:p=0 "$INPUT_FILE")
echo -e "${BLUE}🎬 Video: $VIDEO_INFO${NC}"

# Get audio information  
AUDIO_INFO=$(ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,bit_rate,channels -of csv=s=,:p=0 "$INPUT_FILE")
echo -e "${BLUE}🎵 Audio: $AUDIO_INFO${NC}"

echo ""
echo -e "${YELLOW}🎯 PHASE 1: ADAPTIVE BITRATE ENCODING${NC}"
echo -e "${BLUE}Creating multiple quality versions for adaptive streaming...${NC}"

# Adaptive bitrate encoding optimized for Marx Brothers film
# 480p - Mobile/Low bandwidth
echo -e "${GREEN}📱 Encoding 480p (Mobile)...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -c:v libx264 -preset fast -crf 28 \
    -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
    -c:a aac -b:a 96k -ac 2 \
    -movflags +faststart \
    -y "$OUTPUT_DIR/video/cocoanuts_480p.mp4"

# 720p - Standard quality
echo -e "${GREEN}💻 Encoding 720p (Standard)...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -c:v libx264 -preset fast -crf 26 \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -c:a aac -b:a 128k -ac 2 \
    -movflags +faststart \
    -y "$OUTPUT_DIR/video/cocoanuts_720p.mp4"

# 1080p - High quality (preserve original aspect ratio for 1929 film)
echo -e "${GREEN}🎭 Encoding 1080p (High Quality - Marx Brothers Original)...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -c:v libx264 -preset slow -crf 22 \
    -vf "scale=1440:1080:force_original_aspect_ratio=decrease" \
    -c:a aac -b:a 160k -ac 2 \
    -movflags +faststart \
    -y "$OUTPUT_DIR/video/cocoanuts_1080p.mp4"

echo ""
echo -e "${YELLOW}🎯 PHASE 2: AUDIO OPTIMIZATION${NC}"
echo -e "${BLUE}Optimizing audio for musical comedy dialogue and songs...${NC}"

# Extract high-quality audio for musical numbers
echo -e "${GREEN}🎵 Extracting high-quality audio track...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -c:a flac \
    -y "$OUTPUT_DIR/audio/cocoanuts_master_audio.flac"

# Create web-optimized audio
echo -e "${GREEN}🎶 Creating web-optimized audio...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -c:a aac -b:a 160k -ac 2 \
    -y "$OUTPUT_DIR/audio/cocoanuts_web_audio.aac"

echo ""
echo -e "${YELLOW}🎯 PHASE 3: THUMBNAIL GENERATION${NC}"
echo -e "${BLUE}Generating thumbnails for progress tracking and previews...${NC}"

# Generate thumbnails every 30 seconds for 93-minute film
echo -e "${GREEN}📸 Generating progress thumbnails (every 30 seconds)...${NC}"
ffmpeg -i "$INPUT_FILE" \
    -vf "fps=1/30,scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2" \
    -y "$OUTPUT_DIR/thumbnails/thumb_%04d.jpg"

# Generate high-quality poster frames
echo -e "${GREEN}🖼️  Generating poster frames...${NC}"
# Opening scene
ffmpeg -i "$INPUT_FILE" -ss 00:01:00 -vframes 1 -q:v 2 -y "$OUTPUT_DIR/thumbnails/poster_opening.jpg"
# Mid-film
ffmpeg -i "$INPUT_FILE" -ss 00:46:30 -vframes 1 -q:v 2 -y "$OUTPUT_DIR/thumbnails/poster_middle.jpg"
# Climax
ffmpeg -i "$INPUT_FILE" -ss 01:20:00 -vframes 1 -q:v 2 -y "$OUTPUT_DIR/thumbnails/poster_climax.jpg"

echo ""
echo -e "${YELLOW}🎯 PHASE 4: CHAPTER MARKERS${NC}"
echo -e "${BLUE}Creating chapter markers for 96-minute feature navigation...${NC}"

# Generate chapter markers every 10 minutes for feature film
cat > "$OUTPUT_DIR/chapters/chapters.txt" << EOF
# The Cocoanuts (1929) - Chapter Markers
# Marx Brothers Musical Comedy - 96 minutes

00:00:00 Opening Credits
00:05:00 Hotel Florida Introduction
00:15:00 Marx Brothers Enter
00:25:00 Musical Number: "When My Dreams Come True"
00:35:00 The Auction Sequence
00:45:00 Romance Subplot
00:55:00 Comedy Escalation
01:05:00 Musical Number: "Monkey Doodle Doo"
01:15:00 Climactic Chaos
01:25:00 Resolution & Finale
01:32:00 End Credits
EOF

echo -e "${GREEN}📑 Chapter markers created for Marx Brothers scenes${NC}"

echo ""
echo -e "${YELLOW}🎯 PHASE 5: METADATA EXTRACTION${NC}"
echo -e "${BLUE}Creating comprehensive metadata for blockchain tokenization...${NC}"

# Generate comprehensive metadata
cat > "$OUTPUT_DIR/metadata/film_metadata.json" << EOF
{
  "title": "The Cocoanuts",
  "year": 1929,
  "runtime": "$DURATION_FORMATTED",
  "runtime_seconds": ${DURATION%.*},
  "genre": ["Musical", "Comedy"],
  "director": "Robert Florey",
  "writers": ["George S. Kaufman", "Morrie Ryskind"],
  "stars": [
    "Groucho Marx",
    "Harpo Marx", 
    "Chico Marx",
    "Zeppo Marx",
    "Margaret Dumont",
    "Kay Francis"
  ],
  "studio": "Paramount Pictures",
  "significance": "First Marx Brothers film, transition from vaudeville to cinema",
  "musical_numbers": [
    "When My Dreams Come True",
    "Monkey Doodle Doo"
  ],
  "technical_specs": {
    "original_format": "35mm film",
    "aspect_ratio": "1.33:1 (4:3)",
    "sound": "Early talkie with musical numbers",
    "restoration": "Archive.org digital restoration"
  },
  "blockchain_ready": true,
  "public_domain": true,
  "tokenization_tiers": {
    "stream": 1,
    "download": 25,
    "commercial": 250,
    "master_archive": 2500
  },
  "processing_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "processed_by": "Wylloh Platform - Marx Brothers Pipeline"
}
EOF

echo -e "${GREEN}📋 Comprehensive metadata generated${NC}"

echo ""
echo -e "${YELLOW}🎯 PHASE 6: IPFS OPTIMIZATION${NC}"
echo -e "${BLUE}Optimizing files for IPFS distributed storage...${NC}"

# Create IPFS-optimized file manifest
cat > "$OUTPUT_DIR/ipfs_manifest.json" << EOF
{
  "content_id": "cocoanuts_1929",
  "title": "The Cocoanuts (1929)",
  "total_files": $(find "$OUTPUT_DIR" -type f | wc -l),
  "total_size_mb": $(du -sm "$OUTPUT_DIR" | cut -f1),
  "video_files": {
    "480p": "video/cocoanuts_480p.mp4",
    "720p": "video/cocoanuts_720p.mp4", 
    "1080p": "video/cocoanuts_1080p.mp4"
  },
  "audio_files": {
    "master": "audio/cocoanuts_master_audio.flac",
    "web": "audio/cocoanuts_web_audio.aac"
  },
  "thumbnails": "thumbnails/",
  "chapters": "chapters/chapters.txt",
  "metadata": "metadata/film_metadata.json",
  "optimized_for": "IPFS distributed storage",
  "chunk_size": "256KB recommended"
}
EOF

echo -e "${GREEN}📦 IPFS manifest created${NC}"

# Calculate file sizes
echo ""
echo -e "${YELLOW}📊 PROCESSING SUMMARY${NC}"
echo -e "${BLUE}File sizes and optimization results:${NC}"

for file in "$OUTPUT_DIR/video"/*.mp4; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        filename=$(basename "$file")
        echo -e "${GREEN}📼 $filename: $size${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ THE COCOANUTS PROCESSING COMPLETE!${NC}"
echo -e "${PURPLE}🎭 Marx Brothers classic ready for blockchain tokenization${NC}"
echo -e "${BLUE}📂 Output directory: $OUTPUT_DIR${NC}"
echo -e "${YELLOW}🚀 Ready for IPFS upload and smart contract deployment${NC}"

# Cleanup temp directory
rm -rf "$TEMP_DIR"

echo ""
echo -e "${PURPLE}🎪 \"Say the secret word and the duck comes down!\" - Groucho Marx${NC}" 
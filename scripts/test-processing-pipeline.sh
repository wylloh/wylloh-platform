#!/bin/bash

# 🎭 PROCESSING PIPELINE VALIDATION TEST
# Quick test to ensure all components are ready before full processing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${PURPLE}🎭 WYLLOH PROCESSING PIPELINE - VALIDATION TEST${NC}"
echo -e "${BLUE}Testing all components before Marx Brothers processing${NC}"
echo ""

# Test 1: FFmpeg availability and codecs
echo -e "${YELLOW}🧪 Test 1: FFmpeg and Codec Availability${NC}"
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✅ FFmpeg installed: $(ffmpeg -version | head -1 | cut -d' ' -f3)${NC}"
    
    # Test essential codecs
    if ffmpeg -codecs 2>/dev/null | grep -q "libx264"; then
        echo -e "${GREEN}✅ H.264 codec available${NC}"
    else
        echo -e "${RED}❌ H.264 codec missing${NC}"
        exit 1
    fi
    
    if ffmpeg -codecs 2>/dev/null | grep -q "aac"; then
        echo -e "${GREEN}✅ AAC audio codec available${NC}"
    else
        echo -e "${RED}❌ AAC audio codec missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ FFmpeg not found${NC}"
    exit 1
fi

# Test 2: Source file availability
echo ""
echo -e "${YELLOW}🧪 Test 2: Source File Validation${NC}"
SOURCE_FILE="film_test/The Cocoanuts (1929)/The Cocoanuts (1929).mp4"
if [ -f "$SOURCE_FILE" ]; then
    echo -e "${GREEN}✅ Source file found: $SOURCE_FILE${NC}"
    
    # Get basic info
    DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$SOURCE_FILE" 2>/dev/null || echo "unknown")
    FILESIZE=$(du -h "$SOURCE_FILE" | cut -f1)
    echo -e "${BLUE}📊 File size: $FILESIZE${NC}"
    echo -e "${BLUE}📊 Duration: ${DURATION%.*} seconds${NC}"
else
    echo -e "${RED}❌ Source file not found: $SOURCE_FILE${NC}"
    exit 1
fi

# Test 3: Output directory creation
echo ""
echo -e "${YELLOW}🧪 Test 3: Output Directory Structure${NC}"
mkdir -p "processed/test_output"/{video,audio,thumbnails,chapters,metadata}
if [ -d "processed/test_output" ]; then
    echo -e "${GREEN}✅ Output directories can be created${NC}"
    rm -rf "processed/test_output"
else
    echo -e "${RED}❌ Cannot create output directories${NC}"
    exit 1
fi

# Test 4: Quick encoding test (first 10 seconds)
echo ""
echo -e "${YELLOW}🧪 Test 4: Quick Encoding Test${NC}"
echo -e "${BLUE}Testing 10-second encode to validate pipeline...${NC}"

TEMP_TEST="temp_test_$(date +%s).mp4"
ffmpeg -i "$SOURCE_FILE" -t 10 -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -y "$TEMP_TEST" 2>/dev/null

if [ -f "$TEMP_TEST" ]; then
    TEST_SIZE=$(du -h "$TEMP_TEST" | cut -f1)
    echo -e "${GREEN}✅ Encoding test successful: $TEST_SIZE output${NC}"
    rm -f "$TEMP_TEST"
else
    echo -e "${RED}❌ Encoding test failed${NC}"
    exit 1
fi

# Test 5: Thumbnail extraction test
echo ""
echo -e "${YELLOW}🧪 Test 5: Thumbnail Extraction Test${NC}"
TEMP_THUMB="temp_thumb_$(date +%s).jpg"
ffmpeg -i "$SOURCE_FILE" -ss 00:01:00 -vframes 1 -q:v 2 -y "$TEMP_THUMB" 2>/dev/null

if [ -f "$TEMP_THUMB" ]; then
    THUMB_SIZE=$(du -h "$TEMP_THUMB" | cut -f1)
    echo -e "${GREEN}✅ Thumbnail extraction successful: $THUMB_SIZE${NC}"
    rm -f "$TEMP_THUMB"
else
    echo -e "${RED}❌ Thumbnail extraction failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo -e "${PURPLE}🎭 Processing pipeline ready for Marx Brothers tokenization${NC}"
echo -e "${YELLOW}🚀 Run: ./scripts/process-feature-film.sh to begin full processing${NC}"
echo ""
echo -e "${BLUE}💡 Estimated processing time for 96-minute feature: 15-30 minutes${NC}" 
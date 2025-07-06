#!/bin/bash
# Build Context Size Monitor
# Helps track and optimize Docker build context sizes

echo "🔍 Docker Build Context Size Analysis"
echo "======================================"
echo ""

# Check total build context size
echo "📊 Total Build Context Size:"
du -sh . | grep -v "^\s*0"
echo ""

# Break down by major directories
echo "📁 Directory Breakdown:"
echo "  - Client assets:"
du -sh client/ 2>/dev/null || echo "    client/ not found"
echo "  - API assets:"
du -sh api/ 2>/dev/null || echo "    api/ not found"
echo "  - Storage assets:"  
du -sh storage/ 2>/dev/null || echo "    storage/ not found"
echo "  - Contracts:"
du -sh contracts/ 2>/dev/null || echo "    contracts/ not found"
echo ""

# Check for common bloat sources
echo "⚠️  Common Bloat Sources:"
echo "  - node_modules directories:"
find . -name "node_modules" -type d -exec du -sh {} \; 2>/dev/null | head -5
echo ""
echo "  - Build outputs:"
find . -name "dist" -o -name "build" -type d -exec du -sh {} \; 2>/dev/null | head -5
echo ""
echo "  - Log files:"
find . -name "*.log" -exec du -sh {} \; 2>/dev/null | head -5
echo ""

# Check .dockerignore effectiveness
if [ -f ".dockerignore" ]; then
    echo "✅ .dockerignore file exists"
    ignored_items=$(grep -v "^#" .dockerignore | grep -v "^$" | wc -l)
    echo "   - Ignoring $ignored_items types of files/directories"
else
    echo "❌ No .dockerignore file found!"
    echo "   - This is likely causing the large build context"
fi
echo ""

# Size recommendations
total_size=$(du -sb . | cut -f1)
if [ $total_size -gt 104857600 ]; then  # 100MB
    echo "🚨 WARNING: Build context is larger than 100MB"
    echo "   Current size: $(du -sh . | cut -f1)"
    echo "   Recommended: <50MB for optimal build performance"
    echo "   - Consider updating .dockerignore"
    echo "   - Run 'npm run clean' or similar cleanup commands"
    echo "   - Remove unnecessary files from version control"
else
    echo "✅ Build context size is reasonable: $(du -sh . | cut -f1)"
fi
echo ""

echo "💡 Quick fixes if size is large:"
echo "   - Add node_modules/ to .dockerignore"
echo "   - Add dist/, build/ directories to .dockerignore"  
echo "   - Add .git/ to .dockerignore"
echo "   - Run: rm -rf */node_modules */dist */build"
echo "   - Run: docker system prune -af"
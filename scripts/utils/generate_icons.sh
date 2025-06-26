#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    echo "On Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "On macOS: brew install imagemagick"
    exit 1
fi

# Source SVG file
SVG_FILE="public/icons/icon-base.svg"

# Check if source file exists
if [ ! -f "$SVG_FILE" ]; then
    echo "Source SVG file not found: $SVG_FILE"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Generate PNG icons in different sizes
SIZES=(72 96 128 144 152 192 384 512)

for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="public/icons/icon-${SIZE}x${SIZE}.png"
    echo "Generating $OUTPUT_FILE"
    convert -background none -size "${SIZE}x${SIZE}" "$SVG_FILE" "$OUTPUT_FILE"
done

echo "All icons generated successfully!"

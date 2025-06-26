#!/bin/bash

# Create directory for map icons
mkdir -p public/icons

# Create SVG icons for different facility types
cat > public/icons/hospital-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#ef4444" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M10.5 7v2h-2v2h2v2h3v-2h2V9h-2V7z"/>
</svg>
EOL

cat > public/icons/clinic-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#3b82f6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M10.5 7v2h-2v2h2v2h3v-2h2V9h-2V7z"/>
</svg>
EOL

cat > public/icons/pharmacy-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#10b981" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M12 6l-1 2H8v2h1l-1 2h2l1-2h2l-1 2h2l1-2h1V8h-3l1-2z"/>
</svg>
EOL

cat > public/icons/lab-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#8b5cf6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M14 7.8V6h-4v1.8l2 2.7V13h-2v2h6v-2h-2v-2.5z"/>
</svg>
EOL

cat > public/icons/vaccination-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#f59e0b" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M14.5 6.5l-6 6 1 1 6-6-1-1zM9 12l-1 3 3-1-2-2z"/>
</svg>
EOL

cat > public/icons/blood-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#ef4444" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M12 6c-1.1 0-2 0.9-2 2 0 0.74 0.4 1.38 1 1.72V13h2v-3.28c0.6-0.35 1-0.98 1-1.72 0-1.1-0.9-2-2-2z"/>
</svg>
EOL

cat > public/icons/screening-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#06b6d4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M12 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-0.55 0-1-0.45-1-1s0.45-1 1-1 1 0.45 1 1-0.45 1-1 1z"/>
</svg>
EOL

cat > public/icons/health-marker.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#3b82f6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  <path fill="white" d="M12 7c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z"/>
</svg>
EOL

# Convert SVG to PNG using ImageMagick if available
if command -v convert &> /dev/null; then
  echo "Converting SVG icons to PNG..."
  for svg in public/icons/*.svg; do
    png="${svg%.svg}.png"
    convert -background none "$svg" "$png"
    echo "Created $png"
  done
else
  echo "ImageMagick not found. Please install it to convert SVG to PNG."
  echo "For now, the SVG files will be used directly."
fi

echo "Map icons created successfully!"

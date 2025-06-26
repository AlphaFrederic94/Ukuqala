#!/bin/bash
# Script to fix the SocialFeedPage.tsx file

# Make a backup of the original file
cp src/pages/social/SocialFeedPage.tsx src/pages/social/SocialFeedPage.tsx.original

# Remove the problematic line
sed -i '2700d' src/pages/social/SocialFeedPage.tsx

# Add a closing div tag
sed -i '2700i\\        </div>' src/pages/social/SocialFeedPage.tsx

# Make the script executable
chmod +x fix_social_feed.sh

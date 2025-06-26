#!/usr/bin/env python3

# Read the original file
with open('src/pages/social/SocialFeedPage.tsx.original', 'r') as f:
    lines = f.readlines()

# Remove the problematic line (line 2700)
if len(lines) >= 2700:
    del lines[2699]  # 0-indexed, so line 2700 is at index 2699

# Write the fixed file
with open('src/pages/social/SocialFeedPage.tsx.fixed', 'w') as f:
    f.writelines(lines)

print("File fixed successfully!")

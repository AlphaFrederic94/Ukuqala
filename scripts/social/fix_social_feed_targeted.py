#!/usr/bin/env python3

# Read the original file
with open('src/pages/social/SocialFeedPage.tsx.original', 'r') as f:
    content = f.read()

# Find the problematic section and fix it
problematic = ") : null\n          )"
fixed = ") : null"

# Replace the problematic section
fixed_content = content.replace(problematic, fixed)

# Write the fixed file
with open('src/pages/social/SocialFeedPage.tsx.fixed2', 'w') as f:
    f.write(fixed_content)

print("File fixed successfully!")

# CareAI Social Features

This document provides instructions for setting up and using the social features in the CareAI application.

## Overview

The CareAI social features include:

- Social feed with posts, likes, and comments
- Real-time chat between users
- Friend requests and friend management
- Notifications for social interactions
- Health-focused channels and groups

## Setup Instructions

To set up the social features, follow these steps:

1. Run the setup utility:
   ```
   node setup-social-features.js
   ```

2. Follow the instructions provided by the utility:
   - Log in to your Supabase dashboard
   - Go to the SQL Editor
   - Create a new query
   - Copy and paste the SQL script from the `fix_social_features.sql` file
   - Run the query
   - Restart your application

3. Verify that the social features are properly set up by checking the social feed page in the application.

## Database Structure

The social features use the following database tables:

- `social_posts`: Stores user posts
- `post_comments`: Stores comments on posts
- `post_likes`: Stores likes on posts
- `user_friendships`: Stores friend relationships between users
- `chat_messages`: Stores direct messages between users
- `chat_groups`: Stores group chat information
- `chat_group_members`: Stores group chat membership
- `chat_group_messages`: Stores messages in group chats
- `notifications`: Stores user notifications

## Fallback Behavior

The social features include fallback behavior for when the database tables are not properly set up:

- If the database tables don't exist, the application will display sample data
- If the stored procedures don't exist, the application will use alternative methods to fetch data
- If the storage bucket doesn't exist, the application will use placeholder images

## Troubleshooting

If you encounter issues with the social features, try the following:

1. Check if the database tables are properly set up by running the setup utility again
2. Check the browser console for error messages
3. Verify that the Supabase URL and key are correctly configured in your environment variables
4. Make sure that the Row Level Security (RLS) policies are properly set up in Supabase

## Development

When developing new social features, keep the following in mind:

- Use the `socialService`, `chatService`, and `friendshipService` for interacting with the database
- Add proper error handling for database operations
- Use the `checkSocialFeatures` utility to verify that the required tables exist
- Provide fallback behavior for when the database tables don't exist

## Contributing

To contribute to the social features, please follow these guidelines:

1. Make sure your code works with both real data and fallback data
2. Add proper error handling for all database operations
3. Update the translations in `src/locales/en/social.json` for any new UI text
4. Test your changes with both a properly set up database and without the required tables

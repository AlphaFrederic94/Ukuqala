-- CareAI Social Features Setup Script
-- This script creates all necessary tables, indexes, and functions for the social features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create execute_sql function for direct SQL execution
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SQL executed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO service_role;

-- Create social_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for social_posts table
CREATE INDEX IF NOT EXISTS social_posts_user_id_idx ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS social_posts_created_at_idx ON public.social_posts(created_at DESC);

-- Create post_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for post_comments table
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON public.post_comments(user_id);

-- Create post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for post_likes table
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON public.post_likes(user_id);

-- Create hashtags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for hashtags table
CREATE INDEX IF NOT EXISTS hashtags_name_idx ON public.hashtags (name);
CREATE INDEX IF NOT EXISTS hashtags_count_idx ON public.hashtags (count DESC);

-- Create saved_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create indexes for saved_posts table
CREATE INDEX IF NOT EXISTS saved_posts_user_id_idx ON public.saved_posts (user_id);
CREATE INDEX IF NOT EXISTS saved_posts_post_id_idx ON public.saved_posts (post_id);

-- Create RPC function to create hashtags table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_hashtags_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.hashtags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      count INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS hashtags_name_idx ON public.hashtags (name);
    CREATE INDEX IF NOT EXISTS hashtags_count_idx ON public.hashtags (count DESC);
  ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to create saved_posts table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_saved_posts_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.saved_posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
    
    CREATE INDEX IF NOT EXISTS saved_posts_user_id_idx ON public.saved_posts (user_id);
    CREATE INDEX IF NOT EXISTS saved_posts_post_id_idx ON public.saved_posts (post_id);
  ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to these functions
GRANT EXECUTE ON FUNCTION public.create_hashtags_table_if_not_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_hashtags_table_if_not_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.create_hashtags_table_if_not_exists() TO service_role;

GRANT EXECUTE ON FUNCTION public.create_saved_posts_table_if_not_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_saved_posts_table_if_not_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.create_saved_posts_table_if_not_exists() TO service_role;

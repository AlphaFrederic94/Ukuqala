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

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

-- Create RPC function to execute SQL
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get column names
CREATE OR REPLACE FUNCTION public.get_column_names(table_name TEXT)
RETURNS TABLE (column_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.attname::TEXT
  FROM pg_attribute a
  JOIN pg_class t ON a.attrelid = t.oid
  JOIN pg_namespace s ON t.relnamespace = s.oid
  WHERE a.attnum > 0
  AND NOT a.attisdropped
  AND t.relname = table_name
  AND s.nspname = 'public'
  ORDER BY a.attnum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create RPC function to create notifications table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_notifications_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      data JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
    CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);
    CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);
  ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

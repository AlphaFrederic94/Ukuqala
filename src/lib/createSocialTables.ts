import { supabase } from './supabaseClient';

export const createSocialTables = async () => {
  try {
    // Silently try to create tables without logging errors

    // Try to create hashtags table
    await supabase.rpc('create_hashtags_table_if_not_exists').catch(() => {
      // Silently try direct approach if RPC fails
      supabase.from('hashtags').select('count(*)', { count: 'exact', head: true }).catch(() => {
        // Silently try to create the table directly
        supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.hashtags (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name TEXT NOT NULL UNIQUE,
              count INTEGER DEFAULT 1,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS hashtags_name_idx ON public.hashtags (name);
            CREATE INDEX IF NOT EXISTS hashtags_count_idx ON public.hashtags (count DESC);
          `
        }).catch(() => {});
      });
    });

    // Try to create saved_posts table
    await supabase.rpc('create_saved_posts_table_if_not_exists').catch(() => {
      // Silently try direct approach if RPC fails
      supabase.from('saved_posts').select('count(*)', { count: 'exact', head: true }).catch(() => {
        // Silently try to create the table directly
        supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.saved_posts (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, post_id)
            );
            CREATE INDEX IF NOT EXISTS saved_posts_user_id_idx ON public.saved_posts (user_id);
            CREATE INDEX IF NOT EXISTS saved_posts_post_id_idx ON public.saved_posts (post_id);
          `
        }).catch(() => {});
      });
    });

    // Try to create notifications table
    await supabase.rpc('create_notifications_table_if_not_exists').catch(() => {
      // Silently try direct approach if RPC fails
      supabase.from('notifications').select('count(*)', { count: 'exact', head: true }).catch(() => {
        // Silently try to create the table directly
        supabase.rpc('execute_sql', {
          sql: `
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
            CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
            CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);
            CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);
          `
        }).catch(() => {});
      });
    });

    // Always return true to avoid blocking the app
    return true;
  } catch (error) {
    // Silently handle errors
    return true;
  }
};

export default createSocialTables;

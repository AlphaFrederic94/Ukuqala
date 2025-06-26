import { supabase } from './supabaseClient';

/**
 * This function sets up the social database tables directly using SQL
 * It's a fallback for when the RPC functions don't exist
 */
export const setupSocialTables = async () => {
  try {
    console.log('Setting up social database tables...');
    
    // First try to create the tables using direct SQL
    const createTablesSQL = `
      -- Enable UUID extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
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
    `;
    
    // Try to execute the SQL directly
    const { error } = await supabase.rpc('execute_sql', { sql: createTablesSQL });
    
    if (error) {
      console.error('Error executing SQL directly:', error);
      console.log('The execute_sql function might not exist. Please run the SQL script manually in the Supabase SQL editor.');
      
      // Try to create the tables one by one
      await createSocialPostsTable();
      await createHashtagsTable();
      await createSavedPostsTable();
    } else {
      console.log('Social database tables created successfully!');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up social database:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to set up social database tables. Please run the SQL script manually in the Supabase SQL editor.'
    };
  }
};

// Helper function to create social_posts table
const createSocialPostsTable = async () => {
  try {
    const { error } = await supabase.from('social_posts').select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating social_posts table...');
      
      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: `
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
          
          CREATE INDEX IF NOT EXISTS social_posts_user_id_idx ON public.social_posts(user_id);
          CREATE INDEX IF NOT EXISTS social_posts_created_at_idx ON public.social_posts(created_at DESC);
        `
      });
      
      if (createError) {
        console.error('Error creating social_posts table:', createError);
      } else {
        console.log('social_posts table created successfully');
      }
    } else {
      console.log('social_posts table already exists');
    }
  } catch (error) {
    console.error('Error checking/creating social_posts table:', error);
  }
};

// Helper function to create hashtags table
const createHashtagsTable = async () => {
  try {
    const { error } = await supabase.from('hashtags').select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating hashtags table...');
      
      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc('execute_sql', {
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
      });
      
      if (createError) {
        console.error('Error creating hashtags table:', createError);
      } else {
        console.log('hashtags table created successfully');
      }
    } else {
      console.log('hashtags table already exists');
    }
  } catch (error) {
    console.error('Error checking/creating hashtags table:', error);
  }
};

// Helper function to create saved_posts table
const createSavedPostsTable = async () => {
  try {
    const { error } = await supabase.from('saved_posts').select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating saved_posts table...');
      
      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc('execute_sql', {
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
      });
      
      if (createError) {
        console.error('Error creating saved_posts table:', createError);
      } else {
        console.log('saved_posts table created successfully');
      }
    } else {
      console.log('saved_posts table already exists');
    }
  } catch (error) {
    console.error('Error checking/creating saved_posts table:', error);
  }
};

export default setupSocialTables;

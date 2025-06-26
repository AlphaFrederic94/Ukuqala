import { supabase } from './supabaseClient';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');
    
    // Check if notifications table exists
    const { error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === '42P01') { // relation does not exist
      console.log('Creating notifications table...');
      
      // Create notifications table
      const { error: createError } = await supabase.rpc('create_notifications_table');
      
      if (createError) {
        console.error('Error creating notifications table:', createError);
        
        // Try direct SQL if RPC fails
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.notifications (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              link TEXT,
              read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              expires_at TIMESTAMP WITH TIME ZONE,
              data JSONB
            );
            CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
          `
        });
        
        if (sqlError) {
          console.error('Error creating notifications table with SQL:', sqlError);
        } else {
          console.log('Notifications table created successfully with SQL');
        }
      } else {
        console.log('Notifications table created successfully');
      }
    } else {
      console.log('Notifications table already exists');
    }
    
    // Check if post_comments table exists
    const { error: commentsCheckError } = await supabase
      .from('post_comments')
      .select('id')
      .limit(1);
      
    if (commentsCheckError && commentsCheckError.code === '42P01') { // relation does not exist
      console.log('Creating post_comments table...');
      
      // Create post_comments table
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.post_comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            parent_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
          CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON public.post_comments(user_id);
          CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON public.post_comments(parent_id);
        `
      });
      
      if (sqlError) {
        console.error('Error creating post_comments table with SQL:', sqlError);
      } else {
        console.log('post_comments table created successfully with SQL');
      }
    } else {
      console.log('post_comments table already exists');
    }
    
    // Check if user_friendships table exists
    const { error: friendshipsCheckError } = await supabase
      .from('user_friendships')
      .select('id')
      .limit(1);
      
    if (friendshipsCheckError && friendshipsCheckError.code === '42P01') { // relation does not exist
      console.log('Creating user_friendships table...');
      
      // Create user_friendships table
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.user_friendships (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            friend_id UUID NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, friend_id)
          );
          CREATE INDEX IF NOT EXISTS user_friendships_user_id_idx ON public.user_friendships(user_id);
          CREATE INDEX IF NOT EXISTS user_friendships_friend_id_idx ON public.user_friendships(friend_id);
          CREATE INDEX IF NOT EXISTS user_friendships_status_idx ON public.user_friendships(status);
        `
      });
      
      if (sqlError) {
        console.error('Error creating user_friendships table with SQL:', sqlError);
      } else {
        console.log('user_friendships table created successfully with SQL');
      }
    } else {
      console.log('user_friendships table already exists');
    }
    
    console.log('Database setup complete');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
};

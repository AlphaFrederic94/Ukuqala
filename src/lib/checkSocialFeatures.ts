import { supabase } from './supabaseClient';

/**
 * Checks if all required social feature tables exist and are properly configured
 * @returns An object with the status of each table and overall setup
 */
export const checkSocialFeatures = async () => {
  try {
    console.log('Checking social features setup...');

    const requiredTables = [
      'social_posts',
      'post_comments',
      'post_likes',
      'user_friendships',
      'chat_messages',
      'notifications'
    ];

    const tableStatus: Record<string, boolean> = {};
    let allTablesExist = true;

    // Check each table
    for (const table of requiredTables) {
      try {
        // First try a simple select that's less likely to fail with permissions issues
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          // If that fails, try a count which might work with different permissions
          try {
            const { count, error: countError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });

            if (countError && countError.code === '42P01') { // relation does not exist
              console.error(`Table ${table} does not exist`);
              tableStatus[table] = false;
              allTablesExist = false;
            } else if (countError) {
              console.error(`Error counting records in table ${table}:`, countError);
              tableStatus[table] = false;
              allTablesExist = false;
            } else {
              console.log(`Table ${table} exists with ${count} records`);
              tableStatus[table] = true;
            }
          } catch (countError) {
            console.error(`Error checking table ${table} with count:`, countError);
            tableStatus[table] = false;
            allTablesExist = false;
          }
        } else {
          console.log(`Table ${table} exists`);
          tableStatus[table] = true;
        }
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
        tableStatus[table] = false;
        allTablesExist = false;
      }
    }

    // Check storage bucket
    let storageBucketExists = false;
    try {
      // First check if the bucket exists
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (!error && buckets) {
        const socialBucket = buckets.find(b => b.name === 'social');
        const bucketExists = !!socialBucket;
        console.log(`Social storage bucket ${bucketExists ? 'exists' : 'does not exist'}`);

        if (bucketExists) {
          // Now test if we can actually use the bucket by uploading a test file
          try {
            // Create a small test file
            const testBlob = new Blob(['test'], { type: 'text/plain' });
            const testFile = new File([testBlob], 'test.txt');
            const testPath = `test-${Date.now()}.txt`;

            console.log('Attempting to upload test file to social bucket...');
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('social')
              .upload(testPath, testFile, {
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) {
              console.error('Storage bucket permission test failed:', uploadError);
              // Try to get more information about the error
              if (uploadError.message) {
                console.error('Error message:', uploadError.message);
              }
              storageBucketExists = false;
            } else {
              console.log('Storage bucket upload test passed');

              // Now test if we can read the file
              const { data: downloadData, error: downloadError } = await supabase.storage
                .from('social')
                .download(uploadData?.path || testPath);

              if (downloadError) {
                console.error('Storage bucket download test failed:', downloadError);
                storageBucketExists = false;
              } else {
                console.log('Storage bucket download test passed');
                storageBucketExists = true;
              }

              // Clean up the test file
              try {
                await supabase.storage
                  .from('social')
                  .remove([uploadData?.path || testPath]);
                console.log('Test file removed successfully');
              } catch (removeError) {
                console.error('Error removing test file:', removeError);
                // Don't fail the test just because cleanup failed
              }
            }
          } catch (testError) {
            console.error('Error testing storage bucket permissions:', testError);
            storageBucketExists = false;
          }
        }
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
      storageBucketExists = false;
    }

    // Check stored procedures
    let storedProceduresExist = false;
    try {
      // Try multiple stored procedures to increase chances of finding one that exists
      const procedures = [
        { name: 'get_latest_messages_sent', params: { user_id_param: '00000000-0000-0000-0000-000000000000' } },
        { name: 'create_notifications_table', params: {} },
        { name: 'get_user_chat_groups', params: { user_id_param: '00000000-0000-0000-0000-000000000000' } },
        { name: 'send_chat_group_message', params: { p_group_id: '00000000-0000-0000-0000-000000000000', p_user_id: '00000000-0000-0000-0000-000000000000', p_content: 'test', p_is_sticker: false } }
      ];

      for (const proc of procedures) {
        try {
          const { data, error } = await supabase.rpc(proc.name, proc.params);

          if (!error || error.code !== '42883') { // function does not exist
            storedProceduresExist = true;
            console.log(`Stored procedure ${proc.name} exists`);
            break;
          }
        } catch (procError) {
          // Ignore individual procedure errors and continue checking
          console.log(`Procedure ${proc.name} check failed:`, procError);
        }
      }

      console.log(`Stored procedures ${storedProceduresExist ? 'exist' : 'do not exist'}`);
    } catch (error) {
      console.error('Error checking stored procedures:', error);
    }

    return {
      allTablesExist,
      storageBucketExists,
      storedProceduresExist,
      tableStatus,
      isFullySetup: allTablesExist && storageBucketExists && storedProceduresExist
    };
  } catch (error) {
    console.error('Error checking social features:', error);
    return {
      allTablesExist: false,
      storageBucketExists: false,
      storedProceduresExist: false,
      tableStatus: {},
      isFullySetup: false,
      error
    };
  }
};

/**
 * Creates a notification in the database
 */
export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'system',
  title: string,
  message: string,
  link?: string
) => {
  try {
    // Check if notifications table exists
    const { count, error: checkError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (checkError && checkError.code === '42P01') {
      console.error('Notifications table does not exist');
      return null;
    }

    // Create notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
};

/**
 * Ensures the notifications table exists
 */
export const ensureNotificationsTable = async () => {
  try {
    // Check if notifications table exists
    const { data, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (checkError && (checkError.code === '42P01' || checkError.message?.includes('does not exist'))) {
      console.log('Notifications table does not exist, creating it...');

      // Create notifications table
      const { error } = await supabase.rpc('create_notifications_table');

      if (error) {
        console.error('Error creating notifications table:', error);
        return false;
      }

      console.log('Notifications table created successfully');
      return true;
    }

    console.log('Notifications table exists');
    return true;
  } catch (error) {
    console.error('Error in ensureNotificationsTable:', error);
    return false;
  }
};

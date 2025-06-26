import { supabase } from './supabaseClient';
import { createBucketDirect } from './directStorageApi';

/**
 * Uploads a file to Supabase Storage, trying multiple buckets if necessary
 * @param {File|Blob} file - The file to upload
 * @param {string} path - The path within the bucket (should include user ID)
 * @param {Object} options - Upload options
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export const uploadFile = async (file, path, options = {}) => {
  // List of buckets to try, in order
  const buckets = ['media', 'chat', 'public'];
  let url = null;
  let lastError = null;

  // Try each bucket in sequence
  for (const bucket of buckets) {
    try {
      console.log(`Trying to upload to ${bucket} bucket`);

      // If this is the public bucket and we haven't created it yet, try to create it
      if (bucket === 'public') {
        try {
          // Try using RPC first
          try {
            await supabase.rpc('create_storage_bucket', {
              bucket_name: 'public',
              public_access: true
            });
            console.log('Created public bucket via RPC');
          } catch (rpcError) {
            console.log('RPC bucket creation failed:', rpcError);

            // Try direct API if RPC fails
            const serviceKey = localStorage.getItem('supabase_service_key');
            if (serviceKey) {
              const result = await createBucketDirect('public', true, serviceKey);
              if (result.success) {
                console.log('Created public bucket via direct API');
              } else {
                console.log('Direct API bucket creation failed:', result.error);
              }
            }
          }
        } catch (createError) {
          console.log('Error creating public bucket (might already exist):', createError);
        }
      }

      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options);

      if (error) {
        lastError = error;
        console.error(`Error uploading to ${bucket} bucket:`, error);

        // If the error is not "bucket not found", don't try other buckets
        if (error.message !== 'Bucket not found') {
          throw error;
        }

        // Otherwise continue to the next bucket
        continue;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      url = urlData.publicUrl;
      break; // Successfully uploaded, exit the loop
    } catch (error) {
      lastError = error;
      console.error(`Error in upload process for ${bucket} bucket:`, error);

      // If this is not a "bucket not found" error, don't try other buckets
      if (error.message && !error.message.includes('Bucket not found')) {
        break;
      }
    }
  }

  return { url, error: lastError };
};

/**
 * Creates a storage bucket if it doesn't exist
 * @param {string} bucketName - The name of the bucket to create
 * @param {boolean} publicAccess - Whether the bucket should be public
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const createBucket = async (bucketName, publicAccess = false) => {
  try {
    const { data, error } = await supabase.rpc('create_storage_bucket', {
      bucket_name: bucketName,
      public_access: publicAccess
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error creating bucket ${bucketName}:`, error);
    return { success: false, error };
  }
};

/**
 * Gets a list of all storage buckets
 * @returns {Promise<{buckets: Array, error: Error|null}>}
 */
export const listBuckets = async () => {
  try {
    // This requires admin privileges, so it might not work for regular users
    const { data, error } = await supabase.rpc('list_storage_buckets');

    if (error) throw error;

    return { buckets: data || [], error: null };
  } catch (error) {
    console.error('Error listing buckets:', error);
    return { buckets: [], error };
  }
};

/**
 * Deletes a file from storage
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting file ${path} from ${bucket}:`, error);
    return { success: false, error };
  }
};

export default {
  uploadFile,
  createBucket,
  listBuckets,
  deleteFile
};

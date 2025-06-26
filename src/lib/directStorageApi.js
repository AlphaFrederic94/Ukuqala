/**
 * Direct API helpers for Supabase Storage
 * These functions bypass the Supabase client and make direct API calls
 * This is useful for operations that require admin privileges
 */

import { supabase } from './supabaseClient';

/**
 * Create a storage bucket directly using the Supabase API
 * @param {string} bucketName - The name of the bucket to create
 * @param {boolean} isPublic - Whether the bucket should be public
 * @param {string} apiKey - The service role API key
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const createBucketDirect = async (bucketName, isPublic = true, apiKey) => {
  try {
    if (!apiKey) {
      // Try to get the API key from local storage
      apiKey = localStorage.getItem('supabase_service_key');
      
      if (!apiKey) {
        return {
          success: false,
          error: 'No API key provided. Please provide a service role API key.'
        };
      }
    }
    
    // Make a direct API call to create the bucket
    const response = await fetch(`${supabase.supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey
      },
      body: JSON.stringify({
        id: bucketName,
        name: bucketName,
        public: isPublic
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Failed to create bucket: ${response.status} ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    // Now create policies for the bucket
    await createBucketPolicies(bucketName, isPublic, apiKey);
    
    return {
      success: true,
      error: null,
      data
    };
  } catch (error) {
    console.error('Error in createBucketDirect:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Create policies for a bucket
 * @param {string} bucketName - The name of the bucket
 * @param {boolean} isPublic - Whether the bucket should be public
 * @param {string} apiKey - The service role API key
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const createBucketPolicies = async (bucketName, isPublic = true, apiKey) => {
  try {
    if (!apiKey) {
      apiKey = localStorage.getItem('supabase_service_key');
      
      if (!apiKey) {
        return {
          success: false,
          error: 'No API key provided. Please provide a service role API key.'
        };
      }
    }
    
    // Create policies for the bucket
    const policies = [
      // Policy to allow users to upload their own files
      {
        name: `Allow users to upload their own files to ${bucketName}`,
        definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        operation: 'INSERT',
        role: 'authenticated'
      },
      // Policy to allow users to update their own files
      {
        name: `Allow users to update their own files in ${bucketName}`,
        definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        operation: 'UPDATE',
        role: 'authenticated'
      },
      // Policy to allow users to delete their own files
      {
        name: `Allow users to delete their own files from ${bucketName}`,
        definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        operation: 'DELETE',
        role: 'authenticated'
      }
    ];
    
    // Add read policy based on public access
    if (isPublic) {
      policies.push({
        name: `Allow public read access to ${bucketName}`,
        definition: `(bucket_id = '${bucketName}')`,
        operation: 'SELECT',
        role: 'anon'
      });
    } else {
      policies.push({
        name: `Allow authenticated read access to ${bucketName}`,
        definition: `(bucket_id = '${bucketName}')`,
        operation: 'SELECT',
        role: 'authenticated'
      });
    }
    
    // Create each policy
    for (const policy of policies) {
      const response = await fetch(`${supabase.supabaseUrl}/storage/v1/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'apikey': apiKey
        },
        body: JSON.stringify({
          name: policy.name,
          definition: policy.definition,
          operation: policy.operation,
          role: policy.role
        })
      });
      
      if (!response.ok) {
        console.warn(`Failed to create policy ${policy.name}:`, await response.json());
        // Continue with other policies even if one fails
      }
    }
    
    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Error in createBucketPolicies:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * List all storage buckets
 * @param {string} apiKey - The service role API key
 * @returns {Promise<{success: boolean, error: string|null, buckets: Array}>}
 */
export const listBucketsDirect = async (apiKey) => {
  try {
    if (!apiKey) {
      apiKey = localStorage.getItem('supabase_service_key');
      
      if (!apiKey) {
        return {
          success: false,
          error: 'No API key provided. Please provide a service role API key.',
          buckets: []
        };
      }
    }
    
    const response = await fetch(`${supabase.supabaseUrl}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Failed to list buckets: ${response.status} ${response.statusText}`,
        buckets: []
      };
    }
    
    const buckets = await response.json();
    
    return {
      success: true,
      error: null,
      buckets
    };
  } catch (error) {
    console.error('Error in listBucketsDirect:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      buckets: []
    };
  }
};

export default {
  createBucketDirect,
  createBucketPolicies,
  listBucketsDirect
};

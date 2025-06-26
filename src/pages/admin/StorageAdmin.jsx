import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { createBucketDirect, listBucketsDirect } from '../../lib/directStorageApi';
import { Loader2, AlertCircle, CheckCircle, Database, FolderPlus, Trash2 } from 'lucide-react';

const StorageAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newBucketName, setNewBucketName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creatingBucket, setCreatingBucket] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch existing buckets
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get the service key from local storage
        const serviceKey = localStorage.getItem('supabase_service_key');

        if (serviceKey) {
          // Try to list buckets using our direct API helper
          const result = await listBucketsDirect(serviceKey);

          if (result.success) {
            setBuckets(result.buckets || []);
            return;
          } else {
            console.warn('Direct API bucket listing failed:', result.error);
            // Fall back to regular query
          }
        }

        // Try to list buckets using the REST API
        const { data, error } = await supabase.from('storage.buckets').select('*');

        if (error) {
          console.error('Error fetching buckets:', error);
          setError('Failed to fetch buckets. You may not have permission to view them.');
          setBuckets([]);
        } else {
          setBuckets(data || []);
        }
      } catch (err) {
        console.error('Error in fetchBuckets:', err);
        setError('An unexpected error occurred while fetching buckets.');
        setBuckets([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBuckets();
    }
  }, [user]);

  // Create a new bucket
  const createBucket = async (e) => {
    e.preventDefault();

    if (!newBucketName.trim()) {
      setError('Bucket name is required');
      return;
    }

    try {
      setCreatingBucket(true);
      setError(null);
      setSuccess(null);

      // First, try using the RPC function
      try {
        const { data, error } = await supabase.rpc('create_storage_bucket', {
          bucket_name: newBucketName,
          public_access: isPublic
        });

        if (error) throw error;

        setSuccess(`Bucket "${newBucketName}" created successfully via RPC!`);
        setNewBucketName('');

        // Refresh the bucket list
        const { data: bucketData } = await supabase.from('storage.buckets').select('*');
        setBuckets(bucketData || []);

        return;
      } catch (rpcError) {
        console.error('RPC method failed:', rpcError);
        // Continue to direct method
      }

      // If RPC fails, try direct SQL insertion
      try {
        const { data, error } = await supabase.rpc('admin_create_bucket', {
          name: newBucketName,
          public: isPublic
        });

        if (error) throw error;

        setSuccess(`Bucket "${newBucketName}" created successfully via admin function!`);
        setNewBucketName('');

        // Refresh the bucket list
        const { data: bucketData } = await supabase.from('storage.buckets').select('*');
        setBuckets(bucketData || []);

        return;
      } catch (adminError) {
        console.error('Admin method failed:', adminError);
        // Continue to direct method
      }

      // If all else fails, try direct REST API
      const { data, error } = await supabase
        .from('storage.buckets')
        .insert([
          { id: newBucketName, name: newBucketName, public: isPublic }
        ]);

      if (error) throw error;

      setSuccess(`Bucket "${newBucketName}" created successfully via direct API!`);
      setNewBucketName('');

      // Refresh the bucket list
      const { data: bucketData } = await supabase.from('storage.buckets').select('*');
      setBuckets(bucketData || []);
    } catch (err) {
      console.error('Error creating bucket:', err);
      setError(`Failed to create bucket: ${err.message || 'Unknown error'}`);
    } finally {
      setCreatingBucket(false);
    }
  };

  // Create default buckets
  const createDefaultBuckets = async () => {
    try {
      setCreatingBucket(true);
      setError(null);
      setSuccess(null);

      const defaultBuckets = ['media', 'chat', 'avatars', 'public'];
      let createdCount = 0;

      for (const bucketName of defaultBuckets) {
        try {
          // Try RPC method first
          const { error: rpcError } = await supabase.rpc('create_storage_bucket', {
            bucket_name: bucketName,
            public_access: true
          });

          if (!rpcError) {
            createdCount++;
            continue;
          }

          // Try admin method
          const { error: adminError } = await supabase.rpc('admin_create_bucket', {
            name: bucketName,
            public: true
          });

          if (!adminError) {
            createdCount++;
            continue;
          }

          // Try direct API
          const { error } = await supabase
            .from('storage.buckets')
            .insert([
              { id: bucketName, name: bucketName, public: true }
            ]);

          if (!error) {
            createdCount++;
          }
        } catch (bucketError) {
          console.error(`Error creating bucket ${bucketName}:`, bucketError);
        }
      }

      if (createdCount > 0) {
        setSuccess(`Created ${createdCount} default buckets successfully!`);

        // Refresh the bucket list
        const { data: bucketData } = await supabase.from('storage.buckets').select('*');
        setBuckets(bucketData || []);
      } else {
        setError('Failed to create any default buckets. Check console for details.');
      }
    } catch (err) {
      console.error('Error in createDefaultBuckets:', err);
      setError(`Failed to create default buckets: ${err.message || 'Unknown error'}`);
    } finally {
      setCreatingBucket(false);
    }
  };

  // Create a bucket directly using our helper
  const createBucketWithFetch = async (bucketName) => {
    try {
      setCreatingBucket(true);
      setError(null);
      setSuccess(null);

      // Get the service key from local storage (if available)
      const serviceKey = localStorage.getItem('supabase_service_key');

      if (!serviceKey) {
        setError('Service key not found. Please enter it in the field below.');
        return;
      }

      // Use our direct API helper
      const result = await createBucketDirect(bucketName, true, serviceKey);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create bucket');
      }

      setSuccess(`Bucket "${bucketName}" created successfully with direct API!`);

      // Refresh the bucket list using direct API
      const bucketResult = await listBucketsDirect(serviceKey);
      if (bucketResult.success) {
        setBuckets(bucketResult.buckets || []);
      } else {
        // Fallback to regular query
        const { data: bucketData } = await supabase.from('storage.buckets').select('*');
        setBuckets(bucketData || []);
      }
    } catch (err) {
      console.error('Error in createBucketWithFetch:', err);
      setError(`Failed to create bucket with direct API: ${err.message || 'Unknown error'}`);
    } finally {
      setCreatingBucket(false);
    }
  };

  // Save service key to local storage
  const saveServiceKey = (e) => {
    e.preventDefault();
    const key = e.target.serviceKey.value.trim();

    if (key) {
      localStorage.setItem('supabase_service_key', key);
      setSuccess('Service key saved to local storage!');
    } else {
      setError('Please enter a valid service key');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Storage Admin</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Bucket</h2>

          <form onSubmit={createBucket} className="space-y-4">
            <div>
              <label htmlFor="bucketName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bucket Name
              </label>
              <input
                type="text"
                id="bucketName"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., media"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Public Access
              </label>
            </div>

            <button
              type="submit"
              disabled={creatingBucket}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {creatingBucket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Bucket
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={createDefaultBuckets}
              disabled={creatingBucket}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {creatingBucket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create Default Buckets
                </>
              )}
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Direct API Access</h3>
            <form onSubmit={saveServiceKey} className="space-y-4">
              <div>
                <label htmlFor="serviceKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Role Key
                </label>
                <input
                  type="password"
                  id="serviceKey"
                  name="serviceKey"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter service role key"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Save Key
              </button>
            </form>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {['media', 'chat', 'avatars', 'public'].map(bucket => (
                <button
                  key={bucket}
                  onClick={() => createBucketWithFetch(bucket)}
                  disabled={creatingBucket}
                  className="flex justify-center items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Create "{bucket}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Buckets</h2>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : buckets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Public
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {buckets.map((bucket) => (
                    <tr key={bucket.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {bucket.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {bucket.public ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No buckets found or you don't have permission to view them.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageAdmin;

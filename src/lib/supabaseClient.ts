import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure the URL ends with no trailing slash
const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient(cleanSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'careai-auth-token',
    storage: {
      getItem: (key) => {
        try {
          const storedSession = localStorage.getItem(key);
          if (!storedSession) return null;
          return storedSession;
        } catch (error) {
          console.warn('Error retrieving session from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error storing session in localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing session from localStorage:', error);
        }
      },
    },
    redirectTo: window.location.origin + '/auth/callback'
  },
  global: {
    headers: {
      'x-application-name': 'CareAI',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    fetch: (url, options) => {
      // Add custom fetch logic for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (shorter)

      // Create a signal that combines the original signal (if any) with our timeout signal
      const signal = options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;

      return fetch(url, {
        ...options,
        signal,
        // Add retry and connection handling
        keepalive: true,
        cache: 'no-store'
      }).then(async (response) => {
        clearTimeout(timeoutId);

        // Handle failed requests with better logging
        if (!response.ok) {
          console.warn(`Supabase request failed: ${url} (${response.status})`);
          try {
            const errorData = await response.clone().json();
            console.warn('Error details:', errorData);
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        return response;
      }).catch(error => {
        clearTimeout(timeoutId);
        console.warn(`Supabase request error: ${url}`, error.message || error);

        // Throw a more informative error
        throw new Error(`Supabase request failed: ${error.message || 'Network error'}`);
      });
    }
  },
  // Add retryable options
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Don't log Supabase configuration

// Add health check function
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('health_check').select('count').single();
    return !error;
  } catch (err) {
    // Silently handle errors
    return false;
  }
};

const DEFAULT_AVATAR_URL = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

interface ProfileUpdates {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string | null;
  avatar_url?: string;
}

// Helper function to update profile
export const updateProfile = async (userId: string, updates: ProfileUpdates) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name || '',
        email: updates.email || '',
        phone: updates.phone || '',
        address: updates.address || '',
        date_of_birth: updates.date_of_birth || null,
        avatar_url: updates.avatar_url || DEFAULT_AVATAR_URL,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    // Silently handle errors
    throw error;
  }
};

// Helper function to update medical records
export const updateMedicalRecords = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('medical_records')
      .upsert({
        user_id: userId,
        blood_group: updates.blood_group || 'Not Set',
        height: updates.height || 0,
        current_weight: updates.weight || 0,
        target_weight: updates.target_weight,
        date_of_birth: updates.date_of_birth,
        gender: updates.gender || 'Not Set',
        activity_level: updates.activity_level || 'Not Set',
        allergies: updates.allergies || [],
        medications: updates.medications || [],
        health_conditions: updates.health_conditions || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    // Silently handle errors
    throw error;
  }
};

// Helper function to get profile and medical records
export const getProfileAndMedicalRecords = async (userId: string) => {
  try {
    const [profileResponse, medicalResponse] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', userId)
        .single()
    ]);

    // Handle profile response
    if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
      throw profileResponse.error;
    }

    // Handle medical records response
    if (medicalResponse.error) {
      if (medicalResponse.error.code !== 'PGRST116' && medicalResponse.error.code !== '406') {
        throw medicalResponse.error;
      }
    }

    return {
      profile: profileResponse.data ? {
        ...profileResponse.data,
        avatar_url: profileResponse.data.avatar_url || DEFAULT_AVATAR_URL
      } : null,
      medicalRecords: medicalResponse.data || null
    };
  } catch (error) {
    // Silently handle errors
    throw error;
  }
};

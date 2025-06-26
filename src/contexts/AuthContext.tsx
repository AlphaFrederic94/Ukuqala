import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { userService } from '../lib/userService';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    age?: string;
    blood_group?: string;
    [key: string]: any;
  };
}

const AuthContext = createContext({
  user: null as User | null,
  signIn: async (email: string, password: string) => ({ data: null, error: null }),
  signUp: async (email: string, password: string, fullName: string) => ({ user: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => {},
  resetPassword: async (email: string) => ({ data: null, error: null }),
  updatePassword: async (newPassword: string) => ({ data: null, error: null }),
  setupMFA: async () => ({ data: null, error: null }),
  verifyMFA: async (factorId: string | null, code: string) => ({ data: null, error: null }),
  isMFAEnabled: false,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If no user is logged in, we'll just keep user as null
  // This will redirect to login page in protected routes

  // Check if MFA is enabled for the current user
  useEffect(() => {
    const checkMFA = async () => {
      if (user) {
        try {
          // Check if the user has any enrolled factors
          const { data, error } = await supabase.auth.mfa.listFactors();
          if (!error && data && data.totp && data.totp.length > 0) {
            setIsMFAEnabled(true);
          } else {
            setIsMFAEnabled(false);
          }
        } catch (error) {
          console.error('Error checking MFA status:', error);
          setIsMFAEnabled(false);
        }
      }
    };

    checkMFA();
  }, [user]);

  const value = {
    user,
    loading,
    isMFAEnabled,
    signIn: async (email, password) => {
      try {
        console.log('Attempting to sign in with email:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error.message);
          throw error;
        }

        console.log('Login successful, user:', data.user?.id);
        return data;
      } catch (error) {
        console.error('Error during sign in:', error);
        throw error;
      }
    },
    signUp: async (email, password, fullName) => {
      try {
        console.log('Attempting to sign up with email:', email);

        // We'll handle the 'user already exists' error from the signUp call
        // since we don't have access to the admin API in the client

        // Register the user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          console.error('Registration error:', error.message);
          throw error;
        }

        console.log('Registration successful, user:', data.user?.id);

        // Initialize user data if registration was successful
        try {
          if (data.user) {
            console.log('Initializing user data for:', data.user.id);
            await userService.initializeNewUser(data.user.id);
          }
        } catch (initError) {
          console.error('Error initializing user data:', initError);
          // Continue with registration even if initialization fails
        }

        return { user: data.user, error: null };
      } catch (error) {
        console.error('Error during sign up:', error);
        return { user: null, error };
      }
    },
    signInWithGoogle: async () => {
      const redirectUrl = import.meta.env.VITE_ENVIRONMENT === 'production'
        ? 'https://ukuqala-careai.onrender.com/auth/callback'
        : window.location.origin + '/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      return data;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    resetPassword: async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return { data, error: null };
    },
    updatePassword: async (newPassword) => {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { data, error: null };
    },
    setupMFA: async () => {
      try {
        console.log('Starting MFA enrollment');
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        });

        if (error) {
          console.error('MFA enrollment error:', error);
          throw error;
        }

        if (!data || !data.id) {
          console.error('MFA enrollment missing factor ID:', data);
          throw new Error('Failed to get MFA factor ID');
        }

        console.log('MFA enrollment successful. Factor ID:', data.id);
        return { data, error: null };
      } catch (error) {
        console.error('Error setting up MFA:', error);
        return { data: null, error };
      }
    },
    verifyMFA: async (factorId, code) => {
      try {
        if (!factorId) {
          // If no factorId is provided, try to find one from enrolled factors
          const { data: factorsData } = await supabase.auth.mfa.listFactors();

          if (factorsData?.totp && factorsData.totp.length > 0) {
            // Use the first enrolled factor
            factorId = factorsData.totp[0].id;
          } else if (factorsData?.enrollments && factorsData.enrollments.length > 0) {
            // Use the first enrollment in progress
            factorId = factorsData.enrollments[0].id;
          } else {
            throw new Error('No MFA factors found. Please restart the setup process.');
          }
        }

        console.log('Using factor ID for verification:', factorId);

        // Challenge the factor
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factorId,
        });

        if (challengeError) {
          console.error('Challenge error:', challengeError);
          throw challengeError;
        }

        console.log('Challenge created:', challengeData);

        // Verify the challenge
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: factorId,
          challengeId: challengeData.id,
          code,
        });

        if (error) {
          console.error('Verification error:', error);
          throw error;
        }

        console.log('Verification successful:', data);
        setIsMFAEnabled(true);
        return { data, error: null };
      } catch (error) {
        console.error('Error verifying MFA:', error);
        return { data: null, error };
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

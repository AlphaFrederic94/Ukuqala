import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();

  // Function to create a new user profile
  const createUserProfile = async (authUser: any) => {
    if (!authUser?.id || !authUser?.email) {
      console.error('Cannot create profile: Missing auth user data');
      return;
    }

    try {
      console.log('Creating new user profile for:', authUser.id);

      // Create a new profile with basic information
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created successfully:', data);
        setUser(data);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  useEffect(() => {
    console.log('UserContext useEffect triggered, authUser:', authUser);

    if (!authUser?.id) {
      console.log('No auth user ID, setting loading to false');
      setLoading(false);
      return;
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        console.log('Fetching user profile for ID:', authUser.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);

          // If the error is 'not found', create a new profile
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating a new one');
            await createUserProfile(authUser);
          }
        } else if (data) {
          console.log('User profile loaded:', data);
          setUser(data);
        } else {
          console.log('No user profile found, creating a new one');
          await createUserProfile(authUser);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    const channel = supabase
      .channel('user_profile')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${authUser.id}`
        },
        async (payload) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!error && data) {
            setUser(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

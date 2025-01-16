import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  checkAdmin: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,

  signIn: async (email: string, password: string, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('No user data');

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User role not found');

      set({ 
        user: {
          id: data.user.id,
          email: data.user.email!
        },
        isAdmin: userData.role === 'admin' 
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isAdmin: false });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  checkAdmin: async () => {
    try {
      set({ isLoading: true });
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If there's an auth error or no user, just reset the state
      if (authError || !user) {
        set({ user: null, isAdmin: false, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // If there's an error getting the user role, reset the state
      if (error) {
        set({ user: null, isAdmin: false, isLoading: false });
        return;
      }

      set({ 
        user: {
          id: user.id,
          email: user.email!
        },
        isAdmin: data?.role === 'admin',
        isLoading: false 
      });
    } catch (error) {
      // Reset state on any error
      set({ user: null, isAdmin: false, isLoading: false });
    }
  },
}));
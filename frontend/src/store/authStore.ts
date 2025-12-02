import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;

  // Auth methods
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ user: User | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<{ error: any | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });

      // Return the data so caller can check if email confirmation is needed
      return data;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    } catch (error) {
      set({
        user: null,
        session: null,
        loading: false,
      });
    }
  },

  checkEmailExists: async (email: string) => {
    try {
      // Call backend API to check if email exists
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7860";
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.exists) {
        // Email exists in database
        return { error: null };
      } else {
        // Email doesn't exist
        return { error: "not_found" };
      }
    } catch (error) {
      // If API call fails, return error
      return { error };
    }
  },
}));

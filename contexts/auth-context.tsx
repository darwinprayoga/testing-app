"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";
import { cloudUtils } from "@/utils/storage-utils";
import { useStorage } from "./storage-context";

// Define the shape of the authentication context
type AuthContextType = {
  thisUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isCloud: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

// Create the AuthContext with undefined as default
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// AuthProvider component to wrap the app with authentication logic
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [thisUser, setThisUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);

  const client = supabase;
  const { toast } = useToast();
  const { setStorageType } = useStorage();

  // Check if Supabase credentials are properly configured
  const isSupabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Effect to handle authentication state and session initialization
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn(
        "Supabase is not configured. Auth features will be disabled.",
      );
      setIsLoading(false);
      return;
    }

    const getSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await client.auth.getSession();
        if (error) throw error;

        setSession(session);
        setThisUser(session?.user ?? null);
        localStorage.setItem("uid", `${session?.user.id}`);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setThisUser(session?.user ?? null);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [client, isSupabaseConfigured]);

  // Effect to check for cloud features (e.g., premium users)
  useEffect(() => {
    if (session && thisUser) {
      const init = async () => {
        const data = await cloudUtils.get("userProfile", thisUser.id);
        if (data[0].datas.hasPremium) {
          setIsCloud(true);
        }
      };
      init();
    }
  }, [session, thisUser]);

  // Sign out user
  const signOut = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Auth Error",
        description:
          "Authentication is not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      location.reload(); // Refresh the app after sign-out
    } catch (error: any) {
      throw error;
    }
  };

  // Sign in with Google using popup (not redirect)
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      toast({
        title: "Auth Error",
        description:
          "Authentication is not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.href}/auth/callback`,
        },
      });

      setStorageType("localStorage");

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        thisUser,
        session,
        isLoading,
        isCloud,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

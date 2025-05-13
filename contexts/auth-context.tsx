"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "./language-context";
import { supabase } from "@/utils/supabase/client";

type AuthContextType = {
  thisUser: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

// Export the AuthContext so it can be imported directly
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [thisUser, setThisUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = supabase;
  const { toast } = useToast();
  const { t } = useLanguage();

  // Check if Supabase is properly coŹfigured
  const isSupabaseConfigured =
    !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== ""
    ) &&
    !!(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ""
    );

  useEffect(() => {
    // auth provider
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
        if (error) {
          throw error;
        }
        setSession(session);
        setThisUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setThisUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, isSupabaseConfigured]);

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
      if (error) {
        throw error;
      }
      location.reload();
    } catch (error: any) {
      toast({
        title: t("signOutFailed"),
        description: error.message || t("signOutFailedDesc"),
        variant: "destructive",
      });
      throw error;
    }
  };

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
      // Use popup for Google sign-in instead of redirect
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.href}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: t("signInFailed"),
        description: error.message || t("signInFailedDesc"),
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        thisUser,
        session,
        isLoading,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

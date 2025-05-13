import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // Get the environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate URL before creating client - check for empty strings too
  if (
    !supabaseUrl ||
    supabaseUrl === "" ||
    !supabaseAnonKey ||
    supabaseAnonKey === ""
  ) {
    console.error(
      "Supabase URL or anon key is missing. Please check your environment variables.",
    );
    // Return a dummy client that won't throw errors when methods are called
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        exchangeCodeForSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
      },
    };
  }

  try {
    const { createServerClient } = require("@supabase/ssr");
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });
  } catch (error) {
    console.error("Error creating Supabase server client:", error);
    // Return a dummy client as fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        exchangeCodeForSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
      },
    };
  }
}

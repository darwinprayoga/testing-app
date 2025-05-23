"use client";

import { useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { sanitizedUsername } from "@/components/profile/profile-tab";

export function AutoRegister() {
  useEffect(() => {
    const generateUniqueUsername = async (base: string, userId: string) => {
      let baseUsername = sanitizedUsername(base);
      let username = baseUsername;
      let suffix = 1;

      while (true) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username);

        const isTaken = data?.some((user: any) => user.uid !== userId);

        if (!isTaken) break;

        username = `${baseUsername}${suffix}`;
        suffix++;
        console.error("Error query existing username:", error);
      }

      return username;
    };

    const registerUserIfNeeded = async (user: any) => {
      const { data: existingUser, error: selectError } = await supabase
        .from("users")
        .select("uid")
        .eq("uid", user.id)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Error checking existing user:", selectError.message);
        return;
      }

      if (!existingUser) {
        const uid = user.id;
        const email = user.email ?? "unknown@example.com";
        const rawName = user.user_metadata?.full_name ?? email.split("@")[0];
        const image = user.user_metadata?.avatar_url ?? "";

        const username = await generateUniqueUsername(rawName, uid);

        const { error: insertUserError } = await supabase.from("users").upsert({
          uid,
          username,
          datas: {
            uid,
            email,
            username,
            image,
            has_premium: false,
          },
          is_drawer_open: false,
          has_premium: false,
          storage_type: "localStorage",
        });

        if (insertUserError) {
          console.error("Error inserting user:", insertUserError.message);
        }

        const { error: insertSettingsError } = await supabase
          .from("user_settings")
          .insert({
            uid,
            app_language: navigator.language.split("-")[0],
            app_font: {
              name: "Source Sans Pro",
              value: "'Source Sans Pro', sans-serif",
            },
            current_theme: {
              name: "paper",
              main: "#4b5563",
              card: "#f9fafb",
              text: "#111827",
              subtext: "#6b7280",
              background: "#ffffff",
              accent: "#4b5563",
              border: "#e5e7eb",
              main_hover: "#374151",
            },
            clipboard_text: "Welcome to the premium!",
            active_tab: "clipboard",
            todo_active_tab: "active",
            settings_drawer_open: false,
            share_drawer_open: false,
            info_drawer_open: false,
          });

        if (insertSettingsError) {
          console.error(
            "Error inserting settings:",
            insertSettingsError.message,
          );
        }

        // Reload after registration
        location.reload();
      }
    };

    const checkAndRegister = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return;

      await registerUserIfNeeded(user);
    };

    checkAndRegister();
  }, []);

  return null;
}

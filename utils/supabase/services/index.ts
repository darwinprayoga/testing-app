import { supabase } from "../client";
import type { User } from "@/components/profile/types";
import type { TodoItem } from "@/types/todo";
import type { ClipboardItem } from "@/types/clipboard";
import type { ActivityRecord } from "@/contexts/activity-context";

// User service
export const userService = {
  // Create or update a user
  upsertUser: async (user: User) => {
    const { data, error } = await supabase
      .from("users")
      .upsert({
        username: user.username,
        email: user.email,
        image: user.image,
        is_logged_in: user.isLoggedIn,
        has_premium: user.hasPremium
      })
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update user login status
  updateLoginStatus: async (username: string, isLoggedIn: boolean) => {
    const { data, error } = await supabase
      .from("users")
      .update({ is_logged_in: isLoggedIn })
      .eq("username", username)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update user premium status
  updatePremiumStatus: async (username: string, hasPremium: boolean) => {
    const { data, error } = await supabase
      .from("users")
      .update({ has_premium: hasPremium })
      .eq("username", username)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
};

// Todo service
export const todoService = {
  // Get all todos for a user
  getTodos: async (username: string) => {
    const { data, error } = await supabase
      .from("todo")
      .select("*")
      .eq("username", username);
    
    if (error) throw error;
    return data;
  },

  // Add a new todo
  addTodo: async (todo: TodoItem) => {
    const { data, error } = await supabase
      .from("todo")
      .insert({
        id: todo.id,
        username: todo.username,
        text: todo.text,
        description: todo.description,
        completed: todo.completed,
        archived: todo.archived,
        priority: todo.priority,
        created_at: todo.createdAt
      })
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update a todo
  updateTodo: async (todo: TodoItem) => {
    const { data, error } = await supabase
      .from("todo")
      .update({
        text: todo.text,
        description: todo.description,
        completed: todo.completed,
        archived: todo.archived,
        priority: todo.priority,
        created_at: todo.createdAt
      })
      .eq("id", todo.id)
      .eq("username", todo.username)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete a todo
  deleteTodo: async (id: string, username: string) => {
    const { error } = await supabase
      .from("todo")
      .delete()
      .eq("id", id)
      .eq("username", username);
    
    if (error) throw error;
    return true;
  },
};

// Clipboard service
export const clipboardService = {
  // Get clipboard history for a user
  getClipboardHistory: async (username: string) => {
    const { data, error } = await supabase
      .from("clipboard_item")
      .select("*")
      .eq("username", username)
      .order("timestamp", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add an item to clipboard history
  addClipboardItem: async (item: ClipboardItem & { username: string }) => {
    const { data, error } = await supabase
      .from("clipboard_item")
      .insert({
        id: item.id,
        username: item.username,
        content: item.content,
        timestamp: item.timestamp,
        type: item.type
      })
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete a clipboard item
  deleteClipboardItem: async (id: string, username: string) => {
    const { error } = await supabase
      .from("clipboard_item")
      .delete()
      .eq("id", id)
      .eq("username", username);
    
    if (error) throw error;
    return true;
  },
};

// Activity service
export const activityService = {
  // Record a user activity
  recordActivity: async (activity: ActivityRecord & { username: string }) => {
    const { data, error } = await supabase
      .from("user_activity")
      .insert({
        username: activity.username,
        type: activity.type,
        timestamp: activity.timestamp,
        details: activity.details
      })
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Get recent activities for a user
  getRecentActivities: async (username: string, limit: number = 100) => {
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("username", username)
      .order("timestamp", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Get the last activity of a specific type
  getLastActivity: async (username: string, type: string) => {
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("username", username)
      .eq("type", type)
      .order("timestamp", { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data?.[0];
  },

  // Clear all activities for a user
  clearAllActivities: async (username: string) => {
    const { error } = await supabase
      .from("user_activity")
      .delete()
      .eq("username", username);
    
    if (error) throw error;
    return true;
  },
};

// App settings service
export const appSettingsService = {
  // Get app settings for a user
  getAppSettings: async (username: string) => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*,font_name(*),font_size_name(*),theme_name(*)")
      .eq("username", username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows returned
    return data;
  },

  // Save app settings for a user
  saveAppSettings: async (username: string, settings: any) => {
    const { data, error } = await supabase
      .from("app_settings")
      .upsert({
        username,
        language: settings.language,
        pwa_drawer_open: settings.pwaDrawerOpen,
        share_drawer_open: settings.shareDrawerOpen,
        theme_mode: settings.themeMode,
        settings_search_query: settings.settingsSearchQuery,
        todo_is_adding: settings.todoIsAdding,
        font_name: settings.fontName,
        font_size_name: settings.fontSizeName,
        theme_name: settings.themeName
      })
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Get favorite themes for a user
  getFavoriteThemes: async (username: string) => {
    const { data, error } = await supabase
      .from("favorite_theme")
      .select("theme_name")
      .eq("username", username);
    
    if (error) throw error;
    return data.map(item => item.theme_name);
  },
  
  // Toggle a favorite theme
  toggleFavoriteTheme: async (username: string, themeName: string, isFavorite: boolean) => {
    if (isFavorite) {
      // Add to favorites
      const { data, error } = await supabase
        .from("favorite_theme")
        .insert({ username, theme_name: themeName })
        .select();
      
      if (error) throw error;
      return data?.[0];
    } else {
      // Remove from favorites
      const { error } = await supabase
        .from("favorite_theme")
        .delete()
        .eq("username", username)
        .eq("theme_name", themeName);
      
      if (error) throw error;
      return true;
    }
  },
  
  // Get favorite fonts for a user
  getFavoriteFonts: async (username: string) => {
    const { data, error } = await supabase
      .from("favorite_font")
      .select("font_name")
      .eq("username", username);
    
    if (error) throw error;
    return data.map(item => item.font_name);
  },
  
  // Toggle a favorite font
  toggleFavoriteFont: async (username: string, fontName: string, isFavorite: boolean) => {
    if (isFavorite) {
      // Add to favorites
      const { data, error } = await supabase
        .from("favorite_font")
        .insert({ username, font_name: fontName })
        .select();
      
      if (error) throw error;
      return data?.[0];
    } else {
      // Remove from favorites
      const { error } = await supabase
        .from("favorite_font")
        .delete()
        .eq("username", username)
        .eq("font_name", fontName);
      
      if (error) throw error;
      return true;
    }
  },
};

// Export all services
export { supabase };

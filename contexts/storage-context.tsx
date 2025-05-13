"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

export type StorageType = "cookies" | "localStorage" | "cloud";

interface StorageContextType {
  storageType: StorageType;
  setStorageType: (type: StorageType) => void;
  getItem: (key: string) => Promise<any>;
  setItem: (key: string, value: any) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isStorageReady: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

// ---------------------------------------------------------
// Utils
// ---------------------------------------------------------

const PRESERVED_KEYS = ["dataStoragePreference", "dataStorageExpires", "theme"];

const storageJSON = {
  encode: (value: any) => encodeURIComponent(JSON.stringify(value)),
  decode: (str: string) => {
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch {
      return null;
    }
  },
};

const cookieUtils = {
  set: (name: string, value: any, days = 3) => {
    const encoded = storageJSON.encode(value);
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encoded};expires=${expires};path=/`;
  },
  get: (name: string) => {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.split("=")[1];
    return raw ? storageJSON.decode(raw) : null;
  },
  remove: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  },
  getAll: () =>
    Object.fromEntries(
      document.cookie
        .split("; ")
        .map((c) => c.split("="))
        .filter(([k]) => k)
        .map(([k, v]) => [k, storageJSON.decode(v)]),
    ),
};

export const localUtils = {
  set: (key: string, value: any) => {
    const encoded = storageJSON.encode(value);
    localStorage.setItem(key, encoded);
  },
  get: (key: string) => {
    const raw = localStorage.getItem(key);
    return raw ? storageJSON.decode(raw) : null;
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
  getAll: () =>
    Object.fromEntries(
      Object.keys(localStorage).map((k) => [
        k,
        storageJSON.decode(localStorage.getItem(k) ?? ""),
      ]),
    ),
};

const cloudUtils = {
  get: async (key: string) => {
    // Special handling for different data types
    if (key === 'todos') {
      // Fetch todos from the todo table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('todo')
        .select('*')
        .eq('username', username);
      
      if (error) {
        console.error('Todos fetch error:', error);
        return null;
      }
      
      // Transform from database schema to app schema
      const transformed = data.map(item => ({
        id: item.id,
        text: item.text || '',
        description: item.description || '',
        completed: item.completed || false,
        archived: item.archived || false,
        priority: item.priority || '-',
        createdAt: item.created_at || Date.now()
      }));
      
      return storageJSON.encode(transformed);
    } 
    else if (key === 'userProfile') {
      // Fetch user profile from users table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('User profile fetch error:', error);
        return null;
      }
      
      const profile = {
        username: data.username,
        email: data.email,
        image: data.image,
        isLoggedIn: data.is_logged_in,
        hasPremium: data.has_premium
      };
      
      return storageJSON.encode(profile);
    }
    else if (key === 'clipboardHistory') {
      // Fetch clipboard history from clipboard_item table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('clipboard_item')
        .select('*')
        .eq('username', username)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Clipboard history fetch error:', error);
        return null;
      }
      
      return storageJSON.encode(data);
    }
    else if (key === 'appFont') {
      // Get font from app_font table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('app_settings')
        .select('font_name(*)')
        .eq('username', username)
        .single();
      
      if (error || !data?.font_name) {
        console.error('Font fetch error:', error);
        return null;
      }
      
      const font = {
        name: data.font_name.name,
        value: data.font_name.css_value
      };
      
      return storageJSON.encode(font);
    }
    else if (key === 'appFontSize') {
      // Get font size from font_size table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('app_settings')
        .select('font_size_name(*)')
        .eq('username', username)
        .single();
      
      if (error || !data?.font_size_name) {
        console.error('Font size fetch error:', error);
        return null;
      }
      
      const fontSize = {
        name: data.font_size_name.name,
        value: data.font_size_name.tailwind_value,
        size: data.font_size_name.px_size
      };
      
      return storageJSON.encode(fontSize);
    }
    else if (key === 'currentTheme') {
      // Get theme from theme table
      const username = localUtils.get('currentUsername') || 'guest';
      const { data, error } = await supabase
        .from('app_settings')
        .select('theme_name(*)')
        .eq('username', username)
        .single();
      
      if (error || !data?.theme_name) {
        console.error('Theme fetch error:', error);
        return null;
      }
      
      return storageJSON.encode(data.theme_name);
    }
    else {
      // Generic handling for other settings
      const username = localUtils.get('currentUsername') || 'guest';
      
      // First check in app_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('username', username)
        .single();
      
      if (!settingsError && settingsData && key in settingsData) {
        return storageJSON.encode(settingsData[key]);
      }
      
      // Then check in user_activity table for activity data
      if (key === 'userActivities') {
        const { data, error } = await supabase
          .from('user_activity')
          .select('*')
          .eq('username', username)
          .order('timestamp', { ascending: false });
        
        if (!error && data) {
          // Transform from database schema to app schema
          const activities = data.map(item => ({
            type: item.type,
            timestamp: item.timestamp,
            details: item.details
          }));
          
          return storageJSON.encode(activities);
        }
      }
      
      return null;
    }
  },
  set: async (key: string, value: string) => {
    const username = localUtils.get('currentUsername') || 'guest';
    const decodedValue = storageJSON.decode(value);
    
    if (key === 'todos' && Array.isArray(decodedValue)) {
      // Save todos to the todo table
      const batch = decodedValue.map(todo => ({
        id: todo.id,
        username: username,
        text: todo.text,
        description: todo.description,
        completed: todo.completed,
        archived: todo.archived,
        priority: todo.priority,
        created_at: todo.createdAt
      }));
      
      // Clear existing todos first
      await supabase
        .from('todo')
        .delete()
        .eq('username', username);
      
      // Insert new todos
      if (batch.length > 0) {
        const { error } = await supabase
          .from('todo')
          .insert(batch);
        
        if (error) console.error('Todos save error:', error);
      }
    }
    else if (key === 'userProfile' && typeof decodedValue === 'object') {
      // Save user profile to users table
      const { error } = await supabase
        .from('users')
        .upsert({
          username: decodedValue.username || username,
          email: decodedValue.email,
          image: decodedValue.image,
          is_logged_in: decodedValue.isLoggedIn,
          has_premium: decodedValue.hasPremium
        });
      
      if (error) console.error('User profile save error:', error);
      
      // Update currentUsername in localStorage if username changed
      if (decodedValue.username !== username) {
        localUtils.set('currentUsername', decodedValue.username);
      }
    }
    else if (key === 'clipboardHistory' && Array.isArray(decodedValue)) {
      // Save clipboard history to clipboard_item table
      const batch = decodedValue.map(item => ({
        id: item.id,
        username: username,
        content: item.content,
        timestamp: item.timestamp,
        type: item.type
      }));
      
      // Clear existing clipboard items first
      await supabase
        .from('clipboard_item')
        .delete()
        .eq('username', username);
      
      // Insert new clipboard items
      if (batch.length > 0) {
        const { error } = await supabase
          .from('clipboard_item')
          .insert(batch);
        
        if (error) console.error('Clipboard history save error:', error);
      }
    }
    else if (key === 'userActivities' && Array.isArray(decodedValue)) {
      // Save user activities to user_activity table
      const batch = decodedValue.map(activity => ({
        username: username,
        type: activity.type,
        timestamp: activity.timestamp,
        details: activity.details
      }));
      
      // Clear existing activities first
      await supabase
        .from('user_activity')
        .delete()
        .eq('username', username);
      
      // Insert new activities
      if (batch.length > 0) {
        const { error } = await supabase
          .from('user_activity')
          .insert(batch);
        
        if (error) console.error('User activities save error:', error);
      }
    }
    else if (key === 'appFont' && typeof decodedValue === 'object') {
      // Check if font exists in app_font table
      const { data: fontData, error: fontError } = await supabase
        .from('app_font')
        .select('*')
        .eq('name', decodedValue.name)
        .single();
      
      // If font doesn't exist, create it
      if (fontError && fontError.code === 'PGRST116') {
        await supabase
          .from('app_font')
          .insert({
            name: decodedValue.name,
            css_value: decodedValue.value
          });
      }
      
      // Update app_settings with the font
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          username: username,
          font_name: decodedValue.name
        });
      
      if (error) console.error('Font save error:', error);
    }
    else if (key === 'appFontSize' && typeof decodedValue === 'object') {
      // Check if font size exists in font_size table
      const { data: sizeData, error: sizeError } = await supabase
        .from('font_size')
        .select('*')
        .eq('name', decodedValue.name)
        .single();
      
      // If font size doesn't exist, create it
      if (sizeError && sizeError.code === 'PGRST116') {
        await supabase
          .from('font_size')
          .insert({
            name: decodedValue.name,
            tailwind_value: decodedValue.value,
            px_size: decodedValue.size
          });
      }
      
      // Update app_settings with the font size
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          username: username,
          font_size_name: decodedValue.name
        });
      
      if (error) console.error('Font size save error:', error);
    }
    else if (key === 'currentTheme' && typeof decodedValue === 'object') {
      // Check if theme exists in theme table
      const { data: themeData, error: themeError } = await supabase
        .from('theme')
        .select('*')
        .eq('name', decodedValue.name)
        .single();
      
      // If theme doesn't exist, create it
      if (themeError && themeError.code === 'PGRST116' && decodedValue.isCustom) {
        await supabase
          .from('theme')
          .insert({
            name: decodedValue.name,
            background: decodedValue.background,
            main: decodedValue.main,
            main_hover: decodedValue.mainHover,
            text: decodedValue.text,
            subtext: decodedValue.subtext,
            border: decodedValue.border,
            card: decodedValue.card,
            accent: decodedValue.accent,
            is_custom: true
          });
      }
      
      // Update app_settings with the theme
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          username: username,
          theme_name: decodedValue.name
        });
      
      if (error) console.error('Theme save error:', error);
    }
    else if (key === 'favorites' && Array.isArray(decodedValue)) {
      // Clear existing favorites
      await supabase
        .from('favorite_theme')
        .delete()
        .eq('username', username);
      
      // Add new favorites
      const batch = decodedValue.map(themeName => ({
        username: username,
        theme_name: themeName
      }));
      
      if (batch.length > 0) {
        const { error } = await supabase
          .from('favorite_theme')
          .insert(batch);
        
        if (error) console.error('Favorites save error:', error);
      }
    }
    else if (key === 'favoriteFonts' && Array.isArray(decodedValue)) {
      // Clear existing favorite fonts
      await supabase
        .from('favorite_font')
        .delete()
        .eq('username', username);
      
      // Add new favorite fonts
      const batch = decodedValue.map(fontName => ({
        username: username,
        font_name: fontName
      }));
      
      if (batch.length > 0) {
        const { error } = await supabase
          .from('favorite_font')
          .insert(batch);
        
        if (error) console.error('Favorite fonts save error:', error);
      }
    }
    else {
      // For other settings, save to app_settings
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          username: username,
          [key]: decodedValue
        });
      
      if (error) console.error(`Setting save error for ${key}:`, error);
    }
  },
  remove: async (key: string) => {
    const username = localUtils.get('currentUsername') || 'guest';
    
    if (key === 'todos') {
      const { error } = await supabase
        .from('todo')
        .delete()
        .eq('username', username);
      
      if (error) console.error('Todos remove error:', error);
    }
    else if (key === 'clipboardHistory') {
      const { error } = await supabase
        .from('clipboard_item')
        .delete()
        .eq('username', username);
      
      if (error) console.error('Clipboard history remove error:', error);
    }
    else if (key === 'userActivities') {
      const { error } = await supabase
        .from('user_activity')
        .delete()
        .eq('username', username);
      
      if (error) console.error('User activities remove error:', error);
    }
    else {
      // For other settings, update app_settings with null value
      const { error } = await supabase
        .from('app_settings')
        .update({ [key]: null })
        .eq('username', username);
      
      if (error) console.error(`Setting remove error for ${key}:`, error);
    }
  },
  clearAll: async () => {
    const username = localUtils.get('currentUsername') || 'guest';
    
    // Clear user data from all tables except preserved keys
    const tables = ['todo', 'clipboard_item', 'user_activity', 'favorite_theme', 'favorite_font'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('username', username);
      
      if (error) console.error(`Clear error for ${table}:`, error);
    }
    
    // Reset app_settings except for preserved keys
    const { error } = await supabase
      .from('app_settings')
      .update({
        language: 'en',
        pwa_drawer_open: false,
        share_drawer_open: false,
        settings_search_query: null,
        todo_is_adding: false
      })
      .eq('username', username);
    
    if (error) console.error('App settings reset error:', error);
  },
  getAll: async () => {
    const username = localUtils.get('currentUsername') || 'guest';
    const result: Record<string, any> = {};
    
    // Get app settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*,font_name(*),font_size_name(*),theme_name(*)')
      .eq('username', username)
      .single();
    
    if (!settingsError && settings) {
      // Extract settings
      for (const [key, value] of Object.entries(settings)) {
        if (key !== 'username' && key !== 'id' && value !== null) {
          result[key] = value;
        }
      }
      
      // Transform special fields
      if (settings.font_name) {
        result.appFont = {
          name: settings.font_name.name,
          value: settings.font_name.css_value
        };
      }
      
      if (settings.font_size_name) {
        result.appFontSize = {
          name: settings.font_size_name.name,
          value: settings.font_size_name.tailwind_value,
          size: settings.font_size_name.px_size
        };
      }
      
      if (settings.theme_name) {
        result.currentTheme = settings.theme_name;
      }
    }
    
    // Get favorites
    const { data: favThemes, error: favThemesError } = await supabase
      .from('favorite_theme')
      .select('theme_name')
      .eq('username', username);
    
    if (!favThemesError && favThemes) {
      result.favorites = favThemes.map(item => item.theme_name);
    }
    
    // Get favorite fonts
    const { data: favFonts, error: favFontsError } = await supabase
      .from('favorite_font')
      .select('font_name')
      .eq('username', username);
    
    if (!favFontsError && favFonts) {
      result.favoriteFonts = favFonts.map(item => item.font_name);
    }
    
    // Get todos
    const { data: todos, error: todosError } = await supabase
      .from('todo')
      .select('*')
      .eq('username', username);
    
    if (!todosError && todos) {
      result.todos = todos.map(todo => ({
        id: todo.id,
        text: todo.text || '',
        description: todo.description || '',
        completed: todo.completed || false,
        archived: todo.archived || false,
        priority: todo.priority || '-',
        createdAt: todo.created_at || Date.now()
      }));
    }
    
    // Get clipboard history
    const { data: clipboard, error: clipboardError } = await supabase
      .from('clipboard_item')
      .select('*')
      .eq('username', username)
      .order('timestamp', { ascending: false });
    
    if (!clipboardError && clipboard) {
      result.clipboardHistory = clipboard;
    }
    
    // Get user activities
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('username', username)
      .order('timestamp', { ascending: false });
    
    if (!activitiesError && activities) {
      result.userActivities = activities.map(activity => ({
        type: activity.type,
        timestamp: activity.timestamp,
        details: activity.details
      }));
    }
    
    return result;
  },
};

// ---------------------------------------------------------
// Provider
// ---------------------------------------------------------

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storageType, setStorageType] = useState<StorageType>("cookies");
  const [isStorageReady, setIsStorageReady] = useState(false);
  const { toast } = useToast();
  const prevTypeRef = useRef<StorageType | null>(null);

  // Init
  useEffect(() => {
    try {
      const saved = localUtils.get("dataStoragePreference") as StorageType;
      const expiresAt = localUtils.get("dataStorageExpires");

      if (["cookies", "localStorage", "cloud"].includes(saved)) {
        setStorageType(saved as StorageType);
        setIsStorageReady(true);
      }

      // Check if expiration is overdue
      if (saved === "cookies" && expiresAt) {
        const now = new Date();
        const expiryDate = new Date(expiresAt);
        if (now > expiryDate) {
          clearAll(); // Auto-clear if expired
          localUtils.remove("dataStoragePreference");
          localUtils.remove("dataStorageExpires");
          setIsStorageReady(false);
          window.location.reload();
          return;
        }
        {
          setIsStorageReady(true);
        }
      }

      setIsStorageReady(true);
    } catch (error) {
      console.error("Error initializing storage type:", error);
      setIsStorageReady(true);
    }
  }, []);

  // Persist storageType
  useEffect(() => {
    try {
      localUtils.set("dataStoragePreference", storageType);
      const expiresAt = localUtils.get("dataStorageExpires");

      if (storageType === "cookies") {
        const expires3Day = new Date(Date.now() + 3 * 86400000).toUTCString();
        !expiresAt && localUtils.set("dataStorageExpires", expires3Day);
      }
    } catch (error) {
      console.error("Error saving storage type preference:", error);
    }
  }, [storageType]);

  const clearStorage = useCallback(async (type: StorageType) => {
    const cleaners = {
      cookies: () => {
        const all = cookieUtils.getAll();
        Object.keys(all).forEach(
          (k) => !PRESERVED_KEYS.includes(k) && cookieUtils.remove(k),
        );
      },
      localStorage: () => {
        Object.keys(localStorage).forEach(
          (k) => !PRESERVED_KEYS.includes(k) && localUtils.remove(k),
        );
      },
      cloud: async () => {
        await cloudUtils.clearAll();
      },
    };

    await cleaners[type]();
  }, []);

  const migrateData = async (from: StorageType, to: StorageType) => {
    if (from === to) return;

    let data: Record<string, any> = {};
    if (from === "cookies") data = cookieUtils.getAll();
    else if (from === "localStorage") data = localUtils.getAll();
    else data = await cloudUtils.getAll();

    // Save the data to the new storage type
    for (const [key, value] of Object.entries(data)) {
      if (PRESERVED_KEYS.includes(key)) continue;
      if (to === "cookies") cookieUtils.set(key, value);
      else if (to === "localStorage") localUtils.set(key, value);
      else await cloudUtils.set(key, value);
    }

    // Clear the source storage AFTER data is safely stored in new location
    await clearStorage(from);
  };

  const changeStorageType = useCallback(
    async (type: StorageType) => {
      if (type === storageType) return;
      await migrateData(storageType, type);
      setStorageType(type);
      toast({
        title: "Storage Changed",
        description: `Data migrated to ${type}`,
      });
    },
    [storageType, migrateData, toast],
  );

  // Handle auto-migration on mount if changed
  useEffect(() => {
    const prev = prevTypeRef.current;
    if (prev && prev !== storageType) {
      migrateData(prev, storageType).catch((err) =>
        console.error("Auto-migration failed:", err),
      );
    }
    prevTypeRef.current = storageType;
  }, [storageType, migrateData]);

  // Core API methods
  const getItem = useCallback(
    async (key: string): Promise<any> => {
      try {
        const raw =
          storageType === "cookies"
            ? cookieUtils.get(key)
            : storageType === "localStorage"
            ? localUtils.get(key)
            : await cloudUtils.get(key);
        return raw ? storageJSON.decode(raw) : null;
      } catch (err) {
        console.error("getItem error:", err);
        return null;
      }
    },
    [storageType],
  );

  const setItem = useCallback(
    async (key: string, value: any) => {
      const json = storageJSON.encode(value);
      try {
        if (storageType === "cookies") cookieUtils.set(key, json);
        else if (storageType === "localStorage") localUtils.set(key, json);
        else await cloudUtils.set(key, json);
      } catch (err) {
        console.error("setItem error:", err);
      }
    },
    [storageType],
  );

  const removeItem = useCallback(
    async (key: string) => {
      try {
        if (storageType === "cookies") cookieUtils.remove(key);
        else if (storageType === "localStorage") localUtils.remove(key);
        else await cloudUtils.remove(key);
      } catch (err) {
        console.error("removeItem error:", err);
      }
    },
    [storageType],
  );

  const clearAll = useCallback(async () => {
    setIsStorageReady(false);
    await clearStorage(storageType);

    // Reset preference to default
    const defaultType: StorageType = "cookies";
    setStorageType(defaultType);
    localUtils.set("dataStoragePreference", defaultType);

    toast({
      title: "Data Reset",
      description: "All data has been cleared and reset to defaults.",
    });
  }, [storageType, clearStorage, toast]);

  const contextValue = useMemo(
    () => ({
      storageType,
      setStorageType: changeStorageType,
      getItem,
      setItem,
      removeItem,
      clearAll,
      isStorageReady,
    }),
    [
      storageType,
      changeStorageType,
      getItem,
      setItem,
      removeItem,
      clearAll,
      isStorageReady,
    ],
  );

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

// ---------------------------------------------------------
// Hook
// ---------------------------------------------------------

export const useStorage = () => {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
};

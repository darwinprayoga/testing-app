"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";

const StorageContext = createContext<StorageContextType | undefined>(undefined);

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
  isMigrating: boolean; // Added to track migration state
}

// ---------------------------------------------------------
// Utils
// ---------------------------------------------------------

const PRESERVED_KEYS = ["dataStoragePreference", "theme"];
const STORAGE_VERSION = "1.0"; // Added for future migrations
const JSON_PREFIX = "__json__";

const isJSON = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const encodeJSON = (value: any) =>
  typeof value === "object" ? JSON_PREFIX + JSON.stringify(value) : value;

const decodeJSON = (value: string) =>
  typeof value === "string" && value.startsWith(JSON_PREFIX)
    ? isJSON(value.slice(JSON_PREFIX.length))
      ? JSON.parse(value.slice(JSON_PREFIX.length))
      : value
    : value;

// JSON utils
const storageJSON = {
  encode: (value: any) => encodeURIComponent(JSON.stringify(value)),
  decode: (str: string) => {
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch (e) {
      console.warn("Failed to parse JSON:", str);
      return null;
    }
  },
};

// Cookie utils
const cookieUtils = {
  set: (name: string, value: string, days = 3) => {
    try {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
      return true;
    } catch (error) {
      console.error("Error setting cookie:", error);
      return false;
    }
  },

  get: (name: string): string | null => {
    try {
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith(nameEQ)) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting cookie:", error);
      return null;
    }
  },

  remove: (name: string): boolean => {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      return true;
    } catch (error) {
      console.error("Error removing cookie:", error);
      return false;
    }
  },

  getAll: (): Record<string, string> => {
    try {
      const result: Record<string, string> = {};
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex > 0) {
          const key = cookie.substring(0, separatorIndex);
          const value = decodeURIComponent(cookie.substring(separatorIndex + 1));
          result[key] = value;
        }
      }
      return result;
    } catch (error) {
      console.error("Error getting all cookies:", error);
      return {};
    }
  },
};

// LocalStorage utils
const localUtils = {
  set: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("Error setting localStorage item:", error);
      return false;
    }
  },

  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Error getting localStorage item:", error);
      return null;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Error removing localStorage item:", error);
      return false;
    }
  },

  getAll: (): Record<string, string> => {
    try {
      const result: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            result[key] = value;
          }
        }
      }
      return result;
    } catch (error) {
      console.error("Error getting all localStorage items:", error);
      return {};
    }
  },
};

// Cloud utils (Supabase)
const cloudUtils = {
  get: async (key: string) => {
    const { data, error } = await supabase
      .from("user_storage")
      .select("value")
      .eq("key", key)
      .single();
    if (error) {
      console.error("Cloud get error:", error);
      return null;
    }
    return typeof data?.value === "string"
      ? data.value
      : JSON.stringify(data?.value); // fallback if it’s a plain object
  },
  set: async (key: string, value: string) => {
    const { error } = await supabase
      .from("user_storage")
      .upsert({ key, value });
    if (error) console.error("Cloud set error:", error);
  },
  remove: async (key: string) => {
    const { error } = await supabase
      .from("user_storage")
      .delete()
      .eq("key", key);
    if (error) console.error("Cloud remove error:", error);
  },
  clearAll: async () => {
    const { error } = await supabase
      .from("user_storage")
      .delete()
      .neq("key", "dataStoragePreference");
    if (error) console.error("Cloud clear error:", error);
  },
  getAll: async () => {
    const { data, error } = await supabase.from("user_storage").select("*");
    if (error) {
      console.error("Cloud fetch all error:", error);
      return {};
    }
    return Object.fromEntries(
      data.map(({ key, value }: { key: string; value: string }) => [
        key,
        value,
      ]),
    );
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
  const [isMigrating, setIsMigrating] = useState(false);
  const previousStorageType = useRef<StorageType | null>(null);
  const { toast } = useToast();

  // Initialize storage preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dataStoragePreference") as StorageType;
      if (["cookies", "localStorage", "cloud"].includes(saved)) {
        setStorageType(saved);
      }
      // Save the storage version for future migrations
      localStorage.setItem("storageVersion", STORAGE_VERSION);
      setIsStorageReady(true);
    } catch (error) {
      console.error("Error initializing storage preferences:", error);
      // Fallback to cookies if localStorage is not available
      setStorageType("cookies");
      setIsStorageReady(true);
    }
  }, []);

  // Save storage preference
  useEffect(() => {
    try {
      localStorage.setItem("dataStoragePreference", storageType);
    } catch (error) {
      console.error("Error saving storage preference:", error);
    }
  }, [storageType]);

  // Handle storage type changes and migration
  useEffect(() => {
    const migrateIfNeeded = async () => {
      if (
        previousStorageType.current &&
        previousStorageType.current !== storageType &&
        isStorageReady
      ) {
        try {
          setIsMigrating(true);
          
          // Start migration
          const success = await migrateData(previousStorageType.current, storageType);
          
          if (success) {
            toast({
              title: "Storage Changed",
              description: `Data migrated to ${storageType}`,
            });
          } else {
            throw new Error("Migration failed");
          }
        } catch (error) {
          console.error("Migration error:", error);
          // Revert to previous storage type
          setStorageType(previousStorageType.current);
          toast({
            title: "Migration Failed",
            description: "Something went wrong during data migration. Your data remains in the original storage.",
            variant: "destructive",
          });
        } finally {
          setIsMigrating(false);
        }
      }
      previousStorageType.current = storageType;
    };

    migrateIfNeeded();
  }, [storageType, toast, isStorageReady]);

  // ---------------------------------------------------------
  // Core methods
  // ---------------------------------------------------------

  /**
   * Get an item from storage
   * @param key The key to get
   * @returns The value, or null if not found
   */
  const getItem = async (key: string): Promise<any> => {
    try {
      if (isMigrating) {
        console.warn(`Storage is migrating, getItem(${key}) might not return fresh data`);
      }
      
      let rawValue: string | null = null;
      
      if (storageType === "cookies") {
        rawValue = cookieUtils.get(key);
      } else if (storageType === "localStorage") {
        rawValue = localStorage.getItem(key);
      } else if (storageType === "cloud") {
        rawValue = await cloudUtils.get(key);
      }

      if (!rawValue) return null;

      // Try to parse as JSON, if it fails, return the raw value
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    } catch (error) {
      console.error(`Error getting item "${key}" from ${storageType}:`, error);
      return null;
    }
  };

  /**
   * Set an item in storage
   * @param key The key to set
   * @param value The value to set
   * @returns A promise that resolves when the operation is complete
   */
  const setItem = async (key: string, value: any): Promise<void> => {
    try {
      if (isMigrating) {
        console.warn(`Storage is migrating, setItem(${key}) might be lost`);
      }
      
      // Convert value to string if it's not already
      const stringValue = typeof value === "string" 
        ? value 
        : JSON.stringify(value);
      
      let success = false;
      
      if (storageType === "cookies") {
        success = cookieUtils.set(key, stringValue, 3);
      } else if (storageType === "localStorage") {
        try {
          localStorage.setItem(key, stringValue);
          success = true;
        } catch (storageError) {
          console.error(`Error setting item in localStorage: ${storageError}`);
        }
      } else if (storageType === "cloud") {
        success = await cloudUtils.set(key, stringValue);
      }
      
      if (!success) {
        console.error(`Failed to set item "${key}" in ${storageType}`);
      }
    } catch (error) {
      console.error(`Error setting item "${key}" in ${storageType}:`, error);
    }
  };

  /**
   * Remove an item from storage
   * @param key The key to remove
   * @returns A promise that resolves when the operation is complete
   */
  const removeItem = async (key: string): Promise<void> => {
    try {
      if (isMigrating) {
        console.warn(`Storage is migrating, removeItem(${key}) might fail`);
      }
      
      let success = false;
      
      if (storageType === "cookies") {
        success = cookieUtils.remove(key);
      } else if (storageType === "localStorage") {
        try {
          localStorage.removeItem(key);
          success = true;
        } catch (storageError) {
          console.error(`Error removing item from localStorage: ${storageError}`);
        }
      } else if (storageType === "cloud") {
        success = await cloudUtils.remove(key);
      }
      
      if (!success) {
        console.error(`Failed to remove item "${key}" from ${storageType}`);
      }
    } catch (error) {
      console.error(`Error removing item "${key}" from ${storageType}:`, error);
    }
  };

  /**
   * Clear all items from the specified storage type, except preserved keys
   * @param type The storage type to clear
   * @returns A promise that resolves to true if successful, false otherwise
   */
  const clearStorage = async (type: StorageType): Promise<boolean> => {
    try {
      if (type === "cookies") {
        const all = cookieUtils.getAll();
        for (const key of Object.keys(all)) {
          if (!PRESERVED_KEYS.includes(key)) {
            cookieUtils.remove(key);
          }
        }
      } else if (type === "localStorage") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && !PRESERVED_KEYS.includes(key)) {
            localStorage.removeItem(key);
          }
        }
      } else if (type === "cloud") {
        return await cloudUtils.clearAll();
      }
      return true;
    } catch (error) {
      console.error(`Error clearing ${type} storage:`, error);
      return false;
    }
  };

  /**
   * Clear all items from the current storage type
   * @returns A promise that resolves when the operation is complete
   */
  const clearAll = async (): Promise<void> => {
    try {
      const success = await clearStorage(storageType);
      if (!success) {
        console.error(`Failed to clear ${storageType} storage`);
      }
      
      // Preserve the storage preference
      if (storageType === "localStorage") {
        try {
          localStorage.setItem("dataStoragePreference", storageType);
        } catch (error) {
          console.error("Error preserving storage preference:", error);
        }
      }
    } catch (error) {
      console.error(`Error in clearAll for ${storageType}:`, error);
    }
  };

  /**
   * Migrate data from one storage type to another
   * @param from The source storage type
   * @param to The destination storage type
   * @returns A promise that resolves to true if successful, false otherwise
   */
  const migrateData = async (from: StorageType, to: StorageType): Promise<boolean> => {
    try {
      if (from === to) return true;

      // Get all data from the source storage
      let sourceData: Record<string, string> = {};
      if (from === "cookies") {
        sourceData = cookieUtils.getAll();
      } else if (from === "localStorage") {
        sourceData = localUtils.getAll();
      } else if (from === "cloud") {
        sourceData = await cloudUtils.getAll();
      }

      // Clear the destination storage (except preserved keys)
      const clearSuccess = await clearStorage(to);
      if (!clearSuccess) {
        console.error(`Failed to clear destination ${to} storage before migration`);
        return false;
      }

      // Migrate each item to the destination storage
      let migrationSuccess = true;
      for (const [key, value] of Object.entries(sourceData)) {
        // Skip preserved keys and system keys
        if (PRESERVED_KEYS.includes(key) || key.startsWith("__")) continue;
        
        let success = false;
        if (to === "cookies") {
          success = cookieUtils.set(key, value);
        } else if (to === "localStorage") {
          success = localUtils.set(key, value);
        } else if (to === "cloud") {
          success = await cloudUtils.set(key, value);
        }
        
        if (!success) {
          console.error(`Failed to migrate item "${key}" to ${to}`);
          migrationSuccess = false;
        }
      }
      
      return migrationSuccess;
    } catch (error) {
      console.error(`Error migrating data from ${from} to ${to}:`, error);
      return false;
    }
  };

  /**
   * Change the storage type and migrate data
   * @param type The new storage type
   */
  const changeStorageType = async (type: StorageType) => {
    if (type === storageType) return; // No change
    if (isMigrating) {
      console.warn("Storage migration already in progress");
      return;
    }

    setIsMigrating(true);
    try {
      const success = await migrateData(storageType, type);
      if (success) {
        setStorageType(type); // Update the storage type only if migration succeeded
        // Save the new preference
        try {
          localStorage.setItem("dataStoragePreference", type);
        } catch (error) {
          console.error("Error saving new storage preference:", error);
        }
      } else {
        throw new Error("Migration failed");
      }
    } catch (error) {
      console.error("Error changing storage type:", error);
      toast({
        title: "Storage Change Failed",
        description: "Could not change storage type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <StorageContext.Provider
      value={{
        storageType,
        setStorageType: changeStorageType,
        getItem,
        setItem,
        removeItem,
        clearAll,
        isStorageReady,
        isMigrating, // Export the migration state
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

// ---------------------------------------------------------
// Custom hook
// ---------------------------------------------------------

export const useStorage = () => {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
};

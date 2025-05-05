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
}

// ---------------------------------------------------------
// Utils
// ---------------------------------------------------------

const PRESERVED_KEYS = ["dataStoragePreference", "theme"];
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
  set: (name: string, value: any, days = 3) => {
    const encoded = storageJSON.encode(value);
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encoded};expires=${date.toUTCString()};path=/`;
  },

  get: (name: string) => {
    const nameEQ = `${name}=`;
    const raw = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(nameEQ))
      ?.substring(nameEQ.length);
    return raw ? storageJSON.decode(raw) : null;
  },

  remove: (name: string) =>
    (document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`),

  getAll: () =>
    Object.fromEntries(
      document.cookie
        .split(";")
        .map((c) => c.trim().split("="))
        .filter(([k]) => k)
        .map(([k, v]) => [k, storageJSON.decode(v)]),
    ),
};

// LocalStorage utils
const localUtils = {
  getAll: () =>
    Object.fromEntries(
      Object.keys(localStorage).map((k) => [
        k,
        storageJSON.decode(localStorage.getItem(k) ?? ""),
      ]),
    ),
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
  const previousStorageType = useRef<StorageType | null>(null);
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dataStoragePreference") as StorageType;
    if (["cookies", "localStorage", "cloud"].includes(saved)) {
      setStorageType(saved);
    }
    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("dataStoragePreference", storageType);
  }, [storageType]);

  useEffect(() => {
    const migrateIfNeeded = async () => {
      if (
        previousStorageType.current &&
        previousStorageType.current !== storageType
      ) {
        try {
          setIsMigrating(true);
          await clearStorage(storageType); // Auto-clear the destination
          await migrateData(previousStorageType.current, storageType);
          toast({
            title: "Storage Changed",
            description: `Data migrated to ${storageType}`,
          });
        } catch (e) {
          console.error("Migration error:", e);
          toast({
            title: "Migration Failed",
            description: "Something went wrong during data migration.",
            variant: "destructive",
          });
        } finally {
          setIsMigrating(false);
        }
      }
      previousStorageType.current = storageType;
    };

    migrateIfNeeded();
  }, [storageType, toast]);

  // ---------------------------------------------------------
  // Core methods
  // ---------------------------------------------------------

  const getItem = async (key: string): Promise<any> => {
    try {
      let raw: string | null = null;
      if (storageType === "cookies") raw = cookieUtils.get(key);
      else if (storageType === "localStorage") raw = localStorage.getItem(key);
      else raw = await cloudUtils.get(key);

      if (!raw) return null;

      return JSON.parse(raw); // always parse
    } catch (err) {
      console.error("Error getting item from storage:", err);
      return null;
    }
  };

  const setItem = async (key: string, value: any) => {
    try {
      const json = JSON.stringify(value); // always stringify

      if (storageType === "cookies") cookieUtils.set(key, json, 3);
      else if (storageType === "localStorage") localStorage.setItem(key, json);
      else await cloudUtils.set(key, json);
    } catch (err) {
      console.error("Error setting item in storage:", err);
    }
  };

  const removeItem = async (key: string) => {
    try {
      if (storageType === "cookies") cookieUtils.remove(key);
      else if (storageType === "localStorage") localStorage.removeItem(key);
      else await cloudUtils.remove(key);
    } catch (err) {
      console.error("removeItem error:", err);
    }
  };

  const clearStorage = async (type: StorageType) => {
    if (type === "cookies") {
      const all = cookieUtils.getAll();
      for (const key of Object.keys(all)) {
        if (!PRESERVED_KEYS.includes(key)) cookieUtils.remove(key);
      }
    } else if (type === "localStorage") {
      for (const key of Object.keys(localStorage)) {
        if (!PRESERVED_KEYS.includes(key)) localStorage.removeItem(key);
      }
    } else {
      const all = await cloudUtils.getAll();
      for (const key of Object.keys(all)) {
        if (!PRESERVED_KEYS.includes(key)) await cloudUtils.remove(key);
      }
    }
  };

  const clearAll = async () => {
    await clearStorage(storageType);
    if (storageType === "localStorage") {
      localStorage.setItem("dataStoragePreference", storageType);
    }
  };

  const migrateData = async (from: StorageType, to: StorageType) => {
    if (from === to) return;

    let data: Record<string, string> = {};
    if (from === "cookies") data = cookieUtils.getAll();
    else if (from === "localStorage") data = localUtils.getAll();
    else data = await cloudUtils.getAll();

    await clearStorage(from); // Clear the source storage after migration

    // Save the data to the new storage type
    for (const [key, value] of Object.entries(data)) {
      if (PRESERVED_KEYS.includes(key) || key.startsWith("__")) continue;
      const parsed = decodeJSON(value);
      const encoded = encodeJSON(parsed);
      if (to === "cookies") cookieUtils.set(key, encoded);
      else if (to === "localStorage") localStorage.setItem(key, encoded);
      else await cloudUtils.set(key, encoded);
    }
    setIsMigrating(false); // Indicate that migration is complete
  };

  const changeStorageType = async (type: StorageType) => {
    if (type === storageType || isMigrating) return; // Prevent changing while migrating

    setIsMigrating(true);
    await migrateData(storageType, type); // Migrate data
    setStorageType(type); // Update the storage type

    // Force reload after the migration process
    window.location.reload();
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

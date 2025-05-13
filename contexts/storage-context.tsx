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
    const { data, error } = await supabase
      .from("user_storage")
      .select("value")
      .eq("key", key)
      .single();
    return error ? null : data?.value;
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
      .not("key", "in", `(${PRESERVED_KEYS.map((k) => `'${k}'`).join(",")})`);
    if (error) console.error("Cloud clear error:", error);
  },
  getAll: async () => {
    const { data, error } = await supabase.from("user_storage").select("*");
    if (error) return {};
    return Object.fromEntries(data.map(({ key, value }: any) => [key, value]));
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
        const all = await cloudUtils.getAll();
        for (const key in all) {
          if (!PRESERVED_KEYS.includes(key)) await cloudUtils.remove(key);
        }
      },
    };

    await cleaners[type]();
  }, []);

  const migrateData = async (from: StorageType, to: StorageType) => {
    if (from === to) return;

    let data: Record<string, string> = {};
    if (from === "cookies") data = await cookieUtils.getAll();
    else if (from === "localStorage") data = await localUtils.getAll();
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

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { CloudKey, CloudTables } from "@/lib/relations";
import {
  cloudUtils,
  cookieUtils,
  localUtils,
  storageJSON,
} from "@/utils/storage-utils";

// Keys to preserve across clear operations (e.g., user session, theme)
const PRESERVED_KEYS = [
  "dataStoragePreference",
  "dataStorageExpires",
  "theme",
  "uid",
];

// Supported storage types
export type StorageType = "cookies" | "localStorage";

// Context interface definition
interface StorageContextType {
  storageType: StorageType;
  setStorageType: (type: StorageType) => void;
  getItem: (key: string) => Promise<any>;
  setItem: (key: string, value: any) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isStorageReady: boolean;
}

// React context creation
const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Utility to safely get UID from localStorage
const getUid = (): string | null => {
  try {
    return localStorage.getItem("uid") || null;
  } catch (e) {
    console.error("Failed to get the uid", e);
    return null;
  }
};

// Main provider component
export const StorageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();

  const [uid, setUid] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<StorageType>("cookies");
  const [isStorageReady, setIsStorageReady] = useState<boolean>(false);

  // Initial setup: determine UID, saved storage type, and expiration
  useEffect(() => {
    const initialize = async () => {
      const userUid = getUid();
      if (!userUid) return;

      setUid(userUid);

      const savedType = localUtils.get("dataStoragePreference") as StorageType;
      const expiresAt = localUtils.get("dataStorageExpires");

      if (["cookies", "localStorage"].includes(savedType)) {
        setStorageType(savedType);
      }

      // Handle cookie expiration logic
      if (savedType === "cookies" && expiresAt) {
        const now = new Date();
        const expiry = new Date(expiresAt);
        if (now > expiry) {
          await clearStorage(savedType);
          localUtils.remove("dataStoragePreference");
          localUtils.remove("dataStorageExpires");
          setStorageType("cookies");
        }
      }

      setIsStorageReady(true);
    };

    initialize();
  }, []);

  // Save storage type changes and handle cookie expiration metadata
  useEffect(() => {
    try {
      localUtils.set("dataStoragePreference", storageType);
      const expiresAt = localUtils.get("dataStorageExpires");

      if (storageType === "cookies") {
        const expires3Day = new Date(Date.now() + 3 * 86400000).toUTCString();
        if (!expiresAt) localUtils.set("dataStorageExpires", expires3Day);
      }
    } catch (error) {
      console.error("Error saving storage type preference:", error);
    }
  }, [storageType]);

  // Clear data by type, preserving certain keys
  const clearStorage = useCallback(
    async (type: StorageType) => {
      const cleaners: Record<StorageType, () => void | Promise<void>> = {
        cookies: () => {
          const all = cookieUtils.getAll();
          Object.keys(all).forEach((k) => {
            if (!PRESERVED_KEYS.includes(k)) cookieUtils.remove(k);
          });
        },
        localStorage: () => {
          Object.keys(localStorage).forEach((k) => {
            if (!PRESERVED_KEYS.includes(k)) localUtils.remove(k);
          });
        },
      };

      await cleaners[type]();
    },
    [uid],
  );

  // Migrate data from one storage type to another
  const migrateData = useCallback(
    async (from: StorageType, to: StorageType) => {
      if (!uid) return;

      let data =
        from === "cookies"
          ? cookieUtils.getAll()
          : from === "localStorage" && localUtils.getAll();

      for (const [key, rawValue] of Object.entries(data)) {
        if (PRESERVED_KEYS.includes(key)) continue;

        const decodedValue =
          typeof rawValue === "string"
            ? storageJSON.decode(rawValue)
            : rawValue;

        if (decodedValue === null || decodedValue === undefined) continue;

        if (to === "cookies") cookieUtils.set(key, decodedValue);
        else if (to === "localStorage") localUtils.set(key, decodedValue);
      }

      if (from !== to) await clearStorage(from);
    },
    [uid, clearStorage],
  );

  // Change and migrate storage type with user feedback
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

  // Get item from current storage
  const getItem = useCallback(
    async (key: string): Promise<any> => {
      try {
        if (storageType === "cookies") return cookieUtils.get(key);
        if (storageType === "localStorage") return localUtils.get(key);
        return null;
      } catch (err) {
        console.error("getItem error:", err);
        return null;
      }
    },
    [storageType, uid],
  );

  // Set item to current storage
  const setItem = useCallback(
    async (key: string, value: any) => {
      if (value === null || value === undefined) return;
      try {
        if (storageType === "cookies") cookieUtils.set(key, value);
        else if (storageType === "localStorage") localUtils.set(key, value);
      } catch (err) {
        console.error("setItem error:", err);
      }
    },
    [storageType, uid],
  );

  // Remove item from current storage
  const removeItem = useCallback(
    async (key: string) => {
      try {
        if (storageType === "cookies") cookieUtils.remove(key);
        else if (storageType === "localStorage") localUtils.remove(key);
      } catch (err) {
        console.error("removeItem error:", err);
      }
    },
    [storageType, uid],
  );

  // Clear all data and reset to defaults
  const clearAll = useCallback(async () => {
    setIsStorageReady(false);
    await clearStorage(storageType);
    setStorageType("cookies");
    localUtils.set("dataStoragePreference", "cookies");
    toast({
      title: "Data Reset",
      description: "All data has been cleared and reset to defaults.",
    });
    setIsStorageReady(true);
  }, [clearStorage, storageType, toast]);

  // Memoize context value
  const contextValue = useMemo(
    (): StorageContextType => ({
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

// Hook for consuming storage context
export const useStorage = (): StorageContextType => {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
};

// Import Supabase client and helper functions to get the appropriate table from a CloudKey
import { CloudKey, CloudTables } from "@/lib/relations";
import { supabase } from "./supabase/client";

/**
 * Utility to safely encode/decode JSON data for storage (e.g., cookies, localStorage).
 */
export const storageJSON = {
  encode: (value: unknown): string => encodeURIComponent(JSON.stringify(value)),

  decode: (str: string): any => {
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch {
      return null; // Gracefully return null if decoding/parsing fails
    }
  },
};

/**
 * Cookie utilities: set, get, remove, and get all cookie values as parsed JSON.
 */
export const cookieUtils = {
  // Set a cookie with optional expiration in days
  set: (name: string, value: any, days = 3): void => {
    if (value === null || value === undefined) return;
    const encoded = storageJSON.encode(value);
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encoded};expires=${expires};path=/`;
  },

  // Get a single cookie value
  get: (name: string): any => {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.split("=")[1];
    return raw ? storageJSON.decode(raw) : null;
  },

  // Remove a cookie by name
  remove: (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  },

  // Get all cookies as a JSON object
  getAll: (): Record<string, any> =>
    Object.fromEntries(
      document.cookie
        .split("; ")
        .map((c) => c.split("="))
        .filter(([k]) => k)
        .map(([k, v]) => [k, storageJSON.decode(v)]),
    ),
};

/**
 * LocalStorage utilities: set, get, remove, and get all localStorage values as parsed JSON.
 */
export const localUtils = {
  // Set a value in localStorage
  set: (key: string, value: any): void => {
    if (value === null || value === undefined) return;
    localStorage.setItem(key, storageJSON.encode(value));
  },

  // Get a single value from localStorage
  get: (key: string): any => {
    const raw = localStorage.getItem(key);
    return raw ? storageJSON.decode(raw) : null;
  },

  // Remove an item from localStorage
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  // Get all keys/values from localStorage as a JSON object
  getAll: (): Record<string, any> =>
    Object.fromEntries(
      Object.keys(localStorage).map((k) => [
        k,
        storageJSON.decode(localStorage.getItem(k) ?? ""),
      ]),
    ),
};

/**
 * Cloud storage utilities using Supabase as backend.
 */

const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const convertKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        camelToSnake(key),
        convertKeysToSnakeCase(value),
      ]),
    );
  }
  return obj;
};

const convertKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamelCase(value),
      ]),
    );
  }
  return obj;
};

export const cloudUtils = {
  get: async (key: CloudKey, uid: string): Promise<any[]> => {
    const table = CloudTables[key];
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("uid", uid);

    if (error) console.error("Cloud get error:", error);
    return data ? convertKeysToCamelCase(data) : [];
  },

  set: async (key: CloudKey, payload: any, uid: string): Promise<void> => {
    if (payload === null || payload === undefined) return;
    const table = CloudTables[key];
    const fullPayload = { ...payload, uid };
    const snakePayload = convertKeysToSnakeCase(fullPayload);
    const { error } = await supabase.from(table).upsert(snakePayload);

    if (error) console.error("Cloud set error:", error);
  },

  remove: async (key: CloudKey, uid: string, id?: string): Promise<void> => {
    const table = CloudTables[key];
    const query = supabase.from(table).delete().eq("uid", uid);

    if (id) query.eq("id", id);
    const { error } = await query;

    if (error) console.error(`[Cloud] Remove failed from ${table}:`, error);
  },

  getAll: async (uid: string): Promise<Record<string, any>> => {
    const results: Record<string, any> = {};

    for (const key of Object.keys(CloudTables)) {
      const table = CloudTables[key as keyof typeof CloudTables];
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("uid", uid);

      if (!error && data) results[key] = convertKeysToCamelCase(data);
    }

    return results;
  },

  query: async (
    key: CloudKey,
    conditions: Record<string, string | number | boolean>,
  ): Promise<any[]> => {
    const table = CloudTables[key];
    let query = supabase.from(table).select("*");

    // Dynamically apply conditions
    Object.entries(conditions).forEach(([field, value]) => {
      query = query.eq(field, value);
    });

    const { data, error } = await query;

    if (error) console.error(`[Cloud] Query failed from ${table}:`, error);
    return data ? convertKeysToCamelCase(data) : [];
  },

  subscribe: (key: CloudKey, uid: string, onChange: (payload: any) => void) => {
    const table = CloudTables[key];

    return supabase
      .channel(`${table}-changes-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `uid=eq.${uid}` },
        onChange,
      )
      .subscribe();
  },

  removeChannel: (subscription: any) => {
    return supabase.removeChannel(subscription);
  },
};

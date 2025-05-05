"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { useStorage } from "@/contexts/storage-context";

// Define activity types
export type ActivityType =
  | "settings_opened"
  | "tab_selected"
  | "search_performed"
  | "clipboard_cleared"
  | "font_changed"
  | "font_size_changed"
  | "theme_changed"
  | "language_changed";

// Activity record structure
export interface ActivityRecord {
  type: ActivityType;
  timestamp: number;
  details?: {
    tabId?: string;
    searchQuery?: string;
    fontName?: string;
    fontSize?: number;
    themeName?: string;
    languageCode?: string;
    [key: string]: any;
  };
}

// Context state
interface ActivityContextState {
  activities: ActivityRecord[];
  recordActivity: (
    type: ActivityType,
    details?: ActivityRecord["details"],
  ) => void;
  getLastActivity: (type: ActivityType) => ActivityRecord | undefined;
  clearActivities: () => void;
}

// Create context
const ActivityContext = createContext<ActivityContextState | undefined>(
  undefined,
);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const { getItem, setItem, isStorageReady } = useStorage();

  useEffect(() => {
    if (!isStorageReady) return;

    const loadActivitiesFromStorage = async () => {
      try {
        const savedActivities = await getItem("userActivities");
        if (savedActivities) {
          try {
            setActivities(savedActivities);
          } catch (error) {
            console.error("Failed to parse activities:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load activities from storage:", error);
      }
    };

    loadActivitiesFromStorage();
  }, [isStorageReady, getItem]);

  // Save activities to storage when they change
  useEffect(() => {
    if (!isStorageReady) return;

    try {
      setItem("userActivities", activities);
    } catch (error) {
      console.error("Failed to save activities to storage:", error);
    }
  }, [activities, isStorageReady, setItem]);

  // Record a new activity
  const recordActivity = (
    type: ActivityType,
    details?: ActivityRecord["details"],
  ) => {
    // Only record specific activities as requested
    if (
      type === "clipboard_cleared" ||
      type === "font_changed" ||
      type === "font_size_changed" ||
      type === "theme_changed" ||
      type === "language_changed" ||
      type === "settings_opened" ||
      type === "tab_selected" ||
      type === "search_performed"
    ) {
      // Check if this is a duplicate of the most recent activity
      const mostRecent = activities[0];
      if (
        mostRecent &&
        mostRecent.type === type &&
        mostRecent.details === details
      ) {
        // Skip recording duplicate activities
        return;
      }

      const newActivity: ActivityRecord = {
        type,
        timestamp: Date.now(),
        details,
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, 100)); // Keep last 100 activities
    }
  };

  // Get the most recent activity of a specific type
  const getLastActivity = (type: ActivityType): ActivityRecord | undefined => {
    return activities.find((activity) => activity.type === type);
  };

  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
  };

  return (
    <ActivityContext.Provider
      value={{ activities, recordActivity, getLastActivity, clearActivities }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

// Hook to use the activity context
export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}

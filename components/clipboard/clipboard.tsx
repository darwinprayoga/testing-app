"use client";

import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import { getRandomJokes } from "@/data/jokes";
import { useDebouncedCallback } from "use-debounce";
import type { ClipboardItem, ClipboardProps } from "@/types/clipboard";
import { ClipboardContent } from "./clipboard-content";
import { ClipboardControls } from "./clipboard-controls";
import { ClipboardHistory } from "./clipboard-history";
import { ClipboardDialog } from "./clipboard-dialog";
import { useTypingStatus } from "@/hooks/use-typing-status";
import { cloudUtils } from "@/utils/storage-utils";
import { useAuth } from "@/contexts/auth-context";
import { v4 as uuidv4 } from "uuid";

const loadDummyData = async (
  lang: string,
  setHistory: React.Dispatch<React.SetStateAction<ClipboardItem[]>>,
  persist: (key: string, value: any) => void,
) => {
  const jokeItems = getRandomJokes(lang, "clipboard", 4);
  const dummyHistory = jokeItems.map((joke, idx) => ({
    id: (idx + 1).toString(),
    content: joke.clipboardContent ?? "Example clipboard text",
    timestamp: Date.now() - (idx + 1) * 3600000,
    type: "text" as const,
  }));
  setHistory(dummyHistory);
  persist("clipboardHistory", dummyHistory);
};

export default function Clipboard({ isMobile = false }: ClipboardProps) {
  const [currentText, setCurrentText] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [manualPasteText, setManualPasteText] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const { currentLanguage } = useLanguage();
  const { getItem, setItem, isStorageReady } = useStorage();
  const { isTyping, handleTyping } = useTypingStatus();
  const { thisUser, isCloud } = useAuth();

  // Fetch data from cloud storage
  const fetchAndSetData = useCallback(async (uid: string) => {
    const [clipboardHistory, settings] = await Promise.all([
      cloudUtils.get("clipboardHistory", uid),
      cloudUtils.get("settings", uid),
    ]);

    if (clipboardHistory) {
      const sortedHistory = clipboardHistory.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setHistory(sortedHistory);
    }

    const setting = settings?.[0];
    if (setting?.clipboardText) setCurrentText(setting.clipboardText);
  }, []);

  // Initialize data and subscribe to cloud changes
  const initDatas = useCallback(
    async (uid: string) => {
      await fetchAndSetData(uid);

      // Still using the localStorage
      const [savedImage, savedShowHistory, savedEditMode] = await Promise.all([
        getItem("clipboardImage"),
        getItem("clipboardShowHistory"),
        getItem("clipboardEditMode"),
      ]);
      if (typeof savedImage === "string") setCurrentImage(savedImage);
      if (typeof savedShowHistory === "boolean")
        setShowHistory(savedShowHistory);
      if (typeof savedEditMode === "boolean") setIsEditMode(savedEditMode);
    },
    [fetchAndSetData],
  );

  // Update cloud settings with local setter sync
  const updateSetting = useCallback(
    async (key: string, value: any, localSetter: (val: any) => void) => {
      if (thisUser && isCloud) {
        await cloudUtils.set(
          "settings",
          { uid: thisUser.id, [key]: value },
          thisUser.id,
        );
      }
      localSetter(value);
    },
    [thisUser, isCloud],
  );

  // Handle text changes with cloud or local update
  const handleChange = useCallback(
    (value: string) => {
      if (thisUser && isCloud) {
        setCurrentText(value);
        updateSetting("clipboardText", value, setCurrentText);
      } else {
        setCurrentText(value);
      }
    },
    [thisUser, isCloud, updateSetting],
  );

  // Persist state to local storage (debounced)
  const persist = useDebouncedCallback((key: string, value: any) => {
    if (isStorageReady) setItem(key, value);
  }, 300);

  // Load initial data on mount or language/storage ready change
  const loadClipboardFromStorage = async () => {
    try {
      const [
        savedText,
        savedImage,
        savedHistory,
        savedShowHistory,
        savedEditMode,
      ] = await Promise.all([
        getItem("clipboardText"),
        getItem("clipboardImage"),
        getItem("clipboardHistory"),
        getItem("clipboardShowHistory"),
        getItem("clipboardEditMode"),
      ]);

      if (typeof savedText === "string") setCurrentText(savedText);
      if (typeof savedImage === "string") setCurrentImage(savedImage);
      if (Array.isArray(savedHistory)) {
        setHistory(savedHistory);
      } else if (!savedText && !savedImage) {
        await loadDummyData(currentLanguage, setHistory, persist);
      }
      if (typeof savedShowHistory === "boolean")
        setShowHistory(savedShowHistory);
      if (typeof savedEditMode === "boolean") setIsEditMode(savedEditMode);
    } catch (error) {
      console.error("Storage clipboard error:", error);
    }
  };

  // Load important datas
  useEffect(() => {
    if (thisUser && isCloud) {
      initDatas(thisUser.id);

      const subscription = cloudUtils.subscribe(
        "clipboardHistory",
        thisUser.id,
        async () => {
          await fetchAndSetData(thisUser.id);
        },
      );

      return () => {
        cloudUtils.removeChannel(subscription);
      };
    } else {
      if (!isStorageReady || initializedRef.current) return;
      initializedRef.current = true;
      loadClipboardFromStorage();
    }
  }, [isStorageReady, initDatas, thisUser, isCloud]);

  // Enable edit mode if no content or history
  useEffect(() => {
    if (!currentText && !currentImage && history.length === 0) {
      setIsEditMode(true);
    }
  }, [currentText, currentImage, history]);

  // Disable edit mode on click outside component or textarea
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsEditMode(false);
      } else if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        textareaRef.current.blur();
        setIsEditMode(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state to local storage when relevant changes happen
  useEffect(() => {
    if (isStorageReady) persist("clipboardText", currentText);
  }, [currentText, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardImage", currentImage);
  }, [currentImage, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardHistory", history);
  }, [history, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardShowHistory", showHistory);
  }, [showHistory, isStorageReady, persist]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardEditMode", isEditMode);
  }, [isEditMode, isStorageReady, persist]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditMode]);

  // Hide history panel when typing
  useEffect(() => {
    if (isTyping) setShowHistory(false);
  }, [isTyping]);

  // Handle pasting images
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (!isEditMode) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.includes("image")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            setCurrentImage(event.target?.result as string);
            handleChange("");
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    const el = containerRef.current;
    el?.addEventListener("paste", handlePasteEvent);
    return () => el?.removeEventListener("paste", handlePasteEvent);
  }, [isEditMode, handleChange]);

  // Add new text to clipboard
  const addToClipboard = useCallback(
    (text: string) => {
      handleChange(text);
      setCurrentImage(null);
    },
    [handleChange],
  );

  // Handle paste button to read from clipboard or open manual paste dialog
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        addToClipboard(text);
        setCurrentImage(null);
        return;
      }
    } catch (error) {
      console.warn("Clipboard access failed:", error);
    }
    setShowPasteDialog(true);
  }, [addToClipboard]);

  // Handle manual paste confirm
  const handleManualPaste = useCallback(() => {
    if (manualPasteText.trim()) {
      addToClipboard(manualPasteText.trim());
      setManualPasteText("");
      setShowPasteDialog(false);
    }
  }, [manualPasteText, addToClipboard]);
  // Toggle history panel
  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => {
      const next = !prev;
      persist("clipboardShowHistory", next);
      return next;
    });
  }, [persist]);

  // Select an item from history to populate clipboard
  const selectHistoryItem = useCallback(
    (item: ClipboardItem) => {
      if (item.type === "text") {
        handleChange(item.content);
        setCurrentImage(null);
      } else {
        setCurrentImage(item.content);
        handleChange("");
      }
      setShowHistory(false);
    },
    [handleChange],
  );

  // Clear current clipboard content and add to history if changed
  const handleClearText = useCallback(async () => {
    const latest = history[0];

    if (
      (currentText.trim() && latest?.content !== currentText.trim()) ||
      (currentImage && latest?.content !== currentImage)
    ) {
      const newItem: ClipboardItem = {
        id: uuidv4(),
        content: currentImage ?? currentText,
        timestamp: Date.now(),
        type: currentImage ? "image" : "text",
      };
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);

      if (thisUser && isCloud) {
        await cloudUtils.set("clipboardHistory", newItem, thisUser.id);
      }
    }

    handleChange("");
    setCurrentImage(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [currentImage, currentText, history, handleChange, thisUser, isCloud]);

  // Delete a history item by id
  const deleteHistoryItem = useCallback(
    async (id: string) => {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      if (thisUser && isCloud) {
        await cloudUtils.remove("clipboardHistory", thisUser.id, id);
      }
    },
    [history, thisUser, isCloud],
  );

  // Toggle edit mode and focus textarea if enabled
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
      return next;
    });
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`flex flex-col border rounded-lg overflow-hidden ${
          isMobile ? "h-[300px]" : "h-[400px]"
        }`}
        tabIndex={0}
        onClick={() => {
          if (!currentText && !currentImage) {
            setIsEditMode(true);
            textareaRef.current?.focus();
          }
        }}
      >
        <ClipboardContent
          currentText={currentText}
          currentImage={currentImage}
          isEditMode={isEditMode}
          onTextChange={handleChange}
          onToggleEditMode={toggleEditMode}
          textareaRef={textareaRef as RefObject<HTMLTextAreaElement>}
          typing={handleTyping}
        />
        <ClipboardControls
          currentText={currentText}
          currentImage={currentImage}
          onToggleHistory={toggleHistory}
          onClear={handleClearText}
          onPaste={handlePaste}
          textareaRef={textareaRef as RefObject<HTMLTextAreaElement>}
        />
        <ClipboardHistory
          history={history}
          onSelectItem={selectHistoryItem}
          onDeleteItem={deleteHistoryItem}
          show={showHistory}
        />
      </div>
      <ClipboardDialog
        open={showPasteDialog}
        onOpenChange={setShowPasteDialog}
        manualPasteText={manualPasteText}
        onManualPasteTextChange={setManualPasteText}
        onManualPaste={handleManualPaste}
      />
    </>
  );
}

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

const loadDummyData = async (
  lang: string,
  setHistory: (items: ClipboardItem[]) => void,
  persist: (key: string, value: any) => void,
) => {
  const jokeItems = getRandomJokes(lang, "clipboard", 4);
  const dummyHistory: ClipboardItem[] = jokeItems.map((joke, index) => ({
    id: (index + 1).toString(),
    content: joke.clipboardContent || "Example clipboard text",
    timestamp: Date.now() - (index + 1) * 3600000,
    type: "text",
  }));
  setHistory(dummyHistory);
  persist("clipboardHistory", dummyHistory);
};

export function Clipboard({ isMobile = false }: ClipboardProps) {
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

  const persist = useDebouncedCallback((key: string, value: any) => {
    if (isStorageReady) setItem(key, value);
  }, 300);

  // Initialize state from storage or dummy
  useEffect(() => {
    if (!isStorageReady || initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
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
    })();
  }, [currentLanguage, isStorageReady]);

  useEffect(() => {
    if (!currentText && !currentImage && history.length === 0) {
      setIsEditMode(true);
    }
  }, [currentText, currentImage, history]);

  // Click outside to disable edit
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

  // Sync state to storage
  useEffect(() => {
    if (isStorageReady) persist("clipboardText", currentText);
  }, [currentText, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardImage", currentImage);
  }, [currentImage, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardHistory", history);
  }, [history, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardShowHistory", showHistory);
  }, [showHistory, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) persist("clipboardEditMode", isEditMode);
  }, [isEditMode, isStorageReady]);

  useEffect(() => {
    // Focus the first input element when the step changes
    const inputElement = document.querySelector(
      "input:not([disabled])",
    ) as HTMLInputElement;
    if (isEditMode) {
      setTimeout(() => {
        inputElement?.focus();
      }, 100);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isTyping) setShowHistory(false);
  }, [isTyping]);

  // Paste image handler
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (!isEditMode) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.includes("image")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setCurrentImage(event.target?.result as string);
              setCurrentText("");
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    };

    const el = containerRef.current;
    el?.addEventListener("paste", handlePasteEvent);
    return () => el?.removeEventListener("paste", handlePasteEvent);
  }, [isEditMode]);

  const handlePaste = async () => {
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
  };

  const handleManualPaste = () => {
    if (manualPasteText.trim()) {
      addToClipboard(manualPasteText.trim());
      setManualPasteText("");
      setShowPasteDialog(false);
    }
  };

  const addToClipboard = useCallback((text: string) => {
    setCurrentText(text);
    setCurrentImage(null);
  }, []);

  const toggleHistory = () => {
    setShowHistory((prev) => {
      const next = !prev;
      persist("clipboardShowHistory", next);
      return next;
    });
  };

  const selectHistoryItem = (item: ClipboardItem) => {
    if (item.type === "text") {
      setCurrentText(item.content);
      setCurrentImage(null);
    } else {
      setCurrentImage(item.content);
      setCurrentText("");
    }
    setShowHistory(false);
  };

  const handleClearText = () => {
    const latest = history[0];
    if (
      (currentText.trim() && latest?.content !== currentText.trim()) ||
      (currentImage && latest?.content !== currentImage)
    ) {
      const newItem: ClipboardItem = {
        id: Date.now().toString(),
        content: currentImage || currentText,
        timestamp: Date.now(),
        type: currentImage ? "image" : "text",
      };
      const updated = [newItem, ...history];
      setHistory(updated);
    }
    setCurrentText("");
    setCurrentImage(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
  };

  const toggleEditMode = () => {
    const next = !isEditMode;
    setIsEditMode(next);
    if (next) setTimeout(() => textareaRef.current?.focus(), 100);
  };

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
          onTextChange={setCurrentText}
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

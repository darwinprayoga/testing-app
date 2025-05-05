"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useActivity } from "@/contexts/activity-context";
import { useStorage } from "@/contexts/storage-context";
import { getRandomJokes } from "@/data/jokes";
import type { ClipboardItem, ClipboardProps } from "@/types/clipboard";
import { ClipboardContent } from "./clipboard-content";
import { ClipboardControls } from "./clipboard-controls";
import { ClipboardHistory } from "./clipboard-history";
import { ClipboardDialog } from "./clipboard-dialog";

export function Clipboard({ isMobile = false }: ClipboardProps) {
  const [currentText, setCurrentText] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showPasteDialog, setShowPasteDialog] = useState<boolean>(false);
  const [manualPasteText, setManualPasteText] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { recordActivity } = useActivity();
  const { currentLanguage } = useLanguage();
  const { getItem, setItem, removeItem, isStorageReady } = useStorage();

  // Load data from storage whenever the component is mounted or becomes visible
  useEffect(() => {
    const loadDataFromStorage = async () => {
      if (!isStorageReady) return;

      try {
        const savedText = await getItem("clipboardText");
        if (savedText) setCurrentText(savedText);

        const savedImage = await getItem("clipboardImage");
        if (savedImage) setCurrentImage(savedImage);

        const savedHistory = await getItem("clipboardHistory");

        if (savedHistory) {
          if (Array.isArray(savedHistory) && savedHistory.length > 0) {
            setHistory(savedHistory);
          } else {
            // Only load dummy data if there's no history AND no current text/image
            if (!savedText && !savedImage) {
              await loadDummyData();
            }
          }
        } else {
          // Only load dummy data if there's no saved history AND no current text/image
          if (!savedText && !savedImage) {
            await loadDummyData();
          }
        }

        const savedEditMode = await getItem("clipboardEditMode");
        setIsEditMode(savedEditMode);

        const savedShowHistory = await getItem("clipboardShowHistory");
        setShowHistory(savedShowHistory);
      } catch (error) {
        console.error("Error during initialization", error);
        // Only load dummy data if there's a serious error and no current content
        if (!currentText && !currentImage) {
          await loadDummyData();
        }
      }
    };

    loadDataFromStorage();
  }, [currentLanguage, isStorageReady, getItem, setItem]);

  // Track data initialization to prevent redundant loading
  const dataInitializedRef = useRef(false);
  
  // This effect ensures data is loaded whenever the component is mounted
  // And prevents loss of history when switching tabs
  useEffect(() => {
    // Force reload from storage when component mounts
    const reloadFromStorage = async () => {
      if (!isStorageReady) return;
      
      try {
        // Always get the latest data from storage
        const savedHistory = await getItem("clipboardHistory");
        if (savedHistory && Array.isArray(savedHistory) && savedHistory.length > 0) {
          setHistory(savedHistory);
          dataInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Error reloading data on mount", error);
      }
    };
    
    // Only reload if not initialized yet (prevents duplicate loading)
    if (!dataInitializedRef.current) {
      reloadFromStorage();
    }
    
    return () => {
      // We don't reset dataInitializedRef here to maintain state across tab switches
    };
  }, [isStorageReady, getItem]);

  // Helper function to load dummy data
  const loadDummyData = async () => {
    // Double-check storage first before loading dummy data
    if (isStorageReady) {
      try {
        // Check if we have any real data in storage
        const savedHistory = await getItem("clipboardHistory");
        const savedText = await getItem("clipboardText");
        const savedImage = await getItem("clipboardImage");
        
        // If any real data exists, use that instead of dummy data
        if (
          (savedHistory && Array.isArray(savedHistory) && savedHistory.length > 0) ||
          savedText ||
          savedImage ||
          history.length > 0 ||
          currentText || 
          currentImage
        ) {
          // We have real data, don't overwrite with dummy data
          if (savedHistory && Array.isArray(savedHistory) && savedHistory.length > 0) {
            setHistory(savedHistory);
          }
          return;
        }
      } catch (error) {
        console.error("Error checking for existing data", error);
      }
    }

    // Get culturally relevant jokes for the current language
    const jokeItems = getRandomJokes(currentLanguage, "clipboard", 4);

    // Set dummy data with jokes if no history exists
    const dummyHistory: ClipboardItem[] = jokeItems.map((joke, index) => ({
      id: (index + 1).toString(),
      content: joke.clipboardContent || "Example clipboard text",
      timestamp: Date.now() - (index + 1) * 3600000, // Staggered timestamps
      type: "text",
    }));

    setHistory(dummyHistory);

    if (isStorageReady) {
      setItem("clipboardHistory", dummyHistory);
    }
  };

  // Auto-focus on textarea when history is empty
  useEffect(() => {
    // Check if history is empty and there's no current text or image
    if (history.length === 0 && !currentText && !currentImage) {
      // Set edit mode to true to enable editing
      setIsEditMode(true);
      // Focus on the textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100); // Small delay to ensure the component is fully rendered
    }
  }, [history, currentText, currentImage]);

  // Handle clicks outside the textarea to remove focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Click was outside the container
        setIsEditMode(false);
      } else if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        // Click was inside the container but outside the textarea
        textareaRef.current.blur();
        setIsEditMode(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Save current text to storage whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("clipboardText", currentText);
  }, [currentText, isStorageReady, setItem]);

  // Save current image to storage whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;

    if (currentImage) {
      setItem("clipboardImage", currentImage);
    } else {
      removeItem("clipboardImage");
    }
  }, [currentImage, isStorageReady, setItem, removeItem]);

  // Save history to storage whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("clipboardHistory", history);
  }, [history, isStorageReady, setItem]);

  // Save edit mode state whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("clipboardEditMode", isEditMode);
  }, [isEditMode, isStorageReady, setItem]);

  // Save show history state whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("clipboardShowHistory", showHistory);
  }, [showHistory, isStorageReady, setItem]);

  // Handle paste events for both text and images
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (!isEditMode) return;

      // Check if we have image data
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];

          // If it's an image
          if (item.type.indexOf("image") !== -1) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageDataUrl = event.target?.result as string;
                setCurrentImage(imageDataUrl);
                setCurrentText("");

                // Add to history
                addToHistory(imageDataUrl, "image");
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      }
    };

    // Add the event listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener("paste", handlePasteEvent);
    }

    return () => {
      if (container) {
        container.removeEventListener("paste", handlePasteEvent);
      }
    };
  }, [isEditMode]);

  const handlePaste = async () => {
    try {
      // Try to get text from clipboard - this is more widely supported
      const text = await navigator.clipboard.readText();
      if (text) {
        addToClipboard(text);
        setCurrentImage(null);
        return;
      }
    } catch (error) {
      console.log(
        "Text clipboard access failed, trying manual paste dialog",
        error,
      );
    }

    // If text paste failed or returned empty, show the manual paste dialog
    setShowPasteDialog(true);
  };

  const handleManualPaste = () => {
    if (manualPasteText.trim()) {
      addToClipboard(manualPasteText);
      setManualPasteText("");
      setShowPasteDialog(false);
    }
  };

  const addToClipboard = (text: string) => {
    setCurrentText(text);
    setCurrentImage(null);
    // Add to history
    addToHistory(text, "text");
  };

  // New function to add items to history
  const addToHistory = (content: string, type: "text" | "image") => {
    if (!content) return;

    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: content,
      timestamp: Date.now(),
      type: type,
    };

    // Add to history and keep only the last 20 items
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);

    // Save to storage
    if (isStorageReady) {
      setItem("clipboardHistory", updatedHistory);
    }
  };

  const toggleHistory = () => {
    const newState = !showHistory;
    setShowHistory(newState);
    if (isStorageReady) {
      setItem("clipboardShowHistory", newState.toString());
    }
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
    // Save current content to history before clearing
    if (currentText.trim() || currentImage) {
      const newItem: ClipboardItem = {
        id: Date.now().toString(),
        content: currentImage || currentText,
        timestamp: Date.now(),
        type: currentImage ? "image" : "text",
      };

      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);

      // Save to storage
      if (isStorageReady) {
        setItem("clipboardHistory", updatedHistory);
      }

      // Record the clipboard clear activity
      recordActivity("clipboard_cleared");
    }

    // Clear the content
    setCurrentText("");
    setCurrentImage(null);

    // Focus on the textarea after clearing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);

    // Save to storage
    if (isStorageReady) {
      setItem("clipboardHistory", updatedHistory);
    }
  };

  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    if (newEditMode) {
      // Focus the textarea when entering edit mode
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`flex flex-col border rounded-lg overflow-hidden ${
          isMobile ? "h-[300px]" : "h-[400px]"
        }`}
        tabIndex={0} // Make the container focusable to capture paste events
        onClick={() => {
          // If there's no content and edit mode is true, focus the textarea
          if (!currentText && !currentImage) {
            focusTextarea();
            setIsEditMode(true);
          }
        }}
      >
        <ClipboardContent
          currentText={currentText}
          currentImage={currentImage}
          isEditMode={isEditMode}
          onTextChange={setCurrentText}
          onToggleEditMode={toggleEditMode}
          textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        />

        <ClipboardControls
          currentText={currentText}
          currentImage={currentImage}
          onToggleHistory={toggleHistory}
          onClear={handleClearText}
          onPaste={handlePaste}
          textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
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

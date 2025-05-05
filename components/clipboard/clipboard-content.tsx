"use client";

import type React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ClipboardContentProps {
  currentText: string;
  currentImage: string | null;
  isEditMode: boolean;
  onTextChange: (text: string) => void;
  onToggleEditMode: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function ClipboardContent({
  currentText,
  currentImage,
  isEditMode,
  onTextChange,
  onToggleEditMode,
  textareaRef,
}: ClipboardContentProps) {
  const { t } = useLanguage();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // If this is a paste operation (text length increased significantly)
    if (newText.length > currentText.length + 3) {
      // Add to history only if content is different from current
      if (newText !== currentText) {
        onTextChange(newText);
      }
    } else {
      // Regular typing
      onTextChange(newText);
    }
  };

  const handleKeyboardPaste = (e: React.KeyboardEvent) => {
    // Check for Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      // Let the browser handle the paste event naturally
      // We'll capture the result in the onChange event of the textarea
    }
  };

  return (
    <div className="flex-1 p-4 relative">
      {currentImage ? (
        <div className="h-full flex items-center justify-center overflow-auto">
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Pasted image"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={currentText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyboardPaste}
          placeholder={t("noContentPlaceholder")}
          className={`h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent ${
            !isEditMode ? "cursor-not-allowed" : ""
          }`}
          readOnly={!isEditMode}
        />
      )}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6 text-primary"
        onClick={onToggleEditMode}
      >
        <Pencil className={`h-4 w-4 ${isEditMode ? "text-green-500" : ""}`} />
      </Button>
    </div>
  );
}

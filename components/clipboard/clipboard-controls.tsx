"use client"

import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/components/ui/use-toast"
import { ClipboardClearDialog } from "./clipboard-clear-dialog"
import { copyImageToClipboard, createImageDownloadLink } from "@/utils/image-utils"

interface ClipboardControlsProps {
  currentText: string
  currentImage: string | null
  onToggleHistory: () => void
  onClear: () => void
  onPaste: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

export function ClipboardControls({
  currentText,
  currentImage,
  onToggleHistory,
  onClear,
  onPaste,
  textareaRef,
}: ClipboardControlsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const handleCopyOrPaste = async () => {
    if (currentText || currentImage) {
      // Copy functionality
      if (currentText) {
        try {
          await navigator.clipboard.writeText(currentText);
          toast({
            title: t("copiedToClipboard"),
            description: t("textCopiedSuccess"),
            duration: 2000,
          });
        } catch (err) {
          console.error("Failed to copy text: ", err);
          toast({
            title: t("copyFailed"),
            description: t("copyFailedDesc"),
            variant: "destructive",
          });
        }
      } else if (currentImage) {
        // Use the improved image utilities
        try {
          const success = await copyImageToClipboard(currentImage);
          
          if (success) {
            toast({
              title: t("imageCopied"),
              description: t("imageCopiedSuccess"),
              duration: 2000,
            });
          } else {
            // Fallback to download if copy failed
            const downloadLink = createImageDownloadLink(currentImage);
            
            if (downloadLink) {
              toast({
                title: t("imageDownloadFallback"),
                description: t("imageDownloadFallbackDesc"),
                duration: 5000,
                action: (
                  <Button onClick={downloadLink.download} size="sm" variant="outline">
                    {t("download")}
                  </Button>
                ),
              });
            } else {
              throw new Error("Failed to create download link");
            }
          }
        } catch (err) {
          console.error("Failed to handle image:", err);
          toast({
            title: t("copyFailed"),
            description: t("copyFailedDesc"),
            variant: "destructive",
          });
        }
      }
    } else {
      // Paste functionality - try to access clipboard
      try {
        // Try to get text from clipboard - this is more widely supported
        const text = await navigator.clipboard.readText();
        if (text) {
          onPaste();
          // Focus the textarea after pasting
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 100);
          return;
        }
      } catch (error) {
        console.log("Clipboard access failed, showing manual paste dialog", error);
        // If text paste failed or returned empty, use the fallback
        onPaste(); // This will show the manual paste dialog
      }

      // Focus the textarea after pasting
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }

  return (
    <>
      <div className="p-2 flex justify-between items-center border-t">
        <Button variant="ghost" size="sm" className="text-primary" onClick={onToggleHistory}>
          <History className="h-4 w-4 mr-2" />
          {t("history")}
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => setClearDialogOpen(true)}
            disabled={!currentText && !currentImage}
          >
            {t("clear")}
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary text-white" onClick={handleCopyOrPaste}>
            {currentText || currentImage ? t("copyAll") : t("paste")}
          </Button>
        </div>
      </div>

      <ClipboardClearDialog 
        open={clearDialogOpen} 
        onOpenChange={setClearDialogOpen} 
        onConfirm={onClear} 
      />
    </>
  )
}

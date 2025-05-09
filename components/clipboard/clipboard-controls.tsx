"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/components/ui/use-toast"

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

  const handleCopyOrPaste = () => {
    if (currentText || currentImage) {
      // Copy functionality
      if (currentText) {
        navigator.clipboard
          .writeText(currentText)
          .then(() => {
            toast({
              title: t("copiedToClipboard"),
              description: t("textCopiedSuccess"),
              duration: 2000,
            })
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err)
            toast({
              title: t("copyFailed"),
              description: t("copyFailedDesc"),
              variant: "destructive",
            })
          })
      } else if (currentImage) {
        // For images, we need to create a temporary canvas to get the image data
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            canvas.toBlob((blob) => {
              if (blob) {
                // Create a ClipboardItem and write to clipboard
                const item = new ClipboardItem({ "image/png": blob })
                navigator.clipboard
                  .write([item])
                  .then(() => {
                    toast({
                      title: t("imageCopied"),
                      description: t("imageCopiedSuccess"),
                      duration: 2000,
                    })
                  })
                  .catch((err) => {
                    console.error("Failed to copy image: ", err)
                    toast({
                      title: t("copyFailed"),
                      description: t("copyFailedDesc"),
                      variant: "destructive",
                    })
                  })
              }
            })
          }
        }
        img.onerror = () => {
          toast({
            title: t("copyFailed"),
            description: t("copyFailedDesc"),
            variant: "destructive",
          })
        }
        img.src = currentImage
      }
    } else {
      // Original paste functionality
      onPaste()
      // Focus the textarea after pasting
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
    }
  }

  return (
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
          onClick={onClear}
          disabled={!currentText && !currentImage}
        >
          {t("clear")}
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary text-white" onClick={handleCopyOrPaste}>
          {currentText || currentImage ? t("copyAll") : t("paste")}
        </Button>
      </div>
    </div>
  )
}

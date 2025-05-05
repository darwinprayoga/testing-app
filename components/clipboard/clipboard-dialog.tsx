"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ClipboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manualPasteText: string
  onManualPasteTextChange: (text: string) => void
  onManualPaste: () => void
}

export function ClipboardDialog({
  open,
  onOpenChange,
  manualPasteText,
  onManualPasteTextChange,
  onManualPaste,
}: ClipboardDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("manualPaste")}</DialogTitle>
          <DialogDescription>{t("manualDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("clipboardNote")}</p>
        </div>

        <Textarea
          value={manualPasteText}
          onChange={(e) => onManualPasteTextChange(e.target.value)}
          placeholder={t("pasteContent")}
          className="min-h-[100px]"
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onManualPaste}>{t("addToClipboard")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

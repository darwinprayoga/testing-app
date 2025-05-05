"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import type { ResetDataDialogProps } from "./types"

export function ResetDataDialog({ open, onOpenChange, onReset }: ResetDataDialogProps) {
  const { t } = useLanguage()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("resetAllData")}</AlertDialogTitle>
          <AlertDialogDescription>{t("resetConfirmation")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-md mt-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">{t("resetWarning")}</div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onReset} className="bg-red-500 hover:bg-red-600">
            {t("resetAllData")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

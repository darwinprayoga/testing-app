"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"

interface TodoEtaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate: Date
  onSave: (date: Date) => void
}

export function TodoEtaDialog({ open, onOpenChange, initialDate, onSave }: TodoEtaDialogProps) {
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)
  const [selectedTime, setSelectedTime] = useState<string>(format(initialDate, "HH:mm"))

  // Update the selected date and time when the initial date changes
  useEffect(() => {
    setSelectedDate(initialDate)
    setSelectedTime(format(initialDate, "HH:mm"))
  }, [initialDate])

  const handleSave = () => {
    if (!selectedDate) return

    const dateWithTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":").map(Number)
    dateWithTime.setHours(hours, minutes)

    onSave(dateWithTime)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-min">
        <DialogHeader>
          <DialogTitle>{t("setEta")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
          </div>
          <div className="grid gap-2">
            <label htmlFor="time" className="text-sm font-medium">
              {t("time")}
            </label>
            <input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="flex h-10 w-max rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 md:gap-0">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { autoResizeTextarea } from "@/utils/todo-utils"

interface TodoFormProps {
  onAddTask: (text: string) => void
  onCancel: () => void
}

export function TodoForm({ onAddTask, onCancel }: TodoFormProps) {
  const { t } = useLanguage()
  const [newTaskText, setNewTaskText] = useState<string>("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSubmit = () => {
    if (newTaskText.trim()) {
      onAddTask(newTaskText)
      setNewTaskText("")
    }
  }

  return (
    <div className="mt-2 flex items-start gap-2 p-1">
      <textarea
        ref={textareaRef}
        value={newTaskText}
        onChange={(e) => {
          setNewTaskText(e.target.value)
          // Auto-resize the textarea
          autoResizeTextarea(e.target)
        }}
        placeholder={t("enterTask")}
        className="flex-1 min-h-[36px] p-2 rounded-md border border-input bg-transparent text-sm resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-ring"
        onKeyDown={(e) => {
          // Allow Enter to create a new line
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        rows={1}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit}>
          {t("addTask")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  )
}

"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Check, Archive, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/language-context";
import type { TodoItem } from "@/types/todo";
import {
  formatEta,
  validatePriorityInput,
  autoResizeTextarea,
} from "@/utils/todo-utils";

interface TodoItemProps {
  todo: TodoItem;
  activeTab: string;
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onOpenEtaDialog: (id: string) => void;
  showSelection?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function TodoItemComponent({
  todo,
  activeTab,
  onToggleComplete,
  onArchive,
  onRestore,
  onDelete,
  onUpdateText,
  onUpdateDescription,
  onUpdatePriority,
  onOpenEtaDialog,
  showSelection = false,
  isSelected = false,
  onToggleSelection = () => {},
}: TodoItemProps) {
  const { t }: any = useLanguage();
  const [editingField, setEditingField] = useState<"text" | "priority" | null>(
    null,
  );
  const [editValue, setEditValue] = useState<string>("");
  const [deletingId, setDeletingId] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // auto resize realtime
  useEffect(() => {
    autoResizeTextarea(textareaRef.current);
  }, [editValue, editingField]);

  useEffect(() => {
    autoResizeTextarea(descRef.current);
  }, [todo.description]);

  // Start editing a field
  const startEditing = (field: "text" | "priority", value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  // Save edited value
  const saveEditing = () => {
    if (!editingField) return;

    if (editingField === "priority") {
      // Check if priority is a number or "-"
      if (editValue !== "-" && isNaN(Number(editValue))) {
        // If not a valid priority, cancel editing
        cancelEditing();
        return;
      }
      onUpdatePriority(todo.id, editValue);
    } else if (editingField === "text") {
      onUpdateText(todo.id, editValue);
    }

    cancelEditing();
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
  };

  // Handle key press in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && editingField === "priority") {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  // Handle description key down
  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // Allow Enter to create a new line without requiring Shift
    if (e.key === "Enter") {
      // Don't prevent default to allow the new line
      return;
    }
  };

  const eta = formatEta(todo.createdAt, t);

  return (
    <tr className={`border-b border-muted ${isSelected ? "bg-muted/50" : ""}`}>
      {showSelection && (
        <td className="py-2 align-top text-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="mt-1"
          />
        </td>
      )}
      <td className="py-2 align-top">
        {editingField === "priority" ? (
          <Input
            value={editValue}
            onChange={(e) => {
              // Apply validation to only allow numbers
              const validatedValue = validatePriorityInput(e.target.value);
              setEditValue(validatedValue);
            }}
            onBlur={saveEditing}
            onKeyDown={handleEditKeyDown}
            className="w-8 h-6 p-1 text-center"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
          />
        ) : (
          <div
            className="cursor-pointer hover:bg-muted rounded px-1 text-center"
            onClick={() => startEditing("priority", todo.priority)}
          >
            {todo.priority}
          </div>
        )}
      </td>
      <td className="py-2 align-top">
        <div className="flex flex-col gap-1">
          {editingField === "text" ? (
            <textarea
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                // Auto-resize the textarea
                autoResizeTextarea(e.target);
              }}
              onBlur={saveEditing}
              onKeyDown={handleEditKeyDown}
              className="w-full min-h-[24px] p-1 rounded border border-input bg-transparent text-sm resize-none overflow-hidden"
              autoFocus
              rows={1}
              ref={textareaRef}
            />
          ) : (
            <div
              className={`cursor-pointer hover:bg-muted rounded px-1 break-words whitespace-pre-wrap ${
                !todo.text && "text-muted-foreground"
              }`}
              onClick={() => startEditing("text", todo.text)}
            >
              <span
                className={
                  todo.completed ? "line-through text-muted-foreground" : ""
                }
              >
                {todo.text ? todo.text : t("enterTask")}
              </span>
            </div>
          )}

          {/* Description textarea field */}
          <textarea
            value={todo.description}
            onChange={(e) => {
              onUpdateDescription(todo.id, e.target.value);
              // Auto-resize the textarea
              autoResizeTextarea(e.target);
            }}
            onKeyDown={handleDescriptionKeyDown}
            placeholder={t("addDescription")}
            className="text-xs text-muted-foreground px-1 py-0.5 bg-transparent border-none focus:outline-none focus:ring-0 w-full resize-none overflow-hidden min-h-[20px]"
            rows={1}
            ref={descRef}
          />
        </div>
      </td>
      <td className="py-2 text-right align-top">
        <div className="flex flex-col items-end gap-1">
          {activeTab === "active" ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground flex-shrink-0 border"
                onClick={() => onArchive(todo.id)}
                title={t("archived")}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${
                  todo.completed ? "text-green-500" : "text-muted-foreground"
                } flex-shrink-0 border`}
                onClick={() => onToggleComplete(todo.id)}
                title={
                  todo.completed ? "Mark as incomplete" : "Mark as complete"
                }
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              {deletingId ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 flex-shrink-0"
                    onClick={() => {
                      onDelete(todo.id);
                      setDeletingId(false);
                    }}
                    title="Confirm Delete"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground flex-shrink-0"
                    onClick={() => setDeletingId(false)}
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-500 flex-shrink-0"
                    onClick={() => onRestore(todo.id)}
                    title="Restore"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 flex-shrink-0"
                    onClick={() => setDeletingId(true)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ETA display */}
          <div
            className={`text-xs cursor-pointer ${
              eta.isUrgent
                ? "text-red-500 font-medium"
                : "text-muted-foreground"
            } whitespace-normal break-words`}
            onClick={() => onOpenEtaDialog(todo.id)}
          >
            {eta.text}
          </div>
        </div>
      </td>
    </tr>
  );
}

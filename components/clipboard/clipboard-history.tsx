"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ImageIcon, Trash2 } from "lucide-react"
import type { ClipboardItem } from "@/types/clipboard"

interface ClipboardHistoryProps {
  history: ClipboardItem[]
  onSelectItem: (item: ClipboardItem) => void
  onDeleteItem: (id: string) => void
  show: boolean
}

export function ClipboardHistory({ history, onSelectItem, onDeleteItem, show }: ClipboardHistoryProps) {
  if (!show) return null

  return (
    <div className="border-t">
      <ScrollArea className="h-[200px]">
        {history.map((item) => (
          <div key={item.id} className="p-2 hover:bg-muted cursor-pointer relative" onClick={() => onSelectItem(item)}>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                {item.type === "image" && <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <div className="text-sm truncate max-w-full">
                  {item.type === "text"
                    ? item.content.length > 50
                      ? `${item.content.substring(0, 50)}...`
                      : item.content
                    : "Image"}
                </div>
              </div>
              <button
                className="p-1 rounded-full hover:bg-muted-foreground/20 flex-shrink-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteItem(item.id)
                }}
                title="Delete from history"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(item.timestamp).toLocaleString()}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}

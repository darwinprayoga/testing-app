export interface ClipboardItem {
  id: string
  content: string
  timestamp: number
  type: "text" | "image"
}

export interface ClipboardProps {
  isMobile?: boolean
}

// Todo item interface
export interface TodoItem {
  id: string
  text: string
  description: string
  completed: boolean
  archived: boolean
  priority: string
  createdAt: number
}

// ETA format return type
export interface EtaFormat {
  text: string
  isUrgent: boolean
}

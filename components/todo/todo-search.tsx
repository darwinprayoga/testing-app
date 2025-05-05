"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { useStorage } from "@/contexts/storage-context"

interface TodoSearchProps {
  onSearch: (searchTerm: string) => void
  onFilterChange: (priority: string) => void
  disabled?: boolean
}

export function TodoSearch({ 
  onSearch, 
  onFilterChange,
  disabled = false 
}: TodoSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [priority, setPriority] = useState("all")
  const { t } = useLanguage()
  const { getItem, setItem, isStorageReady } = useStorage()

  // Load search state
  useEffect(() => {
    const loadSearch = async () => {
      if (!isStorageReady) return

      try {
        const savedSearch = await getItem("todoSearchTerm")
        if (savedSearch) setSearchTerm(savedSearch)

        const savedPriority = await getItem("todoPriorityFilter")
        if (savedPriority) setPriority(savedPriority)
      } catch (error) {
        console.error("Error loading search state:", error)
      }
    }

    loadSearch()
  }, [isStorageReady, getItem])

  // Save search state when it changes
  useEffect(() => {
    if (!isStorageReady) return

    setItem("todoSearchTerm", searchTerm)
    setItem("todoPriorityFilter", priority)
  }, [searchTerm, priority, isStorageReady, setItem])

  // Trigger search when terms change
  useEffect(() => {
    onSearch(searchTerm)
  }, [searchTerm, onSearch])

  // Trigger filter when priority changes
  useEffect(() => {
    onFilterChange(priority)
  }, [priority, onFilterChange])

  const handleClear = () => {
    setSearchTerm("")
    setPriority("all")
  }

  return (
    <div className="flex flex-col gap-2 p-2 border-b">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchTasks")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={disabled}
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1.5 h-5 w-5 p-0"
              onClick={() => setSearchTerm("")}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select 
          value={priority} 
          onValueChange={setPriority}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPriorities")}</SelectItem>
            <SelectItem value="-">{t("noPriority")}</SelectItem>
            <SelectItem value="1">{t("high")}</SelectItem>
            <SelectItem value="2">{t("medium")}</SelectItem>
            <SelectItem value="3">{t("low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {(searchTerm || priority !== "all") && (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            disabled={disabled}
          >
            {t("clearFilters")}
          </Button>
        </div>
      )}
    </div>
  )
}

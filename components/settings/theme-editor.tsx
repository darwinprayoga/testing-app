"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shuffle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ThemeEditorProps {
  customTheme: {
    name: string
    background: string
    main: string
    mainHover: string
    text: string
    subtext: string
    border: string
    card: string
    accent: string
  }
  setCustomTheme: (theme: any) => void
  isEditingTheme: boolean
  onCancel: () => void
  onSave: () => void
  generateRandomTheme: () => void
  generateRandomThemeName: () => void
}

export function ThemeEditor({
  customTheme,
  setCustomTheme,
  isEditingTheme,
  onCancel,
  onSave,
  generateRandomTheme,
  generateRandomThemeName,
}: ThemeEditorProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{isEditingTheme ? t("editTheme") : t("createCustomTheme")}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            generateRandomTheme()
            generateRandomThemeName()
          }}
          className="flex items-center gap-1"
        >
          <Shuffle className="h-4 w-4" />
          {t("randomize")}
        </Button>
      </div>

      <div className="mt-4">
        <Label htmlFor="theme-name" className="text-sm font-medium">
          {t("themeName")}
        </Label>
        <Input
          id="theme-name"
          value={customTheme.name}
          onChange={(e) => setCustomTheme({ ...customTheme, name: e.target.value })}
          placeholder="Theme name"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="background-color">{t("background")}</Label>
          <div className="flex space-x-2">
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: customTheme.background }} />
            <Input
              id="background-color"
              value={customTheme.background}
              onChange={(e) => setCustomTheme({ ...customTheme, background: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="main-color">{t("mainColor")}</Label>
          <div className="flex space-x-2">
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: customTheme.main }} />
            <Input
              id="main-color"
              value={customTheme.main}
              onChange={(e) => setCustomTheme({ ...customTheme, main: e.target.value, accent: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button onClick={onSave}>{isEditingTheme ? t("updateTheme") : t("saveTheme")}</Button>
      </div>
    </div>
  )
}

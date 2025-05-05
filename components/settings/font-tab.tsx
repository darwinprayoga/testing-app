"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileSlidersIcon as SliderIcon, Star } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { useLanguage } from "@/contexts/language-context"
import { useFont } from "@/contexts/font-context"
import { FontButton } from "./font-button"

interface FontTabProps {
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function FontTab({ searchQuery, onSearchChange }: FontTabProps) {
  const { t } = useLanguage()
  const {
    currentFont,
    setFont,
    availableFonts,
    favorites: fontFavorites,
    toggleFavorite,
    fontSize,
    setFontSize,
    availableSizes,
  } = useFont()

  const filteredFonts = availableFonts.filter((font) => font.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const favoriteFonts = availableFonts.filter((font) => fontFavorites.includes(font.name))

  return (
    <>
      <div className="mb-4 relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("searchFonts")} value={searchQuery} onChange={onSearchChange} className="pl-8" />
      </div>

      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">{t("fontSize")}</Label>
        <div className="flex items-center gap-4">
          <SliderIcon className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[fontSize.size]}
            min={12}
            max={24}
            step={1}
            className="flex-1"
            onValueChange={(value) => {
              const size = value[0]
              const closestSize = availableSizes.reduce((prev, curr) => {
                return Math.abs(curr.size - size) < Math.abs(prev.size - size) ? curr : prev
              })
              setFontSize(closestSize)
            }}
          />
          <span className="text-sm font-medium w-8 text-center">{fontSize.size}px</span>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">{t("allFonts")}</TabsTrigger>
          <TabsTrigger value="favorites">{t("favorites")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-2">
          <ScrollArea className="h-[350px] pr-4">
            <div className="grid grid-cols-1 gap-3 p-1">
              {filteredFonts.map((font) => (
                <FontButton
                  key={font.name}
                  font={font}
                  isActive={currentFont.name === font.name}
                  isFavorite={fontFavorites.includes(font.name)}
                  onSelect={() => setFont(font)}
                  onFavorite={() => toggleFavorite(font.name)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="mt-2">
          <ScrollArea className="h-[350px] pr-4">
            {favoriteFonts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Star className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("noFavorites")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the star icon on any font to add it to your favorites
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-1">
                {favoriteFonts.map((font) => (
                  <FontButton
                    key={font.name}
                    font={font}
                    isActive={currentFont.name === font.name}
                    isFavorite={true}
                    onSelect={() => setFont(font)}
                    onFavorite={() => toggleFavorite(font.name)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  )
}

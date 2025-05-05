"use client"

import { Button } from "@/components/ui/button"
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function LanguageTab() {
  const { t, currentLanguage, setLanguage, availableLanguages } = useLanguage()

  return (
    <>
      <DrawerHeader className="mb-4 px-0">
        <DrawerTitle>{t("languageSettings")}</DrawerTitle>
        <DrawerDescription>{t("chooseLanguage")}</DrawerDescription>
      </DrawerHeader>
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-4">
          {Object.entries(availableLanguages).map(([code, language]) => (
            <Button
              key={code}
              variant="outline"
              className={`w-full justify-between ${currentLanguage === code ? "border-primary" : ""}`}
              onClick={() => setLanguage(code)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-sm text-muted-foreground">({language.name})</span>
              </div>
              {currentLanguage === code && <Check className="h-4 w-4 text-primary" />}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  )
}

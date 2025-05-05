"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

interface LoadingScreenProps {
  onLoadingComplete?: () => void
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const { t } = useLanguage()

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          if (onLoadingComplete) {
            setTimeout(() => {
              onLoadingComplete()
            }, 200) // Small delay after reaching 100%
          }
          return 100
        }
        return prevProgress + 10
      })
    }, 100) // Update every 100ms to complete in ~1 second

    return () => clearInterval(interval)
  }, [onLoadingComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--app-background)]">
      <div className="flex flex-col items-center space-y-6">
        {/* Clipbored Logo */}
        <div className="relative">
          <Image src="/logo.svg" alt="Clipbored Logo" width={200} height={40} className="logo-image" />
          <div className="absolute -top-1 -right-12 flex items-center justify-center px-2 py-0.5 rounded-full border border-primary bg-primary/10">
            <span className="text-xs font-semibold text-primary">BETA</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Loading text */}
        <div className="text-sm text-muted-foreground">{t("loading")}...</div>

        {/* By PRAYOGA.io */}
        <div className="flex items-center gap-2 mt-8">
          <span className="text-sm text-muted-foreground">{t("poweredBy")}</span>
          <div className="flex items-center">
            <span className="font-medium">PRAYOGA.io</span>
          </div>
        </div>
      </div>
    </div>
  )
}

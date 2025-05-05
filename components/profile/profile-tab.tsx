"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import type { ProfileTabProps } from "./types"

export function ProfileTab({
  user,
  updateProfile,
  handleGoogleLogin,
  togglePremium,
  usernameError,
  setUsernameError,
}: ProfileTabProps) {
  const { t } = useLanguage()
  const [username, setUsername] = useState(user.username)

  // Update local state when user prop changes
  useEffect(() => {
    setUsername(user.username)
  }, [user.username])

  // Username validation
  const validateUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/

    if (!value.trim()) {
      setUsernameError(t("usernameRequired"))
      return false
    }

    if (!usernameRegex.test(value)) {
      setUsernameError(t("usernameInvalid"))
      return false
    }

    setUsernameError(null)
    return true
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)

    // Validate on change but don't update the profile yet
    validateUsername(value)
  }

  const handleUsernameBlur = () => {
    if (validateUsername(username)) {
      updateProfile("username", username)
    }
  }

  if (user.isLoggedIn) {
    return (
      <div className="pb-0">
        <div className="flex justify-center mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="text-2xl bg-primary text-white">
              {user.username
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username" className="flex items-center gap-1">
              {t("username")}
              {usernameError && <span className="text-xs text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id="username"
              value={username}
              onChange={handleUsernameChange}
              onBlur={handleUsernameBlur}
              placeholder={t("yourUsername")}
              className={usernameError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
            <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              value={user.email}
              onChange={(e) => updateProfile("email", e.target.value)}
              placeholder={t("yourEmail")}
              type="email"
              disabled
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h4 className="text-sm font-medium">{t("premiumStatus")}</h4>
              <p className="text-xs text-muted-foreground">
                {user.hasPremium ? t("activeSubscription") : t("noActiveSubscription")}
              </p>
            </div>
            <Button variant={user.hasPremium ? "outline" : "default"} size="sm" onClick={togglePremium}>
              {user.hasPremium ? t("cancelPremium") : t("upgradeToPremium")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <Button onClick={handleGoogleLogin} className="w-full mb-4 flex items-center gap-2 justify-center">
        <Image src="/google.svg" alt="Google" width={18} height={18} />
        {t("continueWith")}
      </Button>
      <p className="text-sm text-muted-foreground text-center mt-4">{t("termsDesc")}</p>
    </div>
  )
}

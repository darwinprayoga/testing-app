"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Copy,
  Check,
  Globe,
  Lock,
  UserPlus,
  X,
  CircleUserRound,
  Users,
  Mail,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import { useActivity } from "@/contexts/activity-context";

type AccessLevel = "editor" | "viewer" | "commenter";

interface SharedUser {
  id: string;
  name: string;
  email: string;
  access: AccessLevel;
  image?: string;
}

const initialUsers: SharedUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    access: "editor",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    access: "viewer",
  },
];

export function ShareDrawer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shareAccess, setShareAccess] = useState<"restricted" | "anyone">(
    "restricted",
  );
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [newUserAccess, setNewUserAccess] = useState<AccessLevel>("viewer");
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(initialUsers);

  const { getItem, setItem, isStorageReady } = useStorage();
  const { recordActivity, getLastActivity } = useActivity();
  const { t } = useLanguage();

  const initializedRef = useRef(false);

  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;
    getItem("shareDrawerOpen").then((savedState) => {
      if (savedState) setIsDrawerOpen(savedState);
    });
  }, [isStorageReady, getItem]);

  useEffect(() => {
    if (isStorageReady) setItem("shareDrawerOpen", isDrawerOpen);
  }, [isDrawerOpen, isStorageReady, setItem]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const lastShareAccess = getLastActivity("share_access");
    const lastSharedUsers = getLastActivity("shared_users");

    if (lastShareAccess?.details?.shareAccess) {
      setShareAccess(lastShareAccess.details.shareAccess);
    }

    if (lastSharedUsers?.details?.sharedUsers) {
      setSharedUsers(lastSharedUsers.details.sharedUsers);
    }
  }, [getLastActivity]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleAddUser = useCallback(() => {
    if (!email.includes("@") || sharedUsers.some((u) => u.email === email))
      return;

    const newUser: SharedUser = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      access: newUserAccess,
    };

    const updatedUsers = [...sharedUsers, newUser];
    setSharedUsers(updatedUsers);
    recordActivity("shared_users", { sharedUsers: updatedUsers });
    setEmail("");
  }, [email, newUserAccess, sharedUsers, recordActivity]);

  const handleRemoveUser = useCallback(
    (id: string) => {
      const updatedUsers = sharedUsers.filter((u) => u.id !== id);
      setSharedUsers(updatedUsers);
      recordActivity("shared_users", { sharedUsers: updatedUsers });
    },
    [sharedUsers, recordActivity],
  );

  const updateUserAccess = useCallback(
    (id: string, access: AccessLevel) => {
      const updatedUsers = sharedUsers.map((user) =>
        user.id === id ? { ...user, access } : user,
      );
      setSharedUsers(updatedUsers);
      recordActivity("shared_users", { sharedUsers: updatedUsers });
    },
    [sharedUsers, recordActivity],
  );

  const handleShareAccess = useCallback(
    (v: "restricted" | "anyone") => {
      setShareAccess(v);
      recordActivity("share_access", { shareAccess: v });
    },
    [recordActivity],
  );

  const isEmailValid = useMemo(
    () => email.includes("@") && !sharedUsers.some((u) => u.email === email),
    [email, sharedUsers],
  );

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <button
          aria-label={"Share"}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <Link2 className="h-5 w-5 text-primary" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("shareTitle")}</DrawerTitle>
            <DrawerDescription>{t("shareDesc")}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("addPeople")}
                  className="pl-9 pr-24"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                />
                <Select
                  value={newUserAccess}
                  onValueChange={(v: AccessLevel) => setNewUserAccess(v)}
                >
                  <SelectTrigger className="absolute right-1 top-1 w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">{t("viewer")}</SelectItem>
                    <SelectItem value="commenter">{t("commenter")}</SelectItem>
                    <SelectItem value="editor">{t("editor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddUser}
                disabled={!isEmailValid}
                aria-label={"Add"}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("peopleWithAccess")}
              </h4>
              <ScrollArea className="h-[180px] rounded-md border">
                <div className="p-4 space-y-3">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.access}
                          onValueChange={(value: AccessLevel) =>
                            updateUserAccess(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              {t("viewer")}
                            </SelectItem>
                            <SelectItem value="commenter">
                              {t("commenter")}
                            </SelectItem>
                            <SelectItem value="editor">
                              {t("editor")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveUser(user.id)}
                          aria-label={"Remove"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">{t("generalAccess")}</h4>
              <RadioGroup value={shareAccess} onValueChange={handleShareAccess}>
                {[
                  {
                    value: "restricted",
                    icon: <Lock className="h-4 w-4" />,
                    label: t("restricted"),
                    description: t("restrictedDesc"),
                  },
                  {
                    value: "anyone",
                    icon: <Globe className="h-4 w-4" />,
                    label: t("anyone"),
                    description: t("anyoneDesc"),
                  },
                ].map(({ value, icon, label, description }) => (
                  <div key={value} className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value={value} id={value} />
                    <Label
                      htmlFor={value}
                      className="font-normal flex items-center gap-2"
                    >
                      {icon}
                      <div>
                        <p>{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-8">
              <div className="flex-1 flex items-center gap-2 rounded-md border p-2 pr-4">
                <CircleUserRound className="h-4 w-4 ml-1 text-primary" />
                <input
                  className="flex-1 bg-transparent text-sm border-none outline-none"
                  value={currentUrl}
                  readOnly
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                aria-label={"CopyLink"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={() => setIsDrawerOpen(false)}>{t("done")}</Button>
            <DrawerClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

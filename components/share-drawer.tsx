"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

type AccessLevel = "editor" | "viewer" | "commenter";

interface SharedUser {
  id: string;
  name: string;
  email: string;
  access: AccessLevel;
  image?: string;
}

export function ShareDrawer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shareAccess, setShareAccess] = useState<"restricted" | "anyone">(
    "restricted",
  );
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [newUserAccess, setNewUserAccess] = useState<AccessLevel>("viewer");

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
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
  ]);

  const { getItem, setItem, isStorageReady } = useStorage();

  useEffect(() => {
    const loadSharingState = async () => {
      if (!isStorageReady) return;

      const savedDrawerState = await getItem("shareDrawerOpen");
      if (savedDrawerState !== null) {
        setIsDrawerOpen(savedDrawerState === "true");
      }

      const savedShareAccess = await getItem("shareAccess");
      if (savedShareAccess !== null) {
        setShareAccess(savedShareAccess as "restricted" | "anyone");
      }

      const savedSharedUsers = await getItem("sharedUsers");
      if (savedSharedUsers !== null) {
        try {
          setSharedUsers(savedSharedUsers);
        } catch (e) {
          console.error("Failed to parse sharedUsers:", e);
        }
      }
    };

    loadSharingState();
  }, [isStorageReady, getItem]);

  // Add these to save state whenever it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("shareDrawerOpen", isDrawerOpen.toString());
    }
  }, [isDrawerOpen, isStorageReady, setItem]);

  useEffect(() => {
    if (isStorageReady) {
      setItem("shareAccess", shareAccess);
    }
  }, [shareAccess, isStorageReady, setItem]);

  useEffect(() => {
    if (isStorageReady) {
      setItem("sharedUsers", sharedUsers);
    }
  }, [sharedUsers, isStorageReady, setItem]);

  const dummyShareLink = "https://clipbored.app/share/83f029ac";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dummyShareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddUser = () => {
    if (!email || !email.includes("@")) return;

    const newUser: SharedUser = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email: email,
      access: newUserAccess,
    };

    setSharedUsers([...sharedUsers, newUser]);
    setEmail("");
  };

  const handleRemoveUser = (id: string) => {
    setSharedUsers(sharedUsers.filter((user) => user.id !== id));
  };

  const updateUserAccess = (id: string, access: AccessLevel) => {
    setSharedUsers(
      sharedUsers.map((user) => (user.id === id ? { ...user, access } : user)),
    );
  };

  const { t } = useLanguage();

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <button className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
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
                  onValueChange={(value: AccessLevel) =>
                    setNewUserAccess(value)
                  }
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
              <Button size="sm" variant="secondary" onClick={handleAddUser}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("peopleWithAccess")}
              </h4>
              <ScrollArea className="h-[180px] rounded-md border">
                <div className="p-4">
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
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="commenter">Commenter</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveUser(user.id)}
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
              <RadioGroup
                value={shareAccess}
                onValueChange={(v: "restricted" | "anyone") =>
                  setShareAccess(v)
                }
              >
                <div className="flex items-start space-x-2 mb-3">
                  <RadioGroupItem value="restricted" id="restricted" />
                  <Label
                    htmlFor="restricted"
                    className="font-normal flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    <div>
                      <p>{t("restricted")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("restrictedDesc")}
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="anyone" id="anyone" />
                  <Label
                    htmlFor="anyone"
                    className="font-normal flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    <div>
                      <p>{t("anyone")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("anyoneDesc")}
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-8">
              <div className="flex-1 flex items-center gap-2 rounded-md border p-2 pr-4">
                <CircleUserRound className="h-4 w-4 ml-1 text-primary" />
                <input
                  className="flex-1 bg-transparent text-sm border-none outline-none"
                  value={dummyShareLink}
                  readOnly
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
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

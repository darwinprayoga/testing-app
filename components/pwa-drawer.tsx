"use client";

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
import { Download, Smartphone, Laptop, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import { PWAInstallElement } from "@khmyznikov/pwa-install";
import PWAInstall from "@khmyznikov/pwa-install/react-legacy";

export function PwaDrawer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();
  const { getItem, setItem, isStorageReady } = useStorage();

  // Load drawer state from storage when ready
  useEffect(() => {
    const loadDrawerState = async () => {
      if (!isStorageReady) return;

      try {
        const savedState = await getItem("pwaDrawerOpen");
        if (savedState) {
          setIsDrawerOpen(savedState);
        }
      } catch (error) {
        console.error("Error loading drawer state:", error);
      }
    };

    loadDrawerState();
  }, [isStorageReady, getItem]);

  // Save drawer state to storage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("pwaDrawerOpen", isDrawerOpen);
    }
  }, [isDrawerOpen, isStorageReady, setItem]);

  // pwa config
  const pwaInstallRef = useRef<PWAInstallElement>(null);

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <PWAInstall
        ref={pwaInstallRef}
        name={"Clipbored"}
        icon={"/logo.svg"}
        onPwaInstallAvailableEvent={(event) => console.log(event)}
      ></PWAInstall>

      {pwaInstallRef.current?.isInstallAvailable && (
        <DrawerTrigger asChild>
          <button className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <Download className="h-5 w-5 text-primary" />
          </button>
        </DrawerTrigger>
      )}

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{t("installApp")}</DrawerTitle>
            <DrawerDescription>{t("installDesc")}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <Smartphone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="text-sm font-semibold">
                    {t("installMobile")}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("mobileSteps")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border p-4">
                <Laptop className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="text-sm font-semibold">
                    {t("installDesktop")}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("desktopSteps")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {t("installInfo")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="mt-4">
            {/* {isInstallable && ( */}
            <Button
              onClick={() => {
                pwaInstallRef.current?.showDialog(true);
                setIsDrawerOpen(false);
              }}
            >
              {t("tryInstall")}
            </Button>
            {/* )} */}
            <DrawerClose asChild>
              <Button variant="outline">{t("maybeLater")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

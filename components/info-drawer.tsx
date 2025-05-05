"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { useEffect } from "react";
import { useStorage } from "@/contexts/storage-context";

interface InfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoDrawer({ open, onOpenChange }: InfoDrawerProps) {
  const { t } = useLanguage();
  const { getItem, setItem, isStorageReady } = useStorage();

  // Load drawer state from storage on mount
  useEffect(() => {
    const loadDrawerState = async () => {
      if (isStorageReady) {
        const savedDrawerState = await getItem("infoDrawerOpen");
        if (savedDrawerState !== null) {
          onOpenChange(savedDrawerState === "true");
        }
      }
    };
    loadDrawerState();
  }, [onOpenChange, getItem, isStorageReady]);

  // Save drawer state to storage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("infoDrawerOpen", open.toString());
    }
  }, [open, setItem, isStorageReady]);

  const whatsappMessage = encodeURIComponent(
    "Hello PRAYOGA.io team, I'm interested in the Clipbored project and would like to discuss investment opportunities. Here are my details:\n\nName: \nCompany: \nEmail: \nInvestment Interest: \n\nLooking forward to your response!",
  );

  const whatsappLink = `https://api.whatsapp.com/send?phone=628978600340&text=${whatsappMessage}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Clipbored Logo"
                width={120}
                height={20}
                className="logo-image"
              />
              <div className="flex items-center justify-center px-2 py-0.5 rounded-full border border-primary bg-primary/10">
                <span className="text-xs font-semibold text-primary">BETA</span>
              </div>
            </DrawerTitle>
            <DrawerDescription>{t("appInfoDescription")}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="space-y-6">
              {/* Developer Information */}
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-2">{t("developedBy")}</h3>
                <Link
                  href="https://prayoga.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
                >
                  <Image
                    src="/prayoga-io.svg"
                    alt="PRAYOGA.io Logo"
                    width={120}
                    height={20}
                    className="logo-image"
                  />
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("developmentDetails")}
                </p>
              </div>

              {/* Beta Information */}
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-2">{t("betaVersion")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("betaDescription")}
                </p>

                <div className="mt-4 space-y-3">
                  <Link
                    href="https://discord.com/invite/nRzwh5vQTf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        width="22"
                        height="17"
                        viewBox="0 0 22 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18.0814 2.03143C16.7205 1.40673 15.2843 0.961261 13.8088 0.706178C13.7954 0.703677 13.7815 0.705467 13.7692 0.711293C13.7569 0.717119 13.7467 0.726683 13.7401 0.738627C13.5556 1.06688 13.3512 1.49501 13.2081 1.83149C11.5946 1.58991 9.98943 1.58991 8.40914 1.83149C8.26605 1.48749 8.05422 1.06688 7.86888 0.738627C7.86202 0.726956 7.85179 0.717625 7.83955 0.711852C7.8273 0.706079 7.81359 0.704132 7.80022 0.706265C6.32453 0.960755 4.88821 1.40619 3.52747 2.03134C3.51582 2.03631 3.50601 2.04478 3.49939 2.05557C0.778056 6.12123 0.0325189 10.0869 0.398291 14.0035C0.399325 14.0131 0.402273 14.0223 0.40696 14.0308C0.411648 14.0392 0.417979 14.0466 0.425579 14.0525C2.22103 15.3711 3.96023 16.1716 5.66717 16.7022C5.68044 16.7061 5.69461 16.7059 5.70777 16.7016C5.72093 16.6973 5.73246 16.6891 5.74081 16.678C6.14454 16.1266 6.50445 15.5452 6.81311 14.9338C6.81736 14.9254 6.81978 14.9163 6.82022 14.9069C6.82066 14.8975 6.81911 14.8882 6.81567 14.8794C6.81224 14.8707 6.80699 14.8628 6.80028 14.8562C6.79356 14.8497 6.78554 14.8446 6.77673 14.8414C6.20577 14.6248 5.66218 14.3608 5.13924 14.0609C5.1297 14.0553 5.12169 14.0475 5.11592 14.038C5.11014 14.0286 5.10677 14.0179 5.10612 14.0069C5.10546 13.9958 5.10753 13.9848 5.11215 13.9747C5.11677 13.9647 5.12379 13.9559 5.13259 13.9492C5.24262 13.8668 5.35274 13.781 5.45778 13.6944C5.46712 13.6867 5.47842 13.6817 5.49041 13.6801C5.5024 13.6785 5.51461 13.6802 5.52565 13.6852C8.96104 15.2537 12.6802 15.2537 16.075 13.6852C16.086 13.6799 16.0983 13.6779 16.1105 13.6794C16.1226 13.6809 16.1341 13.6857 16.1436 13.6935C16.2487 13.7801 16.3588 13.8668 16.4697 13.9492C16.4785 13.9559 16.4856 13.9646 16.4902 13.9746C16.4949 13.9846 16.4971 13.9956 16.4965 14.0066C16.4959 14.0176 16.4927 14.0283 16.487 14.0378C16.4813 14.0472 16.4734 14.0552 16.4639 14.0608C15.9408 14.3664 15.3928 14.6272 14.8257 14.8405C14.8169 14.8439 14.8089 14.849 14.8023 14.8557C14.7956 14.8624 14.7904 14.8704 14.787 14.8792C14.7837 14.888 14.7822 14.8974 14.7828 14.9068C14.7833 14.9162 14.7858 14.9254 14.7901 14.9338C15.1053 15.5443 15.4652 16.1258 15.8615 16.6771C15.8696 16.6885 15.8811 16.6971 15.8943 16.7015C15.9075 16.706 15.9218 16.7063 15.9352 16.7022C17.6503 16.1715 19.3896 15.371 21.185 14.0525C21.1927 14.0469 21.1992 14.0397 21.2039 14.0313C21.2086 14.023 21.2115 14.0138 21.2124 14.0043C21.65 9.47625 20.4793 5.5431 18.1087 2.05636C18.1029 2.04503 18.0932 2.03624 18.0814 2.03143ZM7.32609 11.6187C6.29183 11.6187 5.43959 10.6691 5.43959 9.50293C5.43959 8.33686 6.2753 7.38727 7.32617 7.38727C8.38518 7.38727 9.22911 8.34517 9.21258 9.50302C9.21258 10.6691 8.37687 11.6187 7.32609 11.6187ZM14.3011 11.6187C13.2669 11.6187 12.4146 10.6691 12.4146 9.50293C12.4146 8.33686 13.2502 7.38727 14.3011 7.38727C15.3601 7.38727 16.204 8.34517 16.1875 9.50302C16.1875 10.6691 15.3601 11.6187 14.3011 11.6187Z"
                          fill="#5865F2"
                        />
                      </svg>

                      <span className="font-medium">{t("reportBugs")}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>

                  <Link
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20.99"
                        height="20.99"
                        viewBox="0 0 24 24"
                        fill="#25D366"
                        stroke="none"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="font-medium">
                        {t("investmentInquiries")}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* About PRAYOGA.io */}
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-2">
                  {t("aboutPrayoga")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("prayogaDescription")}
                </p>
                <Link
                  href="https://prayoga.io/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <Info className="h-4 w-4 mr-2" />
                    {t("getToKnowUs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">{t("close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

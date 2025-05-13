import type React from "react";
import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { FontProvider } from "@/contexts/font-context";
import { ActivityProvider } from "@/contexts/activity-context";
import { StorageProvider } from "@/contexts/storage-context";
import { Toaster } from "@/components/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { CleanupHash } from "@/components/cleanup-hash";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clipbored | Your daily hand",
  description: "Clipboard and To-do in one App",
  manifest: "/manifest.json",
  generator: "prayoga.io",
  openGraph: {
    title: "Clipbored | Your daily hand",
    description: "Clipboard and To-do in one App",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 350,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Montserrat:wght@400;500;600;700&family=Lato:wght@400;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Ubuntu:wght@400;500;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Nunito:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta property="og:image" content="/opengraph-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body
        className={`${inter.className} font-custom`}
        suppressHydrationWarning
      >
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <StorageProvider>
            <ActivityProvider>
              <ThemeProvider>
                <FontProvider>
                  <LanguageProvider>
                    <AuthProvider>
                      <CleanupHash />
                      {children}
                    </AuthProvider>
                    <Toaster />
                  </LanguageProvider>
                </FontProvider>
              </ThemeProvider>
            </ActivityProvider>
          </StorageProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}

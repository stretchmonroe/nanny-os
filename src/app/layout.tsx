import type { Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import GlobalFAB from "@/components/layout/GlobalFAB";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Ankur",
  description: "Rooted in care, growing together",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5F1EB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head />
      <body className="bg-surface-page text-foreground pb-20">
        {/* Runs before hydration to apply dark class without flash */}
        <Script
          id="dark-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <div className="max-w-md mx-auto min-h-screen bg-surface-page shadow-deep">
          {children}
          <BottomNav />
          <GlobalFAB />
        </div>
      </body>
    </html>
  );
}

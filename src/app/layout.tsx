import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Nanny OS",
  description: "Shared childcare operating system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Set dark class before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-surface-page text-foreground pb-20">
        <div className="max-w-md mx-auto min-h-screen bg-surface-page shadow-deep">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

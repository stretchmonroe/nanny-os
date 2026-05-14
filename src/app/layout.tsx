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
      <body className="bg-[#EFEBE4] dark:bg-[#111009] text-zinc-900 dark:text-stone-100 pb-20">
        <div className="max-w-md mx-auto min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714] shadow-2xl">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

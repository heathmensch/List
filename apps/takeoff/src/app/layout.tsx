import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyMomentum",
  description: "Big goals. Small steps. Real progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh font-sans">
        <div className="flex min-h-dvh">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col bg-[var(--background)] px-10 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

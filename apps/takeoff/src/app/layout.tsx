import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font downloads these at build time and emits CSS variables. That avoids
// a runtime Google Fonts request and stops the layout from shifting when text paints.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Next turns this into <title> and <meta name="description"> in the document head.
export const metadata: Metadata = {
  title: "Stats Platform",
  description: "Stats platform with Next.js, Node.js, and PostgreSQL",
};

// Root layout is a Server Component. It wraps every route and stays mounted
// across client navigations; only `children` swaps (for `/` that is page.tsx).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

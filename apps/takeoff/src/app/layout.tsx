import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

/**
 * Root shell: fonts + Clerk only.
 * Signed-in app chrome (sidebar) lives in `(app)/layout.tsx`.
 * Sign-in / sign-up stay outside that group so auth is the first screen.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh font-sans">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

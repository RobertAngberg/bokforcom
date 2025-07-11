import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./Navbar";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import React from "react";
import { LönespecProvider } from "./personal/Lonespecar/LonespecContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bokföringssystem, Robert Angberg",
  description: "Bokföringssystem, Robert Angberg",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <SessionProvider>
          <LönespecProvider>
            <Navbar />
            {children}
          </LönespecProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

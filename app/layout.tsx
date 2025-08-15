import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConditionalNavbar from "./_components/ConditionalNavbar";
import { ClientProviders } from "./ClientProviders";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bokföringssystem, Robert Angberg",
  description: "Bokföringssystem, Robert Angberg",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <ClientProviders>
          <ConditionalNavbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

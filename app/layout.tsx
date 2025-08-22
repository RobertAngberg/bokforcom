import type { Metadata } from "next";
import { Inter } from "next/font/google";
import UtloggadNav from "./UtloggadNav";
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
          <UtloggadNav />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

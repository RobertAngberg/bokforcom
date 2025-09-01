import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./Navbar";
import { ClientProviders } from "./ClientProviders";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bokför.com - Svensk bokföring gjord enkelt",
  description: "Bokför.com - Professionell bokföring för svenska företag",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Navbar from "./_components/Navbar";
import ImpersonationWrapper from "./_components/ImpersonationWrapper";
import { ClientProviders } from "./_lib/providers";
import { RequireOnboarding } from "./onboarding/components/RequireOnboarding";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gratis bokföring - Automatisk bokföring gjord enkelt",
  description: "Professionell bokföring för svenska företag",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-1046599495"
          strategy="afterInteractive"
        />
        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-1046599495');
          `}
        </Script>

        <ClientProviders>
          <ImpersonationWrapper />
          <Navbar />
          <RequireOnboarding>{children}</RequireOnboarding>
        </ClientProviders>
      </body>
    </html>
  );
}

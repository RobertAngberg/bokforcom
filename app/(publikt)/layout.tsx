import type { Metadata } from "next";
import Script from "next/script";
import React from "react";

export const metadata: Metadata = {
  title: "Gratis bokföring - Automatisk bokföring gjord enkelt",
  description:
    "Professionell bokföring för svenska företag. AI-driven kvittoavläsning, automatiska förval och enkel fakturahantering.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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

      {children}
    </>
  );
}

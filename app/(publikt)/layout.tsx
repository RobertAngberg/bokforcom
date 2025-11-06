import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gratis bokföring - Automatisk bokföring gjord enkelt",
  description:
    "Professionell bokföring för svenska företag. AI-driven kvittoavläsning, automatiska förval och enkel fakturahantering.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

"use client";

import BokslutWizard from "./BokslutWizard";

export default function BokslutPage() {
  const aktivPeriod = "2025";

  return <BokslutWizard aktivPeriod={aktivPeriod} onCancel={() => window.history.back()} />;
}

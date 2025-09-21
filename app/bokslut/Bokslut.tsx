"use client";

import { useState } from "react";
import BokslutWizard from "./BokslutWizard";

export default function Bokslut() {
  const [aktivPeriod, setAktivPeriod] = useState<string>("2025");

  return <BokslutWizard aktivPeriod={aktivPeriod} onCancel={() => window.history.back()} />;
}

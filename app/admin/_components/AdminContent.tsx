"use client";

import Anvandarprofil from "./Anvandarprofil";
import Foretagsprofil from "./Foretagsprofil";
import Farozon from "./Farozon";
import SieExportKnapp from "./SieExportKnapp";
import { useAdmin } from "../_hooks/useAdmin";
import type { AdminContentProps } from "../_types/types";

export default function AdminContent({ användarInfo, företagsInfo }: AdminContentProps) {
  const admin = useAdmin({
    initialUser: användarInfo,
    initialForetagsInfo: företagsInfo,
  });

  return (
    <div className="max-w-4xl mx-auto px-6 pt-2">
      <h1 className="text-3xl mb-8 text-center">Administration</h1>
      <Anvandarprofil user={admin.user} />
      <Foretagsprofil company={admin.company} />
      <Farozon dangerZone={admin.dangerZone} />
      <SieExportKnapp />
    </div>
  );
}

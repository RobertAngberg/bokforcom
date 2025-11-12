"use client";

import Anvandarprofil from "./Anvandarprofil";
import Foretagsprofil from "./Foretagsprofil";
import Farozon from "./Farozon";
import SieExportKnapp from "./SieExportKnapp";
import Knapp from "../../_components/Knapp";
import { useAdmin } from "../hooks/useAdmin";
import { signOut } from "../../_lib/auth-client";
import { clearRememberMePreference } from "../../(publikt)/(sidor)/login/utils/rememberMe";
import type { AdminContentProps } from "../types/types";

export default function InstallningarClient({ användarInfo, företagsInfo }: AdminContentProps) {
  const admin = useAdmin({
    initialUser: användarInfo,
    initialForetagsInfo: företagsInfo,
  });

  return (
    <div className="max-w-4xl mx-auto px-6 pt-2">
      {/* Header med logga ut-knapp */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <h1 className="text-3xl text-center">Administration</h1>
        <Knapp
          text="🚪 Logga ut"
          onClick={async () => {
            // FÖRST rensa remember me-preferensen
            clearRememberMePreference();
            // SEN döda better-auth sessionen
            await signOut();
            // SIST tvinga redirect med cache-clearing
            window.location.replace("/login");
          }}
        />
      </div>

      <Anvandarprofil user={admin.user} />
      <Foretagsprofil company={admin.company} />
      <Farozon dangerZone={admin.dangerZone} />
      <SieExportKnapp />
    </div>
  );
}

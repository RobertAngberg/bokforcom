//#region Huvud
import AnimeradFlik from "../../_components/AnimeradFlik";
import ToppInfo from "./ToppInfo";
import Lonekomponenter from "./Lonekomponenter/Lonekomponenter/Lonekomponenter";
import Utlagg from "./Utlagg";
import Sammanfattning from "./Sammanfattning";
import Knapp from "../../_components/Knapp";
import StatusBadge from "./StatusBadge";
import { useState } from "react";
import Forhandsgranskning from "./Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import { useLonespecContext } from "./LonespecContext";

interface LönespecViewProps {
  lönespec: any;
  anställd: any;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  företagsprofil?: any; // Lägg till denna om du vill skicka företagsprofil till MailaLonespec
  visaExtraRader?: boolean; // NY PROP
}

export default function LönespecView({
  lönespec,
  anställd,
  utlägg,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  företagsprofil,
  visaExtraRader = false,
}: LönespecViewProps) {
  const { beräknadeVärden, setBeräknadeVärden, extrarader, setExtrarader } = useLonespecContext();
  //#endregion

  //#region Helper Functions
  function getMånadsNamn(månad: number, år: number): string {
    const månader = [
      "Januari",
      "Februari",
      "Mars",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "Augusti",
      "September",
      "Oktober",
      "November",
      "December",
    ];
    return `${månader[månad - 1]} ${år}`;
  }
  //#endregion

  //#region Data Processing
  const månadsNamn = getMånadsNamn(lönespec.månad || 1, lönespec.år || 2025);
  const grundlön = parseFloat(lönespec.grundlön || lönespec.bruttolön || 0);
  const övertid = parseFloat(lönespec.övertid || 0);
  const bruttolön = parseFloat(lönespec.bruttolön || 0);
  const socialaAvgifter = parseFloat(lönespec.sociala_avgifter || 0);
  const skatt = parseFloat(lönespec.skatt || 0);
  const nettolön = parseFloat(lönespec.nettolön || 0);
  // Fix: Use lönespec.utbetalningsdatum if available, otherwise fallback to old logic
  const utbetalningsDatum = lönespec.utbetalningsdatum
    ? new Date(lönespec.utbetalningsdatum)
    : new Date(lönespec.år, (lönespec.månad || 1) - 1, 25);

  // Hämta beräknade värden för denna lönespec
  const aktuellBeräkning = beräknadeVärden[lönespec.id];

  // Använd beräknade värden om de finns, annars fallback till originala
  const visaBruttolön = aktuellBeräkning?.bruttolön ?? bruttolön;
  const visaSkatt = aktuellBeräkning?.skatt ?? skatt;
  const visaNettolön = aktuellBeräkning?.nettolön ?? nettolön;
  const visaSocialaAvgifter = aktuellBeräkning?.socialaAvgifter ?? socialaAvgifter;
  const visaLönekostnad = aktuellBeräkning?.lönekostnad ?? bruttolön + socialaAvgifter;

  const lönespecUtlägg = utlägg.filter(
    (u) => u.lönespecifikation_id === lönespec.id || !u.lönespecifikation_id
  );
  //#endregion

  //#region Render Content
  const [visaForhandsgranskning, setVisaForhandsgranskning] = useState(false);

  const innehåll = (
    <div className="space-y-6">
      <ToppInfo
        månadsNamn={månadsNamn}
        lönespec={lönespec}
        anställd={anställd}
        getLönespecStatusBadge={(status: string) => <StatusBadge status={status} type="lönespec" />}
      />

      <Lonekomponenter
        grundlön={grundlön}
        övertid={övertid}
        lönespec={lönespec}
        visaExtraRader={visaExtraRader}
        anstalldId={anställd?.id}
      />

      <Utlagg
        lönespecUtlägg={lönespecUtlägg}
        getStatusBadge={(status: string) => <StatusBadge status={status} type="utlägg" />}
        lönespecId={lönespec?.id}
      />

      <Sammanfattning
        utbetalningsDatum={utbetalningsDatum}
        nettolön={visaNettolön}
        lönespec={lönespec}
        anställd={anställd}
        bruttolön={visaBruttolön}
        skatt={visaSkatt}
        socialaAvgifter={visaSocialaAvgifter}
        lönekostnad={visaLönekostnad}
      />

      <div className="flex gap-3 mt-4 justify-between items-center">
        <Knapp text="👁️ Förhandsgranska / PDF" onClick={() => setVisaForhandsgranskning(true)} />
        {onTaBortLönespec && (
          <div className="flex-1 flex justify-end">
            <Knapp
              text={taBortLoading ? "🗑️ Tar bort..." : "🗑️ Ta bort"}
              onClick={onTaBortLönespec}
              disabled={taBortLoading}
            />
          </div>
        )}
      </div>

      {visaForhandsgranskning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-black"
              onClick={() => setVisaForhandsgranskning(false)}
              aria-label="Stäng"
            >
              ×
            </button>
            <Forhandsgranskning
              lönespec={lönespec}
              anställd={anställd}
              företagsprofil={företagsprofil}
              extrarader={extrarader[lönespec.id] || []}
              beräknadeVärden={beräknadeVärden[lönespec.id] || {}}
              onStäng={() => setVisaForhandsgranskning(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Om ingenAnimering = true, visa bara innehållet direkt
  if (ingenAnimering) {
    return innehåll;
  }

  // Annars visa med AnimeradFlik som vanligt
  const namn = anställd ? `${anställd.förnamn || ""} ${anställd.efternamn || ""}`.trim() : "Okänd";
  return (
    <AnimeradFlik
      key={lönespec.id}
      title={namn}
      icon=""
      visaSummaDirekt={`Netto: ${visaNettolön.toLocaleString("sv-SE")} kr`}
    >
      {innehåll}
    </AnimeradFlik>
  );
  //#endregion
}

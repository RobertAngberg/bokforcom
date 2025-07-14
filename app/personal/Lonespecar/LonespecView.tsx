//#region Huvud
import AnimeradFlik from "../../_components/AnimeradFlik";
import ToppInfo from "./ToppInfo";
import Lonekomponenter from "./Lonekomponenter/Lonekomponenter/Lonekomponenter";
import Utlogg from "./Utlogg";
import Sammanfattning from "./Sammanfattning";
import Knapp from "../../_components/Knapp";
import StatusBadge from "./StatusBadge";
import { useState } from "react";
import Forhandsgranskning from "./Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import { useLonespecContext } from "./LonespecContext";

interface LönespecCardProps {
  lönespec: any;
  anställd: any;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  företagsprofil?: any; // Lägg till denna om du vill skicka företagsprofil till MailaLonespec
  visaExtraRader?: boolean; // NY PROP
}

export default function LönespecCard({
  lönespec,
  anställd,
  utlägg,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  företagsprofil,
  visaExtraRader = false,
}: LönespecCardProps) {
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
  const utbetalningsDatum = new Date(lönespec.år, (lönespec.månad || 1) - 1, 25);

  // Hämta beräknade värden för denna lönespec
  const aktuellBeräkning = beräknadeVärden[lönespec.id];

  // Använd beräknade värden om de finns, annars fallback till originala
  const visaBruttolön = aktuellBeräkning?.bruttolön ?? bruttolön;
  const visaSkatt = aktuellBeräkning?.skatt ?? skatt;
  const visaNettolön = aktuellBeräkning?.nettolön ?? nettolön;
  const visaSocialaAvgifter = aktuellBeräkning?.socialaAvgifter ?? socialaAvgifter;
  const visaLönekostnad = aktuellBeräkning?.lönekostnad ?? bruttolön + socialaAvgifter;

  const lönespecUtlogg = utlägg.filter(
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
      />

      <Utlogg
        lönespecUtlogg={lönespecUtlogg}
        getStatusBadge={(status: string) => <StatusBadge status={status} type="utlägg" />}
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
  return (
    <AnimeradFlik
      key={lönespec.id}
      title={`Lönespec ${månadsNamn}`}
      icon="📅"
      visaSummaDirekt={`Netto: ${visaNettolön.toLocaleString("sv-SE")} kr`}
    >
      {innehåll}
    </AnimeradFlik>
  );
  //#endregion
}

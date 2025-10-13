//#region
import AnimeradFlik from "../../../../../_components/AnimeradFlik";
import ToppInfo from "./ToppInfo";
import Lonekomponenter from "../Lonekomponenter/Lonekomponenter";
import Utlagg from "../Utlagg/Utlagg";
import Sammanfattning from "./Sammanfattning";
import Knapp from "../../../../../_components/Knapp";
import StatusBadge from "./StatusBadge";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import FormelVisning from "./FormelVisning";
import type { LönespecViewProps, BeräknadeVärden } from "../../../../types/types";
import { useLonespecView } from "../../../../hooks/useLonespecView";
//#endregion

export default function LönespecView({
  lönespec,
  anställd,
  utlägg,
  ingenAnimering = false,
  onTaBortLönespec,
  taBortLoading = false,
  företagsprofil,
  visaExtraRader = false,
  onLönespecDataChange,
}: LönespecViewProps) {
  const {
    lönespecKey,
    månadsNamn,
    grundlön,
    övertid,
    visaBruttolön,
    visaSkatt,
    visaNettolön,
    visaSocialaAvgifter,
    visaLönekostnad,
    utbetalningsDatum,
    lönespecUtlägg,
    beräknadeVärden,
    extrarader,
    sparar,
    visaForhandsgranskning,
    visaBeräkningar,
    semesterSummary,
    setBeräknadeVärden,
    handleUtläggAdded,
    handleExtraraderChange,
    handleSparaLönespec,
    openForhandsgranskning,
    closeForhandsgranskning,
    toggleVisaBeräkningar,
  } = useLonespecView({ lönespec, anställd, utlägg, onSpecDataChange: onLönespecDataChange });

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
        skattetabell={anställd?.skattetabell}
        skattekolumn={anställd?.skattekolumn}
        extrarader={extrarader[lönespecKey]}
        onExtraraderChange={handleExtraraderChange}
        setBeräknadeVärden={setBeräknadeVärden}
      />

      <Utlagg
        lönespecUtlägg={lönespecUtlägg}
        getStatusBadge={(status: string) => <StatusBadge status={status} type="utlägg" />}
        lönespecId={lönespec?.id}
        onUtläggAdded={handleUtläggAdded}
        extrarader={extrarader[lönespecKey] || []}
        anställdId={anställd?.id}
      />

      <Sammanfattning
        utbetalningsDatum={utbetalningsDatum}
        nettolön={Number(visaNettolön) || 0}
        lönespec={lönespec}
        anställd={anställd}
        bruttolön={Number(visaBruttolön) || 0}
        skatt={Number(visaSkatt) || 0}
        socialaAvgifter={Number(visaSocialaAvgifter) || 0}
        lönekostnad={Number(visaLönekostnad) || 0}
        semesterSummary={semesterSummary}
        onVisaBeräkningar={toggleVisaBeräkningar}
      />

      {visaBeräkningar && (
        <FormelVisning
          beräknadeVärden={beräknadeVärden[lönespecKey] || ({} as BeräknadeVärden)}
          extrarader={extrarader[lönespecKey] || []}
          lönespec={lönespec}
        />
      )}

      {/* Åtgärder sektion */}
      <div className="bg-slate-700 text-white p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Åtgärder</h3>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <Knapp text="👁️ Förhandsgranska / PDF" onClick={openForhandsgranskning} />
          <div className="flex gap-3">
            <Knapp
              text={sparar ? "💾 Sparar..." : "💾 Spara"}
              onClick={handleSparaLönespec}
              disabled={sparar}
            />
            {onTaBortLönespec && (
              <Knapp
                text={taBortLoading ? "🗑️ Tar bort..." : "🗑️ Ta bort"}
                onClick={onTaBortLönespec}
                disabled={taBortLoading}
              />
            )}
          </div>
        </div>
      </div>

      {visaForhandsgranskning && anställd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-black"
              onClick={closeForhandsgranskning}
              aria-label="Stäng"
            >
              ×
            </button>
            <Forhandsgranskning
              lönespec={lönespec}
              anställd={anställd}
              företagsprofil={företagsprofil!}
              extrarader={extrarader[lönespecKey] || []}
              beräknadeVärden={beräknadeVärden[lönespecKey] || ({} as BeräknadeVärden)}
              semesterSummary={semesterSummary}
              onStäng={closeForhandsgranskning}
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
  const namn = anställd?.namn || "Okänd anställd";
  return (
    <AnimeradFlik
      key={lönespec.id}
      title={`👤 ${namn}`}
      icon="💰"
      visaSummaDirekt={`Netto: ${Number(visaNettolön).toLocaleString("sv-SE")} kr`}
    >
      {innehåll}
    </AnimeradFlik>
  );
  //#endregion
}

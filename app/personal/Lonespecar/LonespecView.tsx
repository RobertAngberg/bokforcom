//#region Huvud
import AnimeradFlik from "../../_components/AnimeradFlik";
import ToppInfo from "./ToppInfo";
import Lonekomponenter from "./Lonekomponenter/Lonekomponenter/Lonekomponenter";
import Utlagg from "./Utlagg";
import Sammanfattning from "./Sammanfattning";
import Knapp from "../../_components/Knapp";
import StatusBadge from "./StatusBadge";
import Toast from "../../_components/Toast";
import { useState, useMemo } from "react";
import Forhandsgranskning from "./Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import { useLonespecContext } from "./LonespecContext";
import { uppdateraLönespec } from "../actions";
import FormelVisning from "./FormelVisning";

interface LönespecViewProps {
  lönespec: any;
  anställd: any;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  företagsprofil?: any; // Lägg till denna om du vill skicka företagsprofil till MailaLonespec
  visaExtraRader?: boolean; // NY PROP
  // Åtgärder props
  onHämtaBankgiro?: () => void;
  onMailaSpecar?: () => void;
  onBokför?: () => void;
  onGenereraAGI?: () => void;
  onBokförSkatter?: () => void;
  allaHarBankgiro?: boolean;
  allaHarMailats?: boolean;
  allaHarBokförts?: boolean;
  allaHarAGI?: boolean;
  allaHarSkatter?: boolean;
}

export default function LönespecView({
  lönespec,
  anställd,
  utlägg,
  ingenAnimering = false,
  onTaBortLönespec,
  taBortLoading = false,
  företagsprofil,
  visaExtraRader = false,
  // Åtgärder props
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  allaHarBankgiro = false,
  allaHarMailats = false,
  allaHarBokförts = false,
  allaHarAGI = false,
  allaHarSkatter = false,
}: LönespecViewProps) {
  const { beräknadeVärden, setBeräknadeVärden, extrarader, setExtrarader } = useLonespecContext();

  // Lokal state för utlägg så vi kan uppdatera UI direkt
  const [lokalUtlägg, setLokalUtlägg] = useState(utlägg);
  const [sparar, setSparar] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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

  // Använd useMemo för att säkerställa att lönespecUtlägg uppdateras när lokalUtlägg ändras
  const lönespecUtlägg = useMemo(() => {
    return lokalUtlägg.filter(
      (u) => u.lönespecifikation_id === lönespec.id || !u.lönespecifikation_id
    );
  }, [lokalUtlägg, lönespec.id]);

  // Callback för att uppdatera utlägg status i lokal state
  const handleUtläggAdded = async (tillagdaUtlägg: any[], extraradResults: any[]) => {
    // Uppdatera utlägg status
    setLokalUtlägg((prevUtlägg) =>
      prevUtlägg.map((utlägg) =>
        tillagdaUtlägg.some((t) => t.id === utlägg.id)
          ? { ...utlägg, status: "Inkluderat i lönespec" }
          : utlägg
      )
    );

    // Använd riktiga extrarader från databasen istället för temp-ID:n
    if (extraradResults && extraradResults.length > 0) {
      const nyaExtrarader = extraradResults.filter((result) => result.success && result.data);
      setExtrarader(lönespec.id.toString(), [
        ...(extrarader[lönespec.id] || []),
        ...nyaExtrarader.map((result) => result.data),
      ]);
    }
  };

  // Spara lönespec-ändringar till databas
  const handleSparaLönespec = async () => {
    if (!aktuellBeräkning) {
      setToast({
        type: "error",
        message: "Inga ändringar att spara",
      });
      return;
    }

    setSparar(true);
    try {
      const result = await uppdateraLönespec({
        lönespecId: lönespec.id,
        bruttolön: aktuellBeräkning.bruttolön,
        skatt: aktuellBeräkning.skatt,
        socialaAvgifter: aktuellBeräkning.socialaAvgifter,
        nettolön: aktuellBeräkning.nettolön,
      });

      if (result.success) {
        setToast({
          type: "success",
          message: "Lönespec sparad!",
        });
      } else {
        setToast({
          type: "error",
          message: result.error || "Kunde inte spara lönespec",
        });
      }
    } catch (error) {
      console.error("❌ Fel vid sparning av lönespec:", error);
      setToast({
        type: "error",
        message: "Kunde inte spara lönespec",
      });
    } finally {
      setSparar(false);
    }
  };
  //#endregion

  //#region Render Content
  const [visaForhandsgranskning, setVisaForhandsgranskning] = useState(false);
  const [visaBeräkningar, setVisaBeräkningar] = useState(false);

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
        onUtläggAdded={handleUtläggAdded}
        extrarader={extrarader[lönespec.id] || []}
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
        onVisaBeräkningar={() => setVisaBeräkningar(!visaBeräkningar)}
      />

      {visaBeräkningar && (
        <FormelVisning
          beräknadeVärden={beräknadeVärden[lönespec.id] || {}}
          extrarader={extrarader[lönespec.id] || []}
          lönespec={lönespec}
        />
      )}

      {/* Åtgärder sektion */}
      <div className="bg-slate-700 text-white p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Åtgärder</h3>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <Knapp text="👁️ Förhandsgranska / PDF" onClick={() => setVisaForhandsgranskning(true)} />
          <div className="flex gap-3">
            <Knapp
              text={sparar ? "💾 Sparar..." : "💾 Spara"}
              onClick={handleSparaLönespec}
              disabled={sparar || !aktuellBeräkning}
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

      {/* Lönekörningsåtgärder sektion */}
      {(onHämtaBankgiro || onMailaSpecar || onBokför || onGenereraAGI || onBokförSkatter) && (
        <div className="bg-slate-700 text-white p-4 rounded-lg mb-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Lönekörningsåtgärder</h3>
          <div className="flex gap-4 justify-center flex-wrap">
            {onHämtaBankgiro && (
              <Knapp
                text={allaHarBankgiro ? "✅ Bankgirofil exporterad" : "🏦 Hämta bankgirofil"}
                onClick={onHämtaBankgiro}
                className={allaHarBankgiro ? "bg-green-600 hover:bg-green-700" : ""}
              />
            )}
            {onMailaSpecar && (
              <Knapp
                text={allaHarMailats ? "✅ Lönespecar mailade" : "✉️ Maila lönespecar"}
                onClick={onMailaSpecar}
                className={allaHarMailats ? "bg-green-600 hover:bg-green-700" : ""}
              />
            )}
            {onBokför && (
              <Knapp
                text={allaHarBokförts ? "✅ Löner bokförda" : "📖 Bokför"}
                onClick={onBokför}
                className={allaHarBokförts ? "bg-green-600 hover:bg-green-700" : ""}
              />
            )}
            {onGenereraAGI && (
              <Knapp
                text={allaHarAGI ? "✅ AGI genererad" : "📊 Generera AGI"}
                onClick={onGenereraAGI}
                className={allaHarAGI ? "bg-green-600 hover:bg-green-700" : ""}
              />
            )}
            {onBokförSkatter && (
              <Knapp
                text={allaHarSkatter ? "✅ Skatter bokförda" : "💰 Bokför skatter"}
                onClick={onBokförSkatter}
                className={allaHarSkatter ? "bg-green-600 hover:bg-green-700" : ""}
              />
            )}
          </div>
        </div>
      )}

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

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
        />
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

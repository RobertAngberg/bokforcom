//#region Huvud
import LönespecCard from "./LönespecView";
import Knapp from "../../_components/Knapp";
import { skapaNyLönespec, taBortLönespec } from "../actions";
import { useState } from "react";

interface LönespecListProps {
  lönespecar: any[];
  anställd: any;
  utlägg: any[];
  onFörhandsgranskning: (id: string) => void;
  onBeräkningarUppdaterade: (lönespecId: string, beräkningar: any) => void;
  beräknadeVärden: any;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  extrarader: any[];
  setExtrarader: React.Dispatch<React.SetStateAction<any[]>>;
  onLönespecUppdaterad?: () => void; // Nytt callback för att uppdatera listan
  företagsprofil?: any;
}

export default function LönespecList({
  lönespecar,
  anställd,
  utlägg,
  onFörhandsgranskning,
  onBeräkningarUppdaterade,
  beräknadeVärden,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  onLönespecUppdaterad,
  företagsprofil,
  extrarader,
}: LönespecListProps) {
  const [skaparNyLönespec, setSkaparNyLönespec] = useState(false);
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});

  const handleSkapaNyLönespec = async () => {
    setSkaparNyLönespec(true);
    try {
      const nuvarandeDatum = new Date();
      const månad = nuvarandeDatum.getMonth() + 1;
      const år = nuvarandeDatum.getFullYear();

      const resultat = await skapaNyLönespec({
        anställd_id: anställd.id,
        månad,
        år,
        period_start: new Date(år, månad - 1, 1).toISOString().split("T")[0],
        period_slut: new Date(år, månad, 0).toISOString().split("T")[0],
      });

      if (resultat.success) {
        console.log("🔍 Semester info:", resultat.semesterInfo);
        let semesterText = "";
        if (resultat.semesterInfo?.success) {
          semesterText = `Semester: ${resultat.semesterInfo.message || ""}`;
        } else if (resultat.semesterInfo?.message) {
          semesterText = `Semester: ${resultat.semesterInfo.message}`;
        }
        alert(`✅ Ny lönespec skapad! ${semesterText}`);
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        alert(`❌ Kunde inte skapa lönespec: ${resultat.error}`);
      }
    } catch (error) {
      console.error("❌ Fel vid skapande av lönespec:", error);
      alert("❌ Kunde inte skapa lönespec");
    } finally {
      setSkaparNyLönespec(false);
    }
  };

  const handleTaBortLönespec = async (lönespecId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) {
      return;
    }

    setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: true }));
    try {
      const resultat = await taBortLönespec(parseInt(lönespecId));
      if (resultat.success) {
        alert("✅ Lönespecifikation borttagen!");
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        alert(`❌ Kunde inte ta bort lönespec: ${resultat.message}`);
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      alert("❌ Kunde inte ta bort lönespec");
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: false }));
    }
  };
  //#endregion

  //#region Render
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Knapp för att skapa ny lönespec */}
      <div className="flex justify-end mb-4">
        <Knapp
          text="📝 Skapa ny lönespec"
          onClick={handleSkapaNyLönespec}
          loading={skaparNyLönespec}
        />
      </div>

      {lönespecar.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Inga lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}.
        </div>
      ) : (
        lönespecar.map((lönespec) => (
          <LönespecCard
            key={lönespec.id}
            lönespec={lönespec}
            anställd={anställd}
            utlägg={utlägg}
            onFörhandsgranskning={onFörhandsgranskning}
            onBeräkningarUppdaterade={onBeräkningarUppdaterade}
            beräknadeVärden={beräknadeVärden}
            ingenAnimering={ingenAnimering}
            onTaBortLönespec={() => handleTaBortLönespec(lönespec.id)}
            taBortLoading={taBortLaddning[lönespec.id] || false}
            företagsprofil={företagsprofil}
            extrarader={extrarader}
          />
        ))
      )}
    </div>
  );
  //#endregion
}

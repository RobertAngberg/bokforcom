// #region Huvud
"use client";

//#region Imports
import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import NyAnställd from "./NyAnställd/NyAnställd";
import AnställdaLista from "./AnstalldaLista";
import { hämtaAllaAnställda, hämtaAnställd, taBortAnställd } from "../actions";
//#endregion

//#region Props
interface AnställdaProps {
  onAnställdVald: (anställd: any) => void;
  onLäggTillAnställd: () => void;
  visaFormulär: boolean;
  onAvbryt: () => void;
}
//#endregion

export default function Anstallda({
  onAnställdVald,
  onLäggTillAnställd,
  visaFormulär,
  onAvbryt,
}: AnställdaProps) {
  //#region State
  const [anställdaLista, setAnställdaLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnställdId, setLoadingAnställdId] = useState<number | null>(null);
  //#endregion

  //#region Ladda anställda på mount
  useEffect(() => {
    laddaAnställda();
  }, []);
  //#endregion

  //#region Handlers
  const laddaAnställda = async () => {
    setLoading(true);
    try {
      const anställda = await hämtaAllaAnställda();
      setAnställdaLista(anställda);
    } catch (error) {
      console.error("Fel vid laddning av anställda:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnställdKlick = async (anställd: any) => {
    setLoadingAnställdId(anställd.id);
    try {
      const fullData = await hämtaAnställd(anställd.id);
      onAnställdVald(fullData);
    } catch (error) {
      console.error("Fel vid laddning av anställd:", error);
      onAnställdVald(anställd);
    } finally {
      setLoadingAnställdId(null);
    }
  };

  const handleTaBort = async (id: number, namn: string) => {
    if (confirm(`Är du säker på att du vill ta bort ${namn}?`)) {
      try {
        const result = await taBortAnställd(id);
        if (result.success) {
          alert("Anställd borttagen!");
          await laddaAnställda();
        } else {
          alert("Fel: " + result.error);
        }
      } catch (error) {
        console.error("Fel vid borttagning:", error);
        alert("Ett fel uppstod");
      }
    }
  };
  //#endregion

  //#region Render
  return (
    <div className="space-y-6">
      {!visaFormulär ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl text-white font-semibold">Sparade anställda</h3>
            <Knapp text="Lägg till anställd" onClick={onLäggTillAnställd} />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="ml-3 text-white">Laddar anställda...</span>
            </div>
          ) : anställdaLista.length === 0 ? (
            <p className="text-gray-400">Inga anställda sparade än.</p>
          ) : (
            <AnställdaLista
              anställda={anställdaLista.map((a: any) => ({
                id: a.id,
                namn: `${a.förnamn} ${a.efternamn}`,
                epost: a.mail || "",
                roll: a.jobbtitel || "",
              }))}
              onRedigera={(id) => {
                const anst = anställdaLista.find((a: any) => a.id === id);
                if (anst) handleAnställdKlick(anst);
              }}
              onTaBort={(id) => {
                const anst = anställdaLista.find((a: any) => a.id === id);
                if (anst) handleTaBort(id, `${anst.förnamn} ${anst.efternamn}`);
              }}
              loadingAnställdId={loadingAnställdId}
            />
          )}
        </div>
      ) : (
        <NyAnställd onSparad={laddaAnställda} onAvbryt={onAvbryt} />
      )}
    </div>
  );
  //#endregion
}
// #endregion Huvud

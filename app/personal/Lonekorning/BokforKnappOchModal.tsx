"use client";

import { useState, useMemo, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import { genereraBokföringsrader } from "../Bokföring/bokföringsLogik";
import { valideraBokföring, formateraBeloppKronor } from "../Bokföring/bokföringsUtils";
import { hämtaExtrarader } from "../actions";

interface BokförProps {
  anställda: any[];
  utbetalningsdatum: Date;
  lönespecar: Record<string, any>;
}

export default function BokförKnappOchModal({
  anställda,
  utbetalningsdatum,
  lönespecar,
  onClose,
}: BokförProps & { onClose?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [bokförLoading, setBokförLoading] = useState(false);
  // ✅ STATE FÖR FÄRSKA LÖNESPECAR MED EXTRARADER
  const [färskaLonespecar, setFärskaLonespecar] = useState<Record<string, any>>({});

  // Lägg till en loading-state för färsk data
  const [freshLoading, setFreshLoading] = useState(false);

  // Beräkna bokföringsdata FRÅN FÄRSKA LÖNESPECAR
  const bokföringsData = useMemo(() => {
    const dataAttAnvända = Object.keys(färskaLonespecar).length > 0 ? färskaLonespecar : lönespecar;

    if (Object.keys(dataAttAnvända).length === 0) return null;

    try {
      const summering = genereraBokföringsrader(dataAttAnvända, anställda);
      const valideringsresultat = valideraBokföring(summering);

      return {
        summering,
        fel: valideringsresultat,
        kanBokföra: valideringsresultat.length === 0,
      };
    } catch (error) {
      console.error("Fel vid beräkning av bokföring:", error);
      return null;
    }
    // Lägg till efter rad 42:
    console.log("🔍 BOKFÖR MODAL - färskaLonespecar:", färskaLonespecar);
    console.log("🔍 BOKFÖR MODAL - lönespecar:", lönespecar);
    console.log(
      "🔍 BOKFÖR MODAL - dataAttAnvända:",
      Object.keys(färskaLonespecar).length > 0 ? färskaLonespecar : lönespecar
    );
  }, [färskaLonespecar, lönespecar, anställda]);

  // ✅ HÄMTA FÄRSK DATA NÄR MODALEN ÖPPNAS
  const hanteraBokför = async () => {
    setLoading(true);

    try {
      const uppdateradeLonespecar: Record<string, any> = {};

      // Hämta färska extrarader för varje lönespec
      for (const anställdId of Object.keys(lönespecar)) {
        const lönespec = lönespecar[anställdId];

        if (lönespec?.id) {
          try {
            const extrarader = await hämtaExtrarader(lönespec.id);

            uppdateradeLonespecar[anställdId] = {
              ...lönespec,
              extrarader: extrarader,
            };
          } catch (error) {
            console.error(`❌ Fel vid hämtning av extrarader för lönespec ${lönespec.id}:`, error);
            // Fallback till ursprunglig data
            uppdateradeLonespecar[anställdId] = lönespec;
          }
        } else {
          uppdateradeLonespecar[anställdId] = lönespec;
        }
      }

      setFärskaLonespecar(uppdateradeLonespecar);
    } catch (error) {
      console.error("❌ Fel vid hämtning av färsk data:", error);
      // Fallback - visa modal ändå med gammal data
    } finally {
      setLoading(false);
    }
  };

  // Hämta färsk data varje gång modalen öppnas
  useEffect(() => {
    // Anta att modalen är öppen om anställda och lönespecar finns
    if (anställda.length > 0 && Object.keys(lönespecar).length > 0) {
      setFreshLoading(true);
      // Hämta extrarader för varje lönespec och uppdatera state
      const fetchFreshLonespecar = async () => {
        const updated: Record<string, any> = {};
        for (const [id, spec] of Object.entries(lönespecar)) {
          try {
            const extrarader = await hämtaExtrarader(spec.id);
            updated[id] = { ...spec, extrarader };
          } catch (err) {
            updated[id] = { ...spec, extrarader: spec.extrarader || [] };
          }
        }
        setFärskaLonespecar(updated);
        setFreshLoading(false);
      };
      fetchFreshLonespecar();
    }
  }, [anställda, lönespecar]);

  const hanteraBokförExekvering = async () => {
    if (!bokföringsData?.kanBokföra) return;

    setBokförLoading(true);

    try {
      // TODO: Implementera faktisk bokföring här
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulera API-anrop

      alert("✅ Bokföring genomförd!");
      // ✅ RENSA FÄRSKA DATA EFTER BOKFÖRING
      setFärskaLonespecar({});
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      alert("❌ Fel vid bokföring!");
    } finally {
      setBokförLoading(false);
    }
  };

  // Visa loading tills färsk data är hämtad
  if (freshLoading) {
    return <div className="p-8 text-center text-white">Hämtar färsk löneinformation...</div>;
  }

  // Logga aktuell data innan summering
  console.log("BOKFÖR MODAL - anställda:", anställda);
  console.log("BOKFÖR MODAL - lönespecar:", lönespecar);
  console.log("BOKFÖR MODAL - färskaLonespecar:", färskaLonespecar);
  // Logga summering och bokföringsrader för felsökning
  if (bokföringsData) {
    console.log("BOKFÖRINGS-SUMMERING:", bokföringsData.summering);
    if (bokföringsData.summering?.rader) {
      bokföringsData.summering.rader.forEach((rad: any) => {
        console.log("Rad:", rad);
      });
    }
    console.log("Total debet:", bokföringsData.summering?.totalDebet);
    console.log("Total kredit:", bokföringsData.summering?.totalKredit);
    console.log("Balanserar:", bokföringsData.summering?.balanserar);
    if (bokföringsData.fel && bokföringsData.fel.length > 0) {
      console.log("Fel:", bokföringsData.fel);
    }
  }

  // Logga lönespecar och bruttolön innan summering
  Object.values(lönespecar).forEach((spec: any) => {
    console.log("LÖNESPEC:", spec);
    console.log("Bruttolön:", spec.bruttolön);
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* HEADER */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              📊 Bokföring - {utbetalningsdatum.toLocaleDateString("sv-SE")}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          {/* INNEHÅLL */}
          <div className="flex-1 overflow-y-auto p-6">
            {!bokföringsData ? (
              <div className="text-center text-gray-400 py-8">
                <p>❌ Kunde inte beräkna bokföring</p>
                <p className="text-sm mt-2">Kontrollera att lönespecar är korrekta</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* SAMMANFATTNING */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">📋 Sammanfattning</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Antal anställda:</span>
                      <span className="text-white ml-2 font-medium">{anställda.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total debet:</span>
                      <span className="text-white ml-2 font-medium">
                        {formateraBeloppKronor(bokföringsData.summering.totalDebet)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total kredit:</span>
                      <span className="text-white ml-2 font-medium">
                        {formateraBeloppKronor(bokföringsData.summering.totalKredit)}
                      </span>
                    </div>
                  </div>

                  {/* BALANSSTATUS */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    {bokföringsData.summering.balanserar ? (
                      <div className="flex items-center text-green-400">
                        <span className="mr-2">✅</span>
                        <span>Bokföringen balanserar</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-400">
                        <span className="mr-2">❌</span>
                        <span>Bokföringen balanserar INTE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* FELMEDDELANDEN */}
                {bokföringsData.fel.length > 0 && (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-red-400 mb-3">
                      ❌ Fel som måste åtgärdas
                    </h4>
                    <ul className="space-y-1 text-red-300 text-sm">
                      {bokföringsData.fel.map((fel, index) => (
                        <li key={index}>• {fel}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* BOKFÖRINGSTABELL */}
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                  <h4 className="text-lg font-semibold text-white p-4 bg-gray-600">
                    📊 Bokföringsrader
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="text-left p-3 text-gray-300 font-medium">Konto</th>
                          <th className="text-left p-3 text-gray-300 font-medium">Kontonamn</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Debet</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Kredit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bokföringsData.summering.rader.map((rad, index) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-600 ${
                              index % 2 === 0 ? "bg-gray-750" : "bg-gray-700"
                            }`}
                          >
                            <td className="p-3 text-white">{rad.konto}</td>
                            <td className="p-3 text-gray-300">{rad.kontoNamn}</td>
                            <td className="p-3 text-right text-white">
                              {rad.debet > 0 ? formateraBeloppKronor(rad.debet) : "-"}
                            </td>
                            <td className="p-3 text-right text-white">
                              {rad.kredit > 0 ? formateraBeloppKronor(rad.kredit) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* SUMMERINGSRAD */}
                      <tfoot className="bg-gray-600 border-t-2 border-gray-500">
                        <tr>
                          <td className="p-3 text-white font-semibold" colSpan={2}>
                            SUMMA
                          </td>
                          <td className="p-3 text-right text-white font-semibold">
                            {formateraBeloppKronor(bokföringsData.summering.totalDebet)}
                          </td>
                          <td className="p-3 text-right text-white font-semibold">
                            {formateraBeloppKronor(bokföringsData.summering.totalKredit)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER MED KNAPPAR */}
          <div className="p-6 border-t border-gray-700 flex justify-between">
            <Knapp text="Stäng" onClick={onClose} />

            <Knapp
              text="📊 Genomför bokföring"
              onClick={hanteraBokförExekvering}
              loading={bokförLoading}
              loadingText="⏳ Bokför..."
              disabled={!bokföringsData?.kanBokföra}
            />
          </div>
        </div>
      </div>
    </>
  );
}

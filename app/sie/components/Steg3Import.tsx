"use client";

import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import { skapaKonton, importeraSieData } from "../actions/actions";
import type { SieData, LocalImportSettings, ImportResultatWizard } from "../types/types";

const isDev = process.env.NODE_ENV !== "production";
const debugSie = (...args: Parameters<typeof console.debug>) => {
  if (isDev) {
    console.debug(...args);
  }
};

export default function Steg3Import({
  sieData,
  saknadeKonton,
  settings,
  selectedFile,
  onComplete,
}: {
  sieData: SieData;
  saknadeKonton: string[];
  settings: LocalImportSettings;
  selectedFile?: File | null;
  onComplete: (resultat: ImportResultatWizard) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Förbereder import...");
  const [error, setError] = useState<string | null>(null);

  // Utför riktig import
  useEffect(() => {
    let isCancelled = false; // Förhindra race conditions

    const utförImport = async () => {
      if (isCancelled) return;

      try {
        // Steg 1: Skapa saknade konton
        setCurrentTask("Skapar saknade konton...");
        setProgress(20);

        if (settings.skapaKonton && saknadeKonton.length > 0) {
          const kontoData = saknadeKonton.map((nummer) => {
            const kontoInfo = sieData.konton.find((k) => k.nummer === nummer);
            return {
              nummer,
              namn: kontoInfo?.namn || `Konto ${nummer}`,
            };
          });

          const kontoResult = await skapaKonton(kontoData);
          if (!kontoResult.success) {
            throw new Error(kontoResult.error || "Kunde inte skapa konton");
          }
        }

        // Steg 2: Förbereder import
        setCurrentTask("Förbereder dataimport...");
        setProgress(40);

        // Steg 3: Importera data
        setCurrentTask("Importerar SIE-data...");
        setProgress(60);

        const fileInfo = selectedFile
          ? {
              filnamn: selectedFile.name,
              filstorlek: selectedFile.size,
            }
          : undefined;

        const importResult = await importeraSieData(sieData, saknadeKonton, settings, fileInfo);
        debugSie("📊 SIE Data ingående balanser:", sieData.balanser.ingående);
        debugSie("📊 Import result:", importResult);

        if (!importResult.success) {
          throw new Error(importResult.error || "Kunde inte importera data");
        }

        // Steg 4: Validering
        setCurrentTask("Validerar importerad data...");
        setProgress(80);

        // Steg 5: Slutför
        setCurrentTask("Import slutförd!");
        setProgress(100);

        if (importResult.resultat) {
          onComplete(importResult.resultat);
        }
      } catch (err) {
        if (!isCancelled) {
          // Logga bara fel om inte avbrutet av React Strict Mode
          console.error("Import fel:", err);
          setError(err instanceof Error ? err.message : "Okänt fel");
        }
      }
    };

    utförImport();

    return () => {
      isCancelled = true; // Cleanup function
    };
  }, [selectedFile, sieData, saknadeKonton, settings, onComplete]);

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-8">Import misslyckades</h2>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">✗</span>
          </div>
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-4 rounded mb-4 text-left">
            <div className="font-semibold mb-3">
              🚨 Import avbruten - Duplicata verifikationer upptäckta!
            </div>

            {error.includes("Följande verifikationer finns redan") && (
              <>
                <div className="mb-3">
                  <strong>Följande verifikationer finns redan i din databas:</strong>
                </div>
                <div className="bg-red-600/20 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto mb-3">
                  {error
                    .split("• ")
                    .slice(1) // Ta bort första tomma elementet
                    .map((line, index) => (
                      <div key={index} className="mb-1">
                        • {line.split(" 💡")[0]} {/* Ta bort tipset från slutet */}
                      </div>
                    ))}
                </div>
                <div className="text-yellow-300">
                  💡 Detta förhindrar oavsiktliga dubbletter. Om du vill importera ändå, ta först
                  bort de befintliga verifikationerna.
                </div>
              </>
            )}

            {!error.includes("Följande verifikationer finns redan") && (
              <div>
                <strong>Fel:</strong> {error}
              </div>
            )}
          </div>
          <Knapp text="Försök igen" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white mb-8">Steg 4: Importerar data</h2>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-white mb-2">{currentTask}</div>

          {progress === 60 && currentTask.includes("Importerar SIE-data") && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded mt-4 text-sm">
              <div className="font-semibold mb-2">⏳ Detta kan ta en stund...</div>
              <div className="text-left text-xs">
                • Skapar konton i databasen
                <br />• Importerar {sieData.verifikationer.length} verifikationer
                <br />• Bearbetar{" "}
                {sieData.verifikationer.reduce(
                  (total, ver) => total + ver.transaktioner.length,
                  0
                )}{" "}
                transaktionsposter
                <br />• Validerar all data för korrekthet
              </div>
            </div>
          )}
        </div>

        <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
          <div
            className="bg-cyan-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-400">{Math.round(progress)}% slutfört</div>
      </div>
    </div>
  );
}

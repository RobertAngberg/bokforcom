/**
 * Hook för SIE Import Progress
 *
 * Hanterar:
 * - Import execution med progress tracking
 * - Kontoskapande
 * - SIE-dataimport
 * - Error handling och progress states
 */

"use client";

import { useState, useEffect } from "react";
import { skapaKonton, importeraSieData } from "../actions/actions";
import type { SieData, LocalImportSettings, ImportResultatWizard } from "../types/types";

export function useImportProgress(
  sieData: SieData,
  saknadeKonton: string[],
  settings: LocalImportSettings,
  selectedFile: File | null | undefined,
  shouldExecute: boolean, // Trigger för att starta import
  onComplete: (resultat: ImportResultatWizard) => void
) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Förbereder import...");
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!shouldExecute || isExecuting) return;

    const utförImport = async () => {
      setIsExecuting(true);
      setError(null);

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

        if (!importResult.success) {
          throw new Error(importResult.error || "Kunde inte importera data");
        }

        if (!importResult.resultat) {
          throw new Error("Ingen resultatdata returnerades från importen");
        }

        // Steg 4: Validering
        setCurrentTask("Validerar importerad data...");
        setProgress(80);

        // Steg 5: Slutför
        setCurrentTask("Import slutförd!");
        setProgress(100);

        onComplete(importResult.resultat);
      } catch (err) {
        console.error("Import fel:", err);
        setError(err instanceof Error ? err.message : "Okänt fel");
      } finally {
        setIsExecuting(false);
      }
    };

    utförImport();
  }, [shouldExecute, sieData, saknadeKonton, settings, selectedFile, onComplete, isExecuting]);

  return {
    progress,
    currentTask,
    error,
    isExecuting,
  };
}

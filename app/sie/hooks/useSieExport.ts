/**
 * Hook för SIE Export
 *
 * Hanterar:
 * - SIE-export med loading state
 * - Årsvalidering
 * - Filnedladdning
 * - Error handling
 */

"use client";

import { useState } from "react";
import { exporteraSieData } from "../actions/actions";
import { dateTillÅÅÅÅMMDD } from "../../_utils/datum";
import { validateYear } from "../../_utils/validationUtils";

const isDev = process.env.NODE_ENV !== "production";
const debugSie = (...args: Parameters<typeof console.debug>) => {
  if (isDev) {
    console.debug(...args);
  }
};

export function useSieExport() {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (exportYear: number = 2025) => {
    setExportLoading(true);
    setExportError(null);

    try {
      // Frontend validering innan server call
      if (!validateYear(exportYear)) {
        setExportError("Ogiltigt år för export");
        return;
      }

      const result = await exporteraSieData(exportYear);

      if (result.success && result.data) {
        // Validera export-data
        if (!result.data || result.data.length < 100) {
          setExportError("Export-filen verkar vara tom eller korrupt");
          return;
        }

        // Skapa blob och ladda ner fil
        const blob = new Blob([result.data], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export_${dateTillÅÅÅÅMMDD(new Date())}.se4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Success feedback
        debugSie("SIE-fil exporterad framgångsrikt");
      } else {
        setExportError(result.error || "Kunde inte exportera SIE-data");
      }
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err instanceof Error ? err.message : "Okänt fel vid export");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    exportLoading,
    exportError,
    handleExport,
  };
}

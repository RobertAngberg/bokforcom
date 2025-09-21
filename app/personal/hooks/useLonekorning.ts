"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  GenerateAGIArgs,
  UseLonekorningInit,
  ToastType,
  LonekorningState,
  LonekorningHandlers,
  UseLonekorningReturn,
} from "../types/types";

export function useLonekorning(_init?: UseLonekorningInit): UseLonekorningReturn {
  // Initial state values
  const initialLönespecar: Record<string | number, any> = {};
  const initialSparar: Record<string | number, boolean> = {};
  const initialTaBort: Record<string | number, boolean> = {};

  // Individual useState hooks to replace PersonalContext
  const [laddaLönespecar, setLaddaLönespecar] = useState<boolean>(false);
  const [löneperiod, setLöneperiod] = useState<{ månad: number; år: number } | null>(null);
  const [lönespecar, setLönespecar] = useState<Record<string | number, any>>(initialLönespecar);
  const [sparar, setSparar] = useState<Record<string | number, boolean>>(initialSparar);
  const [taBort, setTaBort] = useState<Record<string | number, boolean>>(initialTaBort);
  const [förhandsgranskaId, setFörhandsgranskaId] = useState<string | null>(null);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [anställda, setAnställda] = useState<any[]>([]);
  const [anställdaLoading, setAnställdaLoading] = useState<boolean>(false);
  const [toast, setToastState] = useState<{
    type: ToastType;
    message: string;
    isVisible: boolean;
  } | null>(null);

  // Helper functions for state updates
  const updateSparar = useCallback((id: string | number, value: boolean) => {
    setSparar((prev) => ({ ...prev, [id]: value }));
  }, []);

  const updateTaBort = useCallback((id: string | number, value: boolean) => {
    setTaBort((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setToast = useCallback(
    (toastData: { message: string; type: ToastType; isVisible: boolean }) => {
      setToastState(toastData);
    },
    []
  );

  const clearToast = useCallback(() => {
    setToastState(null);
  }, []);

  // ===========================================
  // HELPER FUNCTIONS - Migrate from store
  // ===========================================
  const skapaNyLönespec = useCallback(
    async (anställdId: string | number) => {
      try {
        updateSparar(anställdId, true);
        // Placeholder - implement actual API call
        const newSpec = { id: anställdId /* other data */ };
        setLönespecar({ ...lönespecar, [anställdId]: newSpec });
        setToast({ message: "Lönespec skapad", type: "success", isVisible: true });
      } catch (error) {
        setToast({ message: "Misslyckades skapa lönespec", type: "error", isVisible: true });
      } finally {
        updateSparar(anställdId, false);
      }
    },
    [lönespecar, setLönespecar, updateSparar, setToast]
  );

  const taBortLönespec = useCallback(
    async (anställdId: string | number) => {
      try {
        updateTaBort(anställdId, true);
        // Placeholder - implement actual API call
        const { [anställdId]: removed, ...rest } = lönespecar;
        setLönespecar(rest);
        setToast({ message: "Lönespec borttagen", type: "success", isVisible: true });
      } catch (error) {
        setToast({ message: "Misslyckades ta bort lönespec", type: "error", isVisible: true });
      } finally {
        updateTaBort(anställdId, false);
      }
    },
    [lönespecar, setLönespecar, updateTaBort, setToast]
  );

  const openFörhandsgranskning = useCallback(
    (id: string) => {
      setFörhandsgranskaId(id);
    },
    [setFörhandsgranskaId]
  );

  const closeFörhandsgranskning = useCallback(() => {
    setFörhandsgranskaId(null);
  }, [setFörhandsgranskaId]);

  const generateAGI = useCallback(async (args: GenerateAGIArgs) => {
    try {
      console.log("🚀 Startar AGI-generering...");

      // Hämta userId från session
      const userId = args.session?.user?.id;
      if (!userId) {
        console.error("❌ Ingen userId tillgänglig från session");
        return;
      }

      // Hämta företagsdata
      const företagsData = await args.hämtaFöretagsprofil(userId);
      console.log("🏢 Företagsdata hämtad:", företagsData);

      // Importera AGI-utilities
      const { generateAGIXML, convertLonespecToAGI } = await import("../utils/agiUtils");

      // Konvertera lönespec-data till AGI-format
      const period = args.valdaSpecar[0]?.löneperiod || new Date().toISOString().slice(0, 7);
      const agiData = convertLonespecToAGI(args.valdaSpecar, args.anstallda, företagsData, period);

      console.log("📊 AGI-data förberedd:", agiData);

      // Generera XML
      const xml = generateAGIXML(agiData);
      console.log("📄 XML genererad, längd:", xml.length);

      // Ladda ner XML-fil
      const blob = new Blob([xml], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arbetsgivardeklaration_${period}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ AGI XML-fil nedladdad!");

      // Anropa callback för att uppdatera UI
      if (args.onAGIComplete) {
        args.onAGIComplete();
      }
    } catch (error) {
      console.error("❌ Fel vid AGI-generering:", error);
      // Här kan vi lägga till toast-meddelande om fel
    }
  }, []);

  // Placeholder data for förhandsgranskaData
  const förhandsgranskaData = useMemo(() => {
    if (!förhandsgranskaId) return null;
    return lönespecar[förhandsgranskaId] || null;
  }, [förhandsgranskaId, lönespecar]);

  // Härledande getters
  const harLönespec = useCallback(
    (anställdId: string | number) => !!lönespecar[anställdId],
    [lönespecar]
  );
  const getLönespec = useCallback(
    (anställdId: string | number) => lönespecar[anställdId],
    [lönespecar]
  );

  // Normaliserad toast (döljer isVisible internt, exponerar bara aktiv)
  const normalizedToast = useMemo(() => {
    if (!toast?.isVisible || !toast?.message) return null;
    return { type: toast.type as ToastType, message: toast.message };
  }, [toast]);

  const state: LonekorningState = {
    laddaLönespecar,
    löneperiod,
    sparar,
    taBort,
    förhandsgranskaId,
    förhandsgranskaData,
    toast: normalizedToast,
    utbetalningsdatum,
    anställda,
    anställdaLoading,
    harLönespec,
    getLönespec,
  };

  const handlers: LonekorningHandlers = {
    setUtbetalningsdatum,
    skapaNyLönespec,
    taBortLönespec,
    openFörhandsgranskning,
    closeFörhandsgranskning,
    clearToast,
    generateAGI,
  };

  // Spread för backward compat (kan tas bort senare)
  return {
    state,
    handlers,
    // deprecated flat API
    ...state,
    ...handlers,
  };
}

export default useLonekorning;

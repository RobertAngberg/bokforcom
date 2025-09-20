"use client";

import { usePersonalContext } from "../_context/PersonalContext";
import { useCallback, useMemo } from "react";

type GenerateAGIArgs = {
  valdaSpecar: any[];
  anstallda: any[];
  beräknadeVärden: any;
  extrarader: any;
  utbetalningsdatum: string | null;
  session: any;
  hämtaFöretagsprofil: (userId: string) => Promise<any>;
  onAGIComplete?: () => void;
};

type UseLonekorningInit = {
  anställda?: any[];
  utbetalningsdatum?: Date | null;
  onLonespecarChange?: (specar: Record<string, any>) => void;
};

type ToastType = "success" | "error" | "info";

interface LonekorningState {
  laddaLönespecar: boolean;
  löneperiod: { månad: number; år: number } | null;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | null;
  förhandsgranskaData: any;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  anställda: any[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
}

interface LonekorningHandlers {
  setUtbetalningsdatum: (d: Date | null) => void;
  skapaNyLönespec: (anställd: any) => Promise<void>;
  taBortLönespec: (anställd: any) => Promise<void>;
  openFörhandsgranskning: (anställd: any) => void;
  closeFörhandsgranskning: () => void;
  clearToast: () => void;
  generateAGI: (args: GenerateAGIArgs) => Promise<void>;
}

interface UseLonekorningReturn {
  state: LonekorningState;
  handlers: LonekorningHandlers;
  // Deprecated: direkt-access (tillfällig bakåtkompabilitet)
  laddaLönespecar: boolean;
  löneperiod: { månad: number; år: number } | null;
  sparar: Record<string | number, boolean>;
  taBort: Record<string | number, boolean>;
  förhandsgranskaId: string | null;
  förhandsgranskaData: any;
  toast: { type: ToastType; message: string } | null;
  utbetalningsdatum: Date | null;
  setUtbetalningsdatum: (d: Date | null) => void;
  anställda: any[];
  anställdaLoading: boolean;
  harLönespec: (anställdId: string | number) => boolean;
  getLönespec: (anställdId: string | number) => any;
  skapaNyLönespec: (anställd: any) => Promise<void>;
  taBortLönespec: (anställd: any) => Promise<void>;
  openFörhandsgranskning: (anställd: any) => void;
  closeFörhandsgranskning: () => void;
  clearToast: () => void;
  generateAGI: (args: GenerateAGIArgs) => Promise<void>;
}

export function useLonekorning(_init?: UseLonekorningInit): UseLonekorningReturn {
  // Context state destructuring
  const {
    state: {
      laddaLönespecar,
      löneperiod,
      lönespecar,
      sparar,
      taBort,
      förhandsgranskaId,
      toast: toastState,
      utbetalningsdatum,
      anställda,
      anställdaLoading,
    },
    setLaddaLönespecar,
    setLöneperiod,
    setLönespecar,
    setSparar,
    setTaBort,
    setFörhandsgranskaId,
    setUtbetalningsdatum,
    clearToast,
    setToast,
  } = usePersonalContext();

  // ===========================================
  // HELPER FUNCTIONS - Migrate from store
  // ===========================================
  const skapaNyLönespec = useCallback(
    async (anställdId: string | number) => {
      try {
        setSparar(anställdId, true);
        // Placeholder - implement actual API call
        const newSpec = { id: anställdId /* other data */ };
        setLönespecar({ ...lönespecar, [anställdId]: newSpec });
        setToast({ message: "Lönespec skapad", type: "success", isVisible: true });
      } catch (error) {
        setToast({ message: "Misslyckades skapa lönespec", type: "error", isVisible: true });
      } finally {
        setSparar(anställdId, false);
      }
    },
    [lönespecar, setLönespecar, setSparar, setToast]
  );

  const taBortLönespec = useCallback(
    async (anställdId: string | number) => {
      try {
        setTaBort(anställdId, true);
        // Placeholder - implement actual API call
        const { [anställdId]: removed, ...rest } = lönespecar;
        setLönespecar(rest);
        setToast({ message: "Lönespec borttagen", type: "success", isVisible: true });
      } catch (error) {
        setToast({ message: "Misslyckades ta bort lönespec", type: "error", isVisible: true });
      } finally {
        setTaBort(anställdId, false);
      }
    },
    [lönespecar, setLönespecar, setTaBort, setToast]
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
    // Placeholder - implement actual AGI generation
    console.log("Generating AGI with args:", args);
    if (args.onAGIComplete) {
      args.onAGIComplete();
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
  const toast = useMemo(() => {
    if (!toastState.isVisible || !toastState.message) return null;
    return { type: toastState.type as ToastType, message: toastState.message };
  }, [toastState]);

  const state: LonekorningState = {
    laddaLönespecar,
    löneperiod,
    sparar,
    taBort,
    förhandsgranskaId,
    förhandsgranskaData,
    toast,
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

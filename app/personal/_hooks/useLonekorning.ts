"use client";

import { usePersonalStore } from "../_stores/personalStore";
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
  // Selektorer för att minimera re-render
  const laddaLönespecar = usePersonalStore((s) => s.laddaLönespecar);
  const löneperiod = usePersonalStore((s) => s.löneperiod);
  const lönespecar = usePersonalStore((s) => s.lönespecar);
  const sparar = usePersonalStore((s) => s.sparar);
  const taBort = usePersonalStore((s) => s.taBort);
  const förhandsgranskaId = usePersonalStore((s) => s.förhandsgranskaId as string | null);
  const förhandsgranskaData = usePersonalStore((s) => s.förhandsgranskaData);
  const toastState = usePersonalStore((s) => s.toast);
  const utbetalningsdatum = usePersonalStore((s) => (s as any).utbetalningsdatum as Date | null);
  const setUtbetalningsdatum = usePersonalStore(
    (s) => (s as any).setUtbetalningsdatum as (d: Date | null) => void
  );
  const anställda = usePersonalStore((s) => (s as any).anställda as any[]);
  const anställdaLoading = usePersonalStore((s) => (s as any).anställdaLoading as boolean);

  // Actions
  const skapaNyLönespec = usePersonalStore((s) => s.skapaNyLönespec);
  const taBortLönespec = usePersonalStore((s) => s.taBortLönespec);
  const openFörhandsgranskning = usePersonalStore((s) => s.openFörhandsgranskning);
  const closeFörhandsgranskning = usePersonalStore((s) => s.closeFörhandsgranskning);
  const clearToast = usePersonalStore((s) => s.clearToast);
  const generateAGI = usePersonalStore((s) => s.generateAGI);

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

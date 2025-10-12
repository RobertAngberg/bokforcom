"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showToast } from "../../_components/Toast";
import { useLonespec } from "./useLonespecar";
import { uppdateraLonespec } from "../actions/lonespecarActions";
import { hamtaSemesterTransaktioner } from "../actions/semesterActions";
import type {
  AnställdListItem,
  BeräknadeVärden,
  ExtraradData,
  ExtraradResult,
  Lönespec,
  SemesterBoxSummary,
  UtläggData,
} from "../types/types";

const MONTH_NAMES = [
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
] as const;

interface UseLonespecViewOptions {
  lönespec: Lönespec;
  anställd?: AnställdListItem;
  utlägg: UtläggData[];
}

interface UseLonespecViewResult {
  lönespecKey: string;
  månadsNamn: string;
  grundlön: number;
  övertid: number;
  visaBruttolön: number;
  visaSkatt: number;
  visaNettolön: number;
  visaSocialaAvgifter: number;
  visaLönekostnad: number;
  utbetalningsDatum: Date;
  lönespecUtlägg: UtläggData[];
  beräknadeVärden: Record<string, BeräknadeVärden>;
  extrarader: Record<string, ExtraradData[]>;
  sparar: boolean;
  visaForhandsgranskning: boolean;
  visaBeräkningar: boolean;
  semesterSummary: SemesterBoxSummary | null;
  setBeräknadeVärden: (id: string, värden: BeräknadeVärden) => void;
  handleUtläggAdded: (
    tillagdaUtlägg: UtläggData[],
    extraradResults: ExtraradResult[]
  ) => Promise<void>;
  handleExtraraderChange: (rader: ExtraradData[]) => void;
  handleSparaLönespec: () => Promise<void>;
  openForhandsgranskning: () => void;
  closeForhandsgranskning: () => void;
  toggleVisaBeräkningar: () => void;
}

const toNumber = (
  value: string | number | boolean | Date | null | undefined,
  fallback: number = 0
): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/,/g, "."));
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

export function useLonespecView({
  lönespec,
  anställd,
  utlägg,
}: UseLonespecViewOptions): UseLonespecViewResult {
  const { beräknadeVärden, extrarader, setExtrarader, setBeräknadeVärden } = useLonespec();
  const lönespecKey = useMemo(() => lönespec.id.toString(), [lönespec.id]);

  const [lokalUtlägg, setLokalUtlägg] = useState<UtläggData[]>(utlägg);
  const [sparar, setSparar] = useState(false);
  const [visaForhandsgranskning, setVisaForhandsgranskning] = useState(false);
  const [visaBeräkningar, setVisaBeräkningar] = useState(false);
  const [semesterSummary, setSemesterSummary] = useState<SemesterBoxSummary | null>(null);

  useEffect(() => {
    setLokalUtlägg(utlägg);
  }, [utlägg]);

  const månadsNamn = useMemo(() => {
    const månadIndex = Math.max(1, toNumber(lönespec.månad, 1)) - 1;
    const år = toNumber(lönespec.år, 2025);
    const namn = MONTH_NAMES[månadIndex] ?? MONTH_NAMES[0];
    return `${namn} ${år}`;
  }, [lönespec.månad, lönespec.år]);

  const grundlön = useMemo(
    () => toNumber(lönespec.grundlön || lönespec.bruttolön, 0),
    [lönespec.grundlön, lönespec.bruttolön]
  );
  const övertid = useMemo(() => toNumber(lönespec.övertid, 0), [lönespec.övertid]);
  const bruttolön = useMemo(() => toNumber(lönespec.bruttolön, 0), [lönespec.bruttolön]);
  const socialaAvgifter = useMemo(
    () => toNumber(lönespec.sociala_avgifter, 0),
    [lönespec.sociala_avgifter]
  );
  const skatt = useMemo(() => toNumber(lönespec.skatt, 0), [lönespec.skatt]);
  const nettolön = useMemo(() => toNumber(lönespec.nettolön, 0), [lönespec.nettolön]);

  const utbetalningsDatum = useMemo(() => {
    const utbetalningsDatumValue = lönespec.utbetalningsdatum;
    const år = toNumber(lönespec.år, 2025);
    const månad = toNumber(lönespec.månad, 1);
    if (
      utbetalningsDatumValue &&
      (typeof utbetalningsDatumValue === "string" ||
        typeof utbetalningsDatumValue === "number" ||
        utbetalningsDatumValue instanceof Date)
    ) {
      return new Date(utbetalningsDatumValue);
    }
    return new Date(år, månad - 1, 25);
  }, [lönespec.utbetalningsdatum, lönespec.år, lönespec.månad]);

  const aktuellBeräkning = beräknadeVärden[lönespecKey];
  const visaBruttolön = aktuellBeräkning?.bruttolön ?? bruttolön;
  const visaSkatt = aktuellBeräkning?.skatt ?? skatt;
  const visaNettolön = aktuellBeräkning?.nettolön ?? nettolön;
  const visaSocialaAvgifter = aktuellBeräkning?.socialaAvgifter ?? socialaAvgifter;
  const visaLönekostnad = aktuellBeräkning?.lönekostnad ?? bruttolön + socialaAvgifter;

  const lönespecUtlägg = useMemo(() => lokalUtlägg, [lokalUtlägg]);

  const handleUtläggAdded = useCallback(
    async (tillagdaUtlägg: UtläggData[], extraradResults: ExtraradResult[]) => {
      setLokalUtlägg((prevUtlägg: UtläggData[]) =>
        prevUtlägg.map((utläggItem: UtläggData) =>
          tillagdaUtlägg.some((t) => t.id === utläggItem.id)
            ? { ...utläggItem, status: "Inkluderat i lönespec" }
            : utläggItem
        )
      );

      if (extraradResults.length === 0) return;

      const nyaExtrarader = extraradResults
        .filter((result) => result.success && result.data)
        .map((result) => result.data!)
        .filter((data): data is ExtraradData => data !== undefined);

      if (nyaExtrarader.length > 0) {
        setExtrarader(lönespecKey, [...(extrarader[lönespecKey] || []), ...nyaExtrarader]);
      }
    },
    [extrarader, lönespecKey, setExtrarader]
  );

  const handleExtraraderChange = useCallback(
    (rader: ExtraradData[]) => {
      setExtrarader(lönespecKey, rader);
    },
    [lönespecKey, setExtrarader]
  );

  useEffect(() => {
    if (!anställd?.id) {
      setSemesterSummary(null);
      return;
    }

    let isMounted = true;

    const loadSemesterSummary = async () => {
      try {
        const data = await hamtaSemesterTransaktioner(anställd.id);
        const förstaRad = data[0] || {};
        if (isMounted) {
          setSemesterSummary({
            betalda_dagar: Number(förstaRad.betalda_dagar) || 0,
            sparade_dagar: Number(förstaRad.sparade_dagar) || 0,
            skuld: Number(förstaRad.skuld) || 0,
            komp_dagar: Number(förstaRad.komp_dagar) || 0,
          });
        }
      } catch {
        if (isMounted) {
          setSemesterSummary(null);
        }
      }
    };

    loadSemesterSummary();

    return () => {
      isMounted = false;
    };
  }, [anställd?.id]);

  const handleSparaLönespec = useCallback(async () => {
    const värdenAttSpara = aktuellBeräkning || {
      bruttolön: lönespec.bruttolön,
      skatt: lönespec.skatt,
      socialaAvgifter: lönespec.sociala_avgifter,
      nettolön: lönespec.nettolön,
    };

    setSparar(true);
    try {
      const result = await uppdateraLonespec({
        lönespecId: lönespec.id,
        bruttolön: Number(värdenAttSpara.bruttolön) || undefined,
        skatt: Number(värdenAttSpara.skatt) || undefined,
        socialaAvgifter: Number(värdenAttSpara.socialaAvgifter) || undefined,
        nettolön: Number(värdenAttSpara.nettolön) || undefined,
      });

      if (result.success) {
        showToast("Lönespec sparad!", "success");
      } else {
        showToast(result.error || "Kunde inte spara lönespec", "error");
      }
    } catch (error) {
      console.error("❌ Fel vid sparning av lönespec:", error);
      showToast("Kunde inte spara lönespec", "error");
    } finally {
      setSparar(false);
    }
  }, [
    aktuellBeräkning,
    lönespec.id,
    lönespec.bruttolön,
    lönespec.skatt,
    lönespec.sociala_avgifter,
    lönespec.nettolön,
  ]);

  const openForhandsgranskning = useCallback(() => setVisaForhandsgranskning(true), []);
  const closeForhandsgranskning = useCallback(() => setVisaForhandsgranskning(false), []);
  const toggleVisaBeräkningar = useCallback(() => setVisaBeräkningar((prev) => !prev), []);

  return {
    lönespecKey,
    månadsNamn,
    grundlön,
    övertid,
    visaBruttolön,
    visaSkatt,
    visaNettolön,
    visaSocialaAvgifter,
    visaLönekostnad,
    utbetalningsDatum,
    lönespecUtlägg,
    beräknadeVärden,
    extrarader,
    sparar,
    visaForhandsgranskning,
    visaBeräkningar,
    semesterSummary,
    setBeräknadeVärden,
    handleUtläggAdded,
    handleExtraraderChange,
    handleSparaLönespec,
    openForhandsgranskning,
    closeForhandsgranskning,
    toggleVisaBeräkningar,
  };
}

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  hamtaLonespecifikationer,
  skapaNyLonespec,
  laggTillUtlaggSomExtrarad,
} from "../actions/lonespecarActions";
import { uppdateraUtlaggStatus, hamtaUtlagg } from "../actions/utlaggActions";
import { hamtaBetaldaSemesterdagar } from "../actions/semesterActions";
import { showToast } from "../../_components/Toast";
import type {
  Lönespec,
  Utlägg,
  ExtraradResult,
  ExtraradData,
  BeräknadeVärden,
  UseLonespecProps,
} from "../types/types";

export function useLonespec({
  // Utlägg mode props
  enableUtlaggMode = false,
  lönespecUtlägg = [],
  lönespecId,
  anställdId,
  onUtläggAdded,
  externaExtrarader,

  // Component mode props
  enableComponentMode = false,
  specificLönespec,
  skipDataFetch = false, // NY FLAG: förhindra automatisk data-fetching

  // New spec modal props
  enableNewSpecModal = false,
  nySpecDatum = null,
  setNySpecDatum,
  anstallda = [],
  onSpecCreated,

  // Extrarader modal props
  enableExtraraderModal = false,
  extraraderModalOpen = false,
  extraraderModalTitle = "",
  extraraderFields = [],
}: UseLonespecProps = {}) {
  const [lönespecar, setLonespecar] = useState<Lönespec[]>([]);
  const [extrarader, setExtraraderState] = useState<Record<string, ExtraradData[]>>({});
  const [beräknadeVärden, setBeräknadeVärdenState] = useState<Record<string, BeräknadeVärden>>({});

  // Utlägg state (only active when enableUtlaggMode is true)
  const [synkroniseradeUtlägg, setSynkroniseradeUtlägg] = useState<Utlägg[]>(lönespecUtlägg);
  const [läggerTillUtlägg, setLäggerTillUtlägg] = useState(false);

  // Component mode state (only active when enableComponentMode is true)
  const [utlägg, setUtlägg] = useState<Utlägg[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false); // 🆕 Guard mot duplicate fetches

  // New spec modal state (only active when enableNewSpecModal is true)
  const [valdAnställd, setValdAnställd] = useState<string>("");

  // Extrarader modal state (only active when enableExtraraderModal is true)
  const [betaldaDagar, setBetaldaDagar] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [semesterDagar, setSemesterDagar] = useState<number>(0);
  const lastSemesterDagarRef = useRef<number>(0);

  const setExtrarader = useCallback((id: string, extrarader: ExtraradData[]) => {
    setExtraraderState((prev) => ({ ...prev, [id]: extrarader }));
  }, []);

  const setBeräknadeVärden = useCallback((id: string, värden: BeräknadeVärden) => {
    setBeräknadeVärdenState((prev) => ({ ...prev, [id]: värden }));
  }, []);

  // Synkronisera utläggstatus med faktiska extrarader (only when enableUtlaggMode is true)
  useEffect(() => {
    if (!enableUtlaggMode) return;

    const specKey = lönespecId?.toString() || "";
    const relevantaExtrarader = externaExtrarader ?? extrarader[specKey];

    if (lönespecUtlägg.length === 0 || relevantaExtrarader === undefined) return;

    const synkronisera = async () => {
      const uppdateradeUtlägg = await Promise.all(
        lönespecUtlägg.map(async (utlägg) => {
          const finnsIExtrarader = relevantaExtrarader.some((extrarad) => {
            const beskrivningsMatch =
              extrarad.kolumn1?.includes(utlägg.beskrivning) ||
              extrarad.kolumn1?.includes(`Utlägg - ${utlägg.datum}`);
            const beloppMatch =
              Math.abs(parseFloat(extrarad.kolumn3 || "0") - utlägg.belopp) < 0.01;

            return beskrivningsMatch && beloppMatch;
          });

          if (utlägg.status === "Inkluderat i lönespec" && !finnsIExtrarader) {
            await uppdateraUtlaggStatus(utlägg.id, "Väntande");
            return { ...utlägg, status: "Väntande" };
          }

          return utlägg;
        })
      );

      setSynkroniseradeUtlägg(uppdateradeUtlägg);
    };

    synkronisera();
  }, [enableUtlaggMode, lönespecUtlägg, extrarader, externaExtrarader, lönespecId]);

  // Hämta alla anställdens utlägg för att visa väntande utlägg (only when enableUtlaggMode is true)
  useEffect(() => {
    if (!enableUtlaggMode || !anställdId) return;

    const hamtaAllaUtlagg = async () => {
      try {
        const allUtlägg = await hamtaUtlagg(anställdId);

        // Kombinera lönespec-specifika utlägg med alla väntande utlägg
        const kombineradeUtlägg = [
          ...lönespecUtlägg,
          ...allUtlägg.filter(
            (u) => u.status === "Väntande" && !lönespecUtlägg.some((lu) => lu.id === u.id)
          ),
        ] as Utlägg[];

        setSynkroniseradeUtlägg(kombineradeUtlägg);
      } catch (error) {
        console.error("Fel vid hämtning av utlägg:", error);
      }
    };

    hamtaAllaUtlagg();
  }, [enableUtlaggMode, anställdId, lönespecUtlägg]);

  const handleLäggTillUtlägg = async () => {
    if (!enableUtlaggMode || !lönespecId) {
      showToast("Fel: Ingen lönespec ID hittades", "error");
      return;
    }

    const väntandeUtlägg = synkroniseradeUtlägg.filter((u) => u.status === "Väntande");

    if (väntandeUtlägg.length === 0) {
      showToast("Inga väntande utlägg att lägga till", "info");
      return;
    }

    setLäggerTillUtlägg(true);
    try {
      const extraradResults: ExtraradResult[] = [];
      for (const utlägg of väntandeUtlägg) {
        // Enkel, tydlig funktion - spara resultatet
        const result = await laggTillUtlaggSomExtrarad(lönespecId, utlägg);
        extraradResults.push(result);
        await uppdateraUtlaggStatus(utlägg.id, "Inkluderat i lönespec");
      }
      showToast(`${väntandeUtlägg.length} utlägg tillagda!`, "success");

      // Notify parent of changes (callback pattern - consider refactoring to parent fetch)
      if (onUtläggAdded) {
        await onUtläggAdded(väntandeUtlägg, extraradResults);
      }
    } catch (error) {
      console.error("Fel:", error);
      showToast("Något gick fel!", "error");
    } finally {
      setLäggerTillUtlägg(false);
    }
  };

  // Data loading function (only active when enableComponentMode is true)
  const loadData = async () => {
    if (!enableComponentMode || !anställdId) return;

    try {
      setLoading(true);
      const [lönespecarData, utläggData] = await Promise.all([
        hamtaLonespecifikationer(anställdId),
        hamtaUtlagg(anställdId),
      ]);
      setLonespecar(lönespecarData);
      setUtlägg(utläggData as Utlägg[]);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Component mode effects - only for side effects, no derived state
  useEffect(() => {
    if (!enableComponentMode) return;

    // Om skipDataFetch, sätt loading till false direkt
    if (skipDataFetch) {
      setLoading(false);
      return;
    }

    if (specificLönespec) {
      setLoading(false);
      return;
    }

    const loadSpecar = async () => {
      if (!anställdId) return;

      // 🆕 Guard: Förhindra duplicate fetches (React StrictMode kör useEffect 2x i dev)
      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        const [lönespecarData, utläggData] = await Promise.all([
          hamtaLonespecifikationer(anställdId),
          hamtaUtlagg(anställdId),
        ]);
        setLonespecar(lönespecarData);
        setUtlägg(utläggData as Utlägg[]);
      } catch (error) {
        console.error("Fel vid laddning av data:", error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadSpecar();
  }, [enableComponentMode, specificLönespec, anställdId, skipDataFetch]);

  // Reset selected employee when modal opens - moved to direct computation
  // (removed useEffect to avoid prop-change listener anti-pattern)

  // Load semester data when modal opens - converted to effect for side effect only
  useEffect(() => {
    if (
      enableExtraraderModal &&
      extraraderModalOpen &&
      extraraderModalTitle === "Betald semester" &&
      anställdId
    ) {
      hamtaBetaldaSemesterdagar(anställdId).then(setBetaldaDagar);
    }
  }, [enableExtraraderModal, extraraderModalOpen, extraraderModalTitle, anställdId]);

  // Beräkna semesterdagar effect
  useEffect(() => {
    const updateSemesterDagar = (value: number) => {
      if (lastSemesterDagarRef.current === value) {
        return;
      }
      lastSemesterDagarRef.current = value;
      setSemesterDagar(value);
      const antalField = extraraderFields.find((field) => field.name === "kolumn2");
      if (antalField) {
        antalField.onChange({
          target: { value: value.toString() },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    if (!enableExtraraderModal || extraraderModalTitle !== "Betald semester") {
      updateSemesterDagar(0);
      return;
    }

    if (!startDate || !endDate) {
      updateSemesterDagar(0);
      return;
    }

    if (endDate < startDate) {
      updateSemesterDagar(0);
      return;
    }

    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    updateSemesterDagar(count);
  }, [enableExtraraderModal, extraraderModalTitle, startDate, endDate, extraraderFields]);

  // Modal handler functions
  const handleStartDateChange = (date: Date | null) => {
    if (!enableExtraraderModal) return;
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    if (!enableExtraraderModal) return;
    setEndDate(date);
  };

  const createSyntheticEvent = (value: string) => {
    if (!enableExtraraderModal) return {} as React.ChangeEvent<HTMLSelectElement>;

    return {
      target: { value },
    } as React.ChangeEvent<HTMLSelectElement>;
  };

  const getFilteredFields = (includeKolumn2: boolean = true) => {
    if (!enableExtraraderModal) return [];

    return extraraderFields.filter((field) => {
      if (field.hidden) return false;
      if (!includeKolumn2 && field.name === "kolumn2") return false;
      return true;
    });
  };

  // New spec modal functions (only active when enableNewSpecModal is true)
  const validateInput = () => {
    if (!enableNewSpecModal) return false;

    if (!nySpecDatum) {
      showToast("Välj ett datum först!", "error");
      return false;
    }
    if (!valdAnställd) {
      showToast("Välj en anställd först!", "error");
      return false;
    }
    if (anstallda.length === 0) {
      showToast("Ingen anställd hittades.", "error");
      return false;
    }
    return true;
  };

  const formatUtbetalningsdatum = () => {
    if (!enableNewSpecModal) return null;

    if (nySpecDatum instanceof Date && !isNaN(nySpecDatum.getTime())) {
      return nySpecDatum.toISOString().slice(0, 10);
    }
    return null;
  };

  const handleCreateSpec = async () => {
    if (!enableNewSpecModal) return;

    if (!validateInput()) return;

    const utbetalningsdatum = formatUtbetalningsdatum();
    if (!utbetalningsdatum) {
      showToast("Fel: utbetalningsdatum saknas eller är ogiltigt!", "error");
      return;
    }

    try {
      const res = await skapaNyLonespec({
        anställd_id: parseInt(valdAnställd),
        utbetalningsdatum,
      });

      if (res?.success === false) {
        showToast(`Fel: ${res.error || "Misslyckades att skapa lönespecifikation."}`, "error");
      } else {
        showToast("Ny lönespecifikation skapad!", "success");
        onSpecCreated?.();
      }
    } catch (error) {
      console.error("❌ Fel vid skapande av lönespec:", error);
      showToast("Ett oväntat fel inträffade", "error");
    }
  };

  const handleAnställdChange = (value: string) => {
    if (!enableNewSpecModal) return;
    setValdAnställd(value);
  };

  const handleDatumChange = (date: Date | null) => {
    if (!enableNewSpecModal) return;
    setNySpecDatum?.(date);
  };

  // Computed values for utlägg mode
  const väntandeUtlägg = enableUtlaggMode
    ? synkroniseradeUtlägg.filter((u) => u.status === "Väntande")
    : [];
  const inkluderadeUtlägg = enableUtlaggMode
    ? synkroniseradeUtlägg.filter((u) => u.status === "Inkluderat i lönespec")
    : [];

  // Calculate lönespecar directly to avoid derived state anti-pattern
  const calculatedLönespecar = useMemo(() => {
    if (enableComponentMode && specificLönespec) {
      return [specificLönespec];
    }
    return lönespecar;
  }, [enableComponentMode, specificLönespec, lönespecar]);

  return {
    // Base functionality
    lönespecar: calculatedLönespecar,
    setLonespecar,
    extrarader,
    setExtrarader,
    beräknadeVärden,
    setBeräknadeVärden,

    // Utlägg mode returns (only active when enableUtlaggMode is true)
    ...(enableUtlaggMode && {
      synkroniseradeUtlägg,
      läggerTillUtlägg,
      väntandeUtlägg,
      inkluderadeUtlägg,
      handleLäggTillUtlägg,
    }),

    // Component mode returns (only active when enableComponentMode is true)
    ...(enableComponentMode && {
      utlägg,
      loading,
      loadData,
    }),

    // New spec modal returns (only active when enableNewSpecModal is true)
    ...(enableNewSpecModal && {
      valdAnställd,
      canCreateSpec: !!nySpecDatum && !!valdAnställd && anstallda.length > 0,
      handleCreateSpec,
      handleAnställdChange,
      handleDatumChange,
    }),

    // Extrarader modal returns (only active when enableExtraraderModal is true)
    ...(enableExtraraderModal && {
      betaldaDagar,
      startDate,
      endDate,
      semesterDagar,
      isBetaldSemester: extraraderModalTitle === "Betald semester",
      handleStartDateChange,
      handleEndDateChange,
      createSyntheticEvent,
      getFilteredFields,
    }),
  };
}

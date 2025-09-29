"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  hämtaLönespecifikationer,
  skapaNyLönespec,
  läggTillUtläggSomExtrarad,
} from "../actions/lonespecarActions";
import { uppdateraUtläggStatus, hämtaUtlägg } from "../actions/utlaggActions";
import { hämtaBetaldaSemesterdagar } from "../actions/semesterActions";
import { showToast } from "../../_components/Toast";
import type { Lönespec, Utlägg, ExtraradResult, ExtraradData, AnställdData } from "../types/types";

interface FormField {
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hidden?: boolean;
  type?: string;
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  step?: string;
  min?: string;
}

interface UseLonespecProps {
  // Utlägg mode props
  enableUtlaggMode?: boolean;
  lönespecUtlägg?: Utlägg[];
  lönespecId?: number;
  anställdId?: number;
  onUtläggAdded?: (utlägg: Utlägg[], extraradResults: ExtraradResult[]) => Promise<void>;

  // Component mode props
  enableComponentMode?: boolean;
  specificLönespec?: Lönespec;

  // New spec modal props
  enableNewSpecModal?: boolean;
  nySpecModalOpen?: boolean;
  nySpecDatum?: Date | null;
  setNySpecDatum?: (date: Date | null) => void;
  anstallda?: AnställdData[];
  onSpecCreated?: () => void;

  // Extrarader modal props
  enableExtraraderModal?: boolean;
  extraraderModalOpen?: boolean;
  extraraderModalTitle?: string;
  extraraderFields?: FormField[];
}

export function useLonespec({
  // Utlägg mode props
  enableUtlaggMode = false,
  lönespecUtlägg = [],
  lönespecId,
  anställdId,
  onUtläggAdded,

  // Component mode props
  enableComponentMode = false,
  specificLönespec,

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
  const [beräknadeVärden, setBeräknadeVärdenState] = useState<Record<string, number>>({});

  // Utlägg state (only active when enableUtlaggMode is true)
  const [synkroniseradeUtlägg, setSynkroniseradeUtlägg] = useState<Utlägg[]>(lönespecUtlägg);
  const [läggerTillUtlägg, setLäggerTillUtlägg] = useState(false);

  // Component mode state (only active when enableComponentMode is true)
  const [utlägg, setUtlägg] = useState<Utlägg[]>([]);
  const [loading, setLoading] = useState(true);

  // New spec modal state (only active when enableNewSpecModal is true)
  const [valdAnställd, setValdAnställd] = useState<string>("");

  // Extrarader modal state (only active when enableExtraraderModal is true)
  const [betaldaDagar, setBetaldaDagar] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [semesterDagar, setSemesterDagar] = useState<number>(0);

  const setExtrarader = useCallback((id: string, extrarader: ExtraradData[]) => {
    setExtraraderState((prev) => ({ ...prev, [id]: extrarader }));
  }, []);

  const setBeräknadeVärden = useCallback((id: string, värden: number) => {
    setBeräknadeVärdenState((prev) => ({ ...prev, [id]: värden }));
  }, []);

  // Synkronisera utläggstatus med faktiska extrarader (only when enableUtlaggMode is true)
  useEffect(() => {
    if (!enableUtlaggMode) return;

    const synkronisera = async () => {
      const uppdateradeUtlägg = await Promise.all(
        lönespecUtlägg.map(async (utlägg) => {
          // Kolla om utlägget faktiskt finns i extrarader
          const finnsIExtrarader = extrarader[lönespecId?.toString() || ""]?.some((extrarad) => {
            // Matcha baserat på beskrivning och belopp
            const beskrivningsMatch =
              extrarad.kolumn1?.includes(utlägg.beskrivning) ||
              extrarad.kolumn1?.includes(`Utlägg - ${utlägg.datum}`);
            const beloppMatch =
              Math.abs(parseFloat(extrarad.kolumn3 || "0") - utlägg.belopp) < 0.01;

            return beskrivningsMatch && beloppMatch;
          });

          // Om utlägget är markerat som "Inkluderat" men inte finns i extrarader
          if (utlägg.status === "Inkluderat i lönespec" && !finnsIExtrarader) {
            // Återställ till "Väntande" i databasen
            await uppdateraUtläggStatus(utlägg.id, "Väntande");
            return { ...utlägg, status: "Väntande" };
          }

          return utlägg;
        })
      );

      setSynkroniseradeUtlägg(uppdateradeUtlägg);
    };

    if (lönespecUtlägg.length > 0 && extrarader[lönespecId?.toString() || ""]) {
      synkronisera();
    }
  }, [enableUtlaggMode, lönespecUtlägg, extrarader, lönespecId]);

  // Hämta alla anställdens utlägg för att visa väntande utlägg (only when enableUtlaggMode is true)
  useEffect(() => {
    if (!enableUtlaggMode || !anställdId) return;

    const hämtaAllaUtlägg = async () => {
      try {
        const allUtlägg = await hämtaUtlägg(anställdId);

        // Kombinera lönespec-specifika utlägg med alla väntande utlägg
        const kombineradeUtlägg = [
          ...lönespecUtlägg,
          ...allUtlägg.filter(
            (u: Utlägg) =>
              u.status === "Väntande" && !lönespecUtlägg.some((lu: Utlägg) => lu.id === u.id)
          ),
        ];

        setSynkroniseradeUtlägg(kombineradeUtlägg);
      } catch (error) {
        console.error("Fel vid hämtning av utlägg:", error);
      }
    };

    hämtaAllaUtlägg();
  }, [enableUtlaggMode, anställdId, lönespecUtlägg]);

  const handleLäggTillUtlägg = useCallback(async () => {
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
        const result = await läggTillUtläggSomExtrarad(lönespecId, utlägg);
        extraradResults.push(result);
        await uppdateraUtläggStatus(utlägg.id, "Inkluderat i lönespec");
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
  }, [enableUtlaggMode, lönespecId, synkroniseradeUtlägg, onUtläggAdded]);

  // Data loading function (only active when enableComponentMode is true)
  const loadData = useCallback(async () => {
    if (!enableComponentMode || !anställdId) return;

    try {
      setLoading(true);
      const [lönespecarData, utläggData] = await Promise.all([
        hämtaLönespecifikationer(anställdId),
        hämtaUtlägg(anställdId),
      ]);
      setLonespecar(lönespecarData);
      setUtlägg(utläggData);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  }, [enableComponentMode, anställdId]);

  // Extrarader modal utility functions (only active when enableExtraraderModal is true)
  const beräknaArbetsdagar = useCallback(
    (start: Date, end: Date): number => {
      if (!enableExtraraderModal) return 0;

      let count = 0;
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Inte söndag (0) eller lördag (6)
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      return count;
    },
    [enableExtraraderModal]
  );

  const updateSemesterDagar = useCallback(
    (newSemesterDagar: number) => {
      if (!enableExtraraderModal) return;

      setSemesterDagar(newSemesterDagar);

      // Uppdatera det motsvarande fältet automatiskt
      const antalField = extraraderFields.find((field) => field.name === "kolumn2");
      if (antalField) {
        antalField.onChange({
          target: { value: newSemesterDagar.toString() },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [enableExtraraderModal, extraraderFields]
  );

  // Component mode effects - only for side effects, no derived state
  useEffect(() => {
    if (!enableComponentMode) return;

    if (specificLönespec) {
      setLoading(false);
      return;
    }
    loadData();
  }, [enableComponentMode, specificLönespec, loadData]);

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
      hämtaBetaldaSemesterdagar(anställdId).then(setBetaldaDagar);
    }
  }, [enableExtraraderModal, extraraderModalOpen, extraraderModalTitle, anställdId]);

  // Beräkna semesterdagar effect
  useEffect(() => {
    if (
      enableExtraraderModal &&
      startDate &&
      endDate &&
      extraraderModalTitle === "Betald semester"
    ) {
      const dagar = beräknaArbetsdagar(startDate, endDate);
      updateSemesterDagar(dagar);
    }
  }, [
    enableExtraraderModal,
    startDate,
    endDate,
    extraraderModalTitle,
    beräknaArbetsdagar,
    updateSemesterDagar,
  ]);

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
      const res = await skapaNyLönespec({
        anställd_id: parseInt(valdAnställd),
        utbetalningsdatum,
      });

      if (res?.success === false) {
        showToast(`Fel: ${res.error || "Misslyckades att skapa lönespecifikation."}`, "error");
      } else {
        showToast("Ny lönespecifikation skapad!", "success");
        onSpecCreated?.();
        loadData(); // Refresh data
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
      beräknaArbetsdagar,
    }),
  };
}

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  hämtaAllaLönespecarFörUser,
  markeraBankgiroExporterad,
  markeraMailad,
  markeraBokförd,
  markeraAGIGenererad,
  markeraSkatternaBokförda,
} from "../actions/lonespecarActions";
import { hämtaAllaAnställda } from "../actions/anstalldaActions";
import { hämtaUtlägg } from "../actions/utlaggActions";
import { bokförLöneskatter } from "../actions/bokforingActions";
import { Lönekörning } from "../types/types";
import {
  hämtaLönespecifikationerFörLönekörning,
  uppdateraLönekörningSteg,
  taBortLönekörning,
} from "../actions/lonekorningActions";

interface LonekorningHookProps {
  anställda?: any[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
  extrarader?: any;
  beräknadeVärden?: any;
}

export const useLonekorning = ({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
  extrarader,
  beräknadeVärden,
}: LonekorningHookProps = {}) => {
  const { data: session } = useSession();

  // Main state
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nyLonekorningModalOpen, setNyLonekorningModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const [valdLonekorning, setValdLonekorning] = useState<Lönekörning | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lönekörningSpecar, setLönekörningSpecar] = useState<any[]>([]);
  const [taBortLoading, setTaBortLoading] = useState(false);
  const [loading, setLoading] = useState(!propsAnställda);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<string | null>(null);

  // Modal states
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);

  // Data states
  const [specarPerDatum, setSpecarPerDatum] = useState<Record<string, any[]>>({});
  const [datumLista, setDatumLista] = useState<string[]>([]);
  const [valdaSpecar, setValdaSpecar] = useState<any[]>([]);
  const [localAnställda, setLocalAnställda] = useState<any[]>([]);
  const [utlaggMap, setUtlaggMap] = useState<Record<number, any[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});

  // Skatte states
  const [skatteDatum, setSkatteDatum] = useState<Date | null>(null);
  const [skatteBokförPågår, setSkatteBokförPågår] = useState(false);

  // Toast states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [skatteToast, setSkatteToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Computed values
  const anstallda = propsAnställda || localAnställda;
  const anställdaLoading = propsAnställdaLoading || loading;

  // Business logic functions
  const beräknaSkatteData = () => {
    if (!lönekörningSpecar || lönekörningSpecar.length === 0) {
      return {
        socialaAvgifter: 0,
        personalskatt: 0,
        totaltSkatter: 0,
      };
    }

    let totalSocialaAvgifter = 0;
    let totalPersonalskatt = 0;

    lönekörningSpecar.forEach((spec) => {
      const beräkningar = beräknadeVärden?.[spec.id];
      const socialaAvgifter = beräkningar?.socialaAvgifter || spec.sociala_avgifter || 0;
      const skatt = beräkningar?.skatt || spec.skatt || 0;

      totalSocialaAvgifter += socialaAvgifter;
      totalPersonalskatt += skatt;
    });

    return {
      socialaAvgifter: Math.round(totalSocialaAvgifter * 100) / 100,
      personalskatt: Math.round(totalPersonalskatt * 100) / 100,
      totaltSkatter: Math.round((totalSocialaAvgifter + totalPersonalskatt) * 100) / 100,
    };
  };

  const loadLönekörningSpecar = async () => {
    if (!valdLonekorning) return;

    try {
      setLoading(true);
      const result = await hämtaLönespecifikationerFörLönekörning(valdLonekorning.id);

      if (result.success && result.data) {
        setLönekörningSpecar(result.data);
      } else {
        console.error("❌ Fel vid laddning av lönespecar:", result.error);
        setLönekörningSpecar([]);
      }
    } catch (error) {
      console.error("❌ Fel vid laddning av lönespecar:", error);
      setLönekörningSpecar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaBortLönekörning = async () => {
    if (!valdLonekorning) return;

    const bekräfta = confirm(
      `Är du säker på att du vill ta bort lönekörningen för ${valdLonekorning.period}?\n\nDetta kommer att:\n- Ta bort alla lönespecifikationer\n- Ta bort all workflow-data\n- Detta kan INTE ångras!`
    );

    if (!bekräfta) return;

    try {
      setTaBortLoading(true);
      const result = await taBortLönekörning(valdLonekorning.id);

      if (result.success) {
        setValdLonekorning(null);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert(`Fel vid borttagning: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönekörning:", error);
      alert("Ett oväntat fel uppstod vid borttagning");
    } finally {
      setTaBortLoading(false);
    }
  };

  const hanteraTaBortSpec = async (specId: number) => {
    try {
      const response = await fetch("/api/lonespec/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: specId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete lönespec");
      }

      setValdaSpecar((prev) => prev.filter((spec) => spec.id !== specId));
      setToast({ message: "Lönespec borttagen", type: "success" });
    } catch (error) {
      console.error("Error deleting lönespec:", error);
      setToast({ message: "Kunde inte ta bort lönespec", type: "error" });
    }
  };

  const refreshData = async () => {
    if (propsAnställda && onAnställdaRefresh) {
      onAnställdaRefresh();
      return;
    }

    try {
      const [specar, anstallda] = await Promise.all([
        hämtaAllaLönespecarFörUser(),
        hämtaAllaAnställda(),
      ]);
      setLocalAnställda(anstallda);

      const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
      const utlaggResults = await Promise.all(utlaggPromises);
      const utlaggMap: Record<number, any[]> = {};
      anstallda.forEach((a, idx) => {
        utlaggMap[a.id] = utlaggResults[idx];
      });
      setUtlaggMap(utlaggMap);

      const grupperat: Record<string, any[]> = {};
      specar.forEach((spec) => {
        if (spec.utbetalningsdatum) {
          if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
          grupperat[spec.utbetalningsdatum].push(spec);
        }
      });
      const grupperatUtanTomma = Object.fromEntries(
        Object.entries(grupperat).filter(([_, list]) => list.length > 0)
      );
      const datumSort = Object.keys(grupperatUtanTomma).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      setDatumLista(datumSort);
      setSpecarPerDatum(grupperatUtanTomma);

      if (utbetalningsdatum && grupperatUtanTomma[utbetalningsdatum]) {
        setValdaSpecar(grupperatUtanTomma[utbetalningsdatum]);
      }
    } catch (error) {
      console.error("❌ Fel vid refresh av data:", error);
    }
  };

  const hanteraBokförSkatter = async () => {
    const skatteData = beräknaSkatteData();

    if (skatteData.socialaAvgifter === 0 && skatteData.personalskatt === 0) {
      setSkatteToast({ type: "info", message: "Inga skatter att bokföra!" });
      return;
    }

    setSkatteBokförPågår(true);
    try {
      const datum = skatteDatum?.toISOString() || new Date().toISOString();
      const result = await bokförLöneskatter({
        socialaAvgifter: skatteData.socialaAvgifter,
        personalskatt: skatteData.personalskatt,
        datum,
        kommentar: "Löneskatter från lönekörning",
      });

      if (result.success) {
        setSkatteToast({ type: "success", message: "Löneskatter bokförda!" });

        setTimeout(async () => {
          setSkatteModalOpen(false);
          for (const spec of lönekörningSpecar) {
            if (!spec.skatter_bokförda) {
              await markeraSkatternaBokförda(spec.id);
            }
          }
          await loadLönekörningSpecar();
        }, 2000);
      } else {
        setSkatteToast({
          type: "error",
          message: `Fel vid bokföring: ${result.error || "Okänt fel"}`,
        });
      }
    } catch (error: any) {
      console.error("❌ Fel vid bokföring av skatter:", error);
      setSkatteToast({ type: "error", message: `Fel vid bokföring: ${error?.message || error}` });
    } finally {
      setSkatteBokförPågår(false);
    }
  };

  // Workflow handlers
  const handleMailaSpecar = async () => {
    if (valdLonekorning?.id) {
      setValdLonekorning((prev) =>
        prev ? { ...prev, aktuellt_steg: 2, mailade_datum: new Date() } : prev
      );
      try {
        await uppdateraLönekörningSteg(valdLonekorning.id, 2);
      } catch (error) {
        console.error("❌ Fel vid uppdatering av workflow:", error);
      }
    }
    setBatchMailModalOpen(true);
  };

  const handleBokför = async () => {
    if (valdLonekorning?.id) {
      setValdLonekorning((prev) =>
        prev ? { ...prev, aktuellt_steg: 3, bokford_datum: new Date() } : prev
      );
      try {
        await uppdateraLönekörningSteg(valdLonekorning.id, 3);
      } catch (error) {
        console.error("❌ Fel vid uppdatering av workflow:", error);
      }
    }
    setBokforModalOpen(true);
  };

  const handleGenereraAGI = async () => {
    if (valdLonekorning?.id) {
      setValdLonekorning((prev) =>
        prev ? { ...prev, aktuellt_steg: 4, agi_genererad_datum: new Date() } : prev
      );
      try {
        await uppdateraLönekörningSteg(valdLonekorning.id, 4);
      } catch (error) {
        console.error("❌ Fel vid uppdatering av workflow:", error);
      }
    }
  };

  const handleBokförSkatter = async () => {
    if (valdLonekorning?.id) {
      setValdLonekorning((prev) =>
        prev
          ? {
              ...prev,
              aktuellt_steg: 5,
              skatter_bokforda_datum: new Date(),
              status: "avslutad" as const,
              avslutad_datum: new Date(),
            }
          : prev
      );
      try {
        await uppdateraLönekörningSteg(valdLonekorning.id, 5);
      } catch (error) {
        console.error("❌ Fel vid uppdatering av workflow:", error);
      }
    }
    setSkatteModalOpen(true);
  };

  const handleRefreshData = async () => {
    await loadLönekörningSpecar();
    setLoading(true);
    setTimeout(() => setLoading(false), 10);
  };

  // Effects
  useEffect(() => {
    if (!propsAnställda) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [specar, anstallda] = await Promise.all([
            hämtaAllaLönespecarFörUser(),
            hämtaAllaAnställda(),
          ]);
          setLocalAnställda(anstallda);

          const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
          const utlaggResults = await Promise.all(utlaggPromises);
          const utlaggMap: Record<number, any[]> = {};
          anstallda.forEach((a, idx) => {
            utlaggMap[a.id] = utlaggResults[idx];
          });
          setUtlaggMap(utlaggMap);

          const grupperat: Record<string, any[]> = {};
          specar.forEach((spec) => {
            if (spec.utbetalningsdatum) {
              if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
              grupperat[spec.utbetalningsdatum].push(spec);
            }
          });
          const grupperatUtanTomma = Object.fromEntries(
            Object.entries(grupperat).filter(([_, list]) => list.length > 0)
          );
          const datumSort = Object.keys(grupperatUtanTomma).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
          );
          setDatumLista(datumSort);
          setSpecarPerDatum(grupperatUtanTomma);

          if (datumSort.length > 0) {
            setUtbetalningsdatum(datumSort[0]);
            setValdaSpecar(grupperatUtanTomma[datumSort[0]]);
          } else {
            setUtbetalningsdatum(null);
            setValdaSpecar([]);
          }
        } catch (error) {
          console.error("❌ Fel vid laddning av lönekörning:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [propsAnställda]);

  useEffect(() => {
    if (utbetalningsdatum && specarPerDatum[utbetalningsdatum]) {
      setValdaSpecar(specarPerDatum[utbetalningsdatum]);
    }
  }, [utbetalningsdatum, specarPerDatum]);

  useEffect(() => {
    if (valdLonekorning) {
      loadLönekörningSpecar();
    }
  }, [valdLonekorning]);

  const skatteData = beräknaSkatteData();

  // AGI Generator function
  const hanteraAGI = async () => {
    // Call the hook's AGI generation function
    await handleGenereraAGI();

    // Mark all specs as AGI generated
    for (const spec of lönekörningSpecar) {
      if (!spec.agi_genererad) {
        await markeraAGIGenererad(spec.id);
      }
    }
    // Refresh data to show updated buttons
    await refreshData();
  };

  return {
    // State
    nySpecModalOpen,
    setNySpecModalOpen,
    nyLonekorningModalOpen,
    setNyLonekorningModalOpen,
    nySpecDatum,
    setNySpecDatum,
    valdLonekorning,
    setValdLonekorning,
    refreshTrigger,
    setRefreshTrigger,
    lönekörningSpecar,
    setLönekörningSpecar,
    taBortLoading,
    setTaBortLoading,
    loading,
    setLoading,
    utbetalningsdatum,
    setUtbetalningsdatum,
    batchMailModalOpen,
    setBatchMailModalOpen,
    bokforModalOpen,
    setBokforModalOpen,
    specarPerDatum,
    setSpecarPerDatum,
    datumLista,
    setDatumLista,
    valdaSpecar,
    setValdaSpecar,
    localAnställda,
    setLocalAnställda,
    utlaggMap,
    setUtlaggMap,
    taBortLaddning,
    setTaBortLaddning,
    bankgiroModalOpen,
    setBankgiroModalOpen,
    skatteModalOpen,
    setSkatteModalOpen,
    skatteDatum,
    setSkatteDatum,
    skatteBokförPågår,
    setSkatteBokförPågår,
    toast,
    setToast,
    skatteToast,
    setSkatteToast,
    // Computed
    anstallda,
    anställdaLoading,
    skatteData,
    session,
    // Functions
    beräknaSkatteData,
    hanteraBokförSkatter,
    hanteraTaBortSpec,
    loadLönekörningSpecar,
    handleTaBortLönekörning,
    refreshData,
    handleMailaSpecar,
    handleBokför,
    handleGenereraAGI,
    handleBokförSkatter,
    handleRefreshData,
    hanteraAGI,
  };
};

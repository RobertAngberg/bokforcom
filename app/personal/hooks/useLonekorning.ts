import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { showToast } from "../../_components/Toast";
import {
  hämtaAllaLönespecarFörUser,
  markeraBankgiroExporterad,
  markeraMailad,
  markeraBokförd,
  markeraAGIGenererad,
  markeraSkatternaBokförda,
} from "../actions/lonespecarActions";
import { hämtaAllaAnställda, hämtaFöretagsprofil } from "../actions/anstalldaActions";
import { hämtaUtlägg } from "../actions/utlaggActions";
import { bokförLöneskatter } from "../actions/bokforingActions";
import { Lönekörning, LonekorningHookProps } from "../types/types";
import {
  hämtaLönespecifikationerFörLönekörning,
  uppdateraLönekörningSteg,
  taBortLönekörning,
  hämtaAllaLönekörningar,
  skapaLönekörning,
  skapaLönespecifikationerFörLönekörning,
} from "../actions/lonekorningActions";

export const useLonekorning = ({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
  extrarader,
  beräknadeVärden,
  enableListMode = false,
  refreshTrigger,
  specListValdaSpecar = [],
  specListLönekörning = null,
  onSpecListTaBortSpec,
  onSpecListHämtaBankgiro,
  onSpecListMailaSpecar,
  onSpecListBokför,
  onSpecListGenereraAGI,
  onSpecListBokförSkatter,
  enableNewLonekorningModal = false,
  onLonekorningCreated,
}: LonekorningHookProps = {}) => {
  const { data: session } = useSession();

  // Main state
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nyLonekorningModalOpen, setNyLonekorningModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const [valdLonekorning, setValdLonekorning] = useState<Lönekörning | null>(null);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const [lönekörningSpecar, setLönekörningSpecar] = useState<any[]>([]);

  // Lista mode specific states
  const [lonekorningar, setLonekorningar] = useState<Lönekörning[]>([]);
  const [listLoading, setListLoading] = useState(enableListMode);

  // Spec lista mode specific states
  const [specListTaBortLaddning, setSpecListTaBortLaddning] = useState<Record<number, boolean>>({});
  const [taBortLoading, setTaBortLoading] = useState(false);
  const [loading, setLoading] = useState(!propsAnställda);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<string | null>(null);

  // New lönekörning modal states (only active when enableNewLonekorningModal is true)
  const [newLonekorningUtbetalningsdatum, setNewLonekorningUtbetalningsdatum] =
    useState<Date | null>(new Date());
  const [newLonekorningLoading, setNewLonekorningLoading] = useState(false);
  const [newLonekorningValdaAnstallda, setNewLonekorningValdaAnstallda] = useState<number[]>([]);
  const [newLonekorningSteg, setNewLonekorningSteg] = useState<"datum" | "anställda">("datum");

  // Modal states
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [showDeleteLönekorningModal, setShowDeleteLönekorningModal] = useState(false);
  const [showDeleteLönespecModal, setShowDeleteLönespecModal] = useState(false);
  const [deleteLönespecId, setDeleteLönespecId] = useState<number | null>(null);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);

  // Data states
  const [specarPerDatum, setSpecarPerDatum] = useState<Record<string, any[]>>({});
  const [datumLista, setDatumLista] = useState<string[]>([]);
  const [valdaSpecar, setValdaSpecar] = useState<any[]>([]);
  const [localAnställda, setLocalAnställda] = useState<any[]>([]);
  const [utlaggMap, setUtlaggMap] = useState<Record<number, any[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [företagsprofil, setFöretagsprofil] = useState<unknown>(null);

  // Skatte states
  const [skatteDatum, setSkatteDatum] = useState<Date | null>(null);
  const [skatteBokförPågår, setSkatteBokförPågår] = useState(false);

  // Toast states - skatteToast kept for modal-specific usage
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

    setShowDeleteLönekorningModal(true);
  };

  const confirmDeleteLönekorning = async () => {
    if (!valdLonekorning) return;

    setShowDeleteLönekorningModal(false);

    try {
      setTaBortLoading(true);
      const result = await taBortLönekörning(valdLonekorning.id);

      if (result.success) {
        setValdLonekorning(null);
        setInternalRefreshTrigger((prev) => prev + 1);
      } else {
        showToast(`Fel vid borttagning: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönekörning:", error);
      showToast("Ett oväntat fel uppstod vid borttagning", "error");
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
      showToast("Lönespec borttagen", "success");
    } catch (error) {
      console.error("Error deleting lönespec:", error);
      showToast("Kunde inte ta bort lönespec", "error");
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

  // Lista mode effect
  useEffect(() => {
    if (enableListMode) {
      loadLonekorningar();
    }
  }, [enableListMode, refreshTrigger, internalRefreshTrigger]);

  // New lönekörning modal effect
  useEffect(() => {
    if (enableNewLonekorningModal && nyLonekorningModalOpen) {
      setNewLonekorningSteg("datum");
      setNewLonekorningValdaAnstallda([]);
    }
  }, [enableNewLonekorningModal, nyLonekorningModalOpen]);

  // Load företagsprofil effect
  useEffect(() => {
    const loadFöretagsprofil = async () => {
      try {
        const profile = await hämtaFöretagsprofil(session?.user?.id || "");
        setFöretagsprofil(profile);
      } catch (error) {
        console.error("Kunde inte ladda företagsprofil:", error);
      }
    };
    if (session?.user?.id) {
      loadFöretagsprofil();
    }
  }, [session?.user?.id]);

  const skatteData = beräknaSkatteData();

  // Prepare batch data for mailing
  const prepareBatchData = (specData: any[], allEmployees: any[]) => {
    return specData
      .map((spec) => {
        const anställd = allEmployees.find((a) => a.id === spec.anställd_id);
        if (!anställd) {
          console.warn(
            `Anställd med id ${spec.anställd_id} hittades inte för lönespec ${spec.id}.`
          );
          return null;
        }
        return {
          lönespec: spec,
          anställd,
          företagsprofil,
          extrarader: extrarader?.[spec.id] || [],
          beräknadeVärden: beräknadeVärden?.[spec.id] || {},
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // Spec lista mode computed values
  const specListCurrentStep = specListLönekörning?.aktuellt_steg || 0;
  const specListAllaHarBankgiro = specListValdaSpecar.every((spec) => spec.bankgiro_exporterad);
  const specListAllaHarMailats = specListValdaSpecar.every((spec) => spec.mailad);
  const specListAllaHarBokförts = specListValdaSpecar.every((spec) => spec.bokförd);

  const specListLönekörningKomplett = !!(
    specListLönekörning?.mailade_datum &&
    specListLönekörning?.bokford_datum &&
    specListLönekörning?.agi_genererad_datum &&
    specListLönekörning?.skatter_bokforda_datum
  );

  const specListHasIncompleteSpecs = specListValdaSpecar.some(
    (spec) => !spec.bruttolön || !spec.nettolön
  );

  // Lista mode functions
  const loadLonekorningar = async () => {
    if (!enableListMode) return;

    try {
      setListLoading(true);
      const result = await hämtaAllaLönekörningar();

      if (result.success && result.data) {
        setLonekorningar(result.data);
      } else {
        console.error("❌ Fel vid laddning av lönekörningar:", result.error);
        setLonekorningar([]);
      }
    } catch (error) {
      console.error("❌ Fel vid laddning av lönekörningar:", error);
      setLonekorningar([]);
    } finally {
      setListLoading(false);
    }
  };

  const formatPeriodName = (period: string): string => {
    const [år, månad] = period.split("-");
    const månadsNamn = [
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
    ];
    return `${månadsNamn[parseInt(månad) - 1]} ${år}`;
  };

  const getItemClassName = (lonekorning: Lönekörning, valdLonekorningItem?: Lönekörning | null) => {
    return `
      p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-cyan-500
      ${
        valdLonekorningItem?.id === lonekorning.id
          ? "border-cyan-500 bg-slate-700"
          : "border-slate-600 bg-slate-800 hover:bg-slate-700"
      }
    `;
  };

  // Spec lista mode functions
  const specListHandleTaBortLönespec = async (spec: any) => {
    if (onSpecListTaBortSpec) {
      await onSpecListTaBortSpec(spec.id);
      return;
    }

    setDeleteLönespecId(spec.id);
    setShowDeleteLönespecModal(true);
  };

  const confirmDeleteLönespec = async () => {
    if (!deleteLönespecId) return;

    setShowDeleteLönespecModal(false);

    setSpecListTaBortLaddning((prev) => ({ ...prev, [deleteLönespecId]: true }));
    try {
      await hanteraTaBortSpec(deleteLönespecId);
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
    } finally {
      setSpecListTaBortLaddning((prev) => ({ ...prev, [deleteLönespecId]: false }));
    }
  };

  const specListHandleHämtaBankgiro = () => {
    if (onSpecListHämtaBankgiro) {
      onSpecListHämtaBankgiro();
      return;
    }
    setBankgiroModalOpen(true);
  };

  const specListHandleBokför = () => {
    if (onSpecListBokför) {
      onSpecListBokför();
      return;
    }
    console.log("🔥 specListHandleBokför anropad!");
    handleBokför();
  };

  const specListHandleGenereraAGI = () => {
    if (onSpecListGenereraAGI) {
      onSpecListGenereraAGI();
      return;
    }
    handleGenereraAGI();
  };

  const specListHandleBokförSkatter = () => {
    if (onSpecListBokförSkatter) {
      onSpecListBokförSkatter();
      return;
    }
    handleBokförSkatter();
  };

  // Workflow steps configuration for spec lista mode
  const specListWorkflowSteps = [
    {
      id: "maila",
      title: "Maila",
      description: "Skicka lönespecar",
      completed: !!specListLönekörning?.mailade_datum,
      buttonText: "✉️ Maila lönespecar",
      onClick: onSpecListMailaSpecar || handleMailaSpecar,
      enabled: true,
    },
    {
      id: "bokfor",
      title: "Bokför",
      description: "Registrera i bokföring",
      completed: !!specListLönekörning?.bokford_datum,
      buttonText: "📖 Bokför",
      onClick: specListHandleBokför,
      enabled: !!specListLönekörning?.bokford_datum || !!specListLönekörning?.mailade_datum,
    },
    {
      id: "agi",
      title: "AGI",
      description: "Generera deklaration",
      completed: !!specListLönekörning?.agi_genererad_datum,
      buttonText: "📊 Generera AGI",
      onClick: specListHandleGenereraAGI,
      enabled: !!specListLönekörning?.agi_genererad_datum || !!specListLönekörning?.bokford_datum,
    },
    {
      id: "skatter",
      title: "Skatter",
      description: "Bokför skatter",
      completed: !!specListLönekörning?.skatter_bokforda_datum,
      buttonText: "💰 Bokför skatter",
      onClick: specListHandleBokförSkatter,
      enabled:
        !!specListLönekörning?.skatter_bokforda_datum || !!specListLönekörning?.agi_genererad_datum,
    },
  ];

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

  // New lönekörning modal functions (only active when enableNewLonekorningModal is true)
  const handleNewLonekorningCreate = async () => {
    if (!enableNewLonekorningModal) return;

    if (!newLonekorningUtbetalningsdatum) {
      showToast("Du måste ange ett utbetalningsdatum!", "error");
      return;
    }

    if (newLonekorningSteg === "datum") {
      setNewLonekorningSteg("anställda");
      return;
    }

    if (newLonekorningValdaAnstallda.length === 0) {
      showToast("Du måste välja minst en anställd!", "error");
      return;
    }

    setNewLonekorningLoading(true);
    try {
      // Skapa lönekörning med period baserat på utbetalningsdatum
      const period = newLonekorningUtbetalningsdatum.toISOString().substring(0, 7); // YYYY-MM
      const lönekörningResult = await skapaLönekörning(period);

      if (!lönekörningResult.success) {
        showToast(lönekörningResult.error || "Kunde inte skapa lönekörning", "error");
        return;
      }

      // Skapa lönespecifikationer för valda anställda
      const lönespecResult = await skapaLönespecifikationerFörLönekörning(
        lönekörningResult.data!.id,
        newLonekorningUtbetalningsdatum,
        newLonekorningValdaAnstallda
      );

      if (!lönespecResult.success) {
        showToast(lönespecResult.error || "Kunde inte skapa lönespecifikationer", "error");
        return;
      }

      onLonekorningCreated?.(lönekörningResult.data);
      setNyLonekorningModalOpen(false);
      setNewLonekorningUtbetalningsdatum(new Date());
      setNewLonekorningSteg("datum");
      setNewLonekorningValdaAnstallda([]);

      // Refresh data if we're in list mode
      if (enableListMode) {
        setInternalRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("❌ Fel vid skapande av lönekörning:", error);
      showToast("Kunde inte skapa lönekörning", "error");
    } finally {
      setNewLonekorningLoading(false);
    }
  };

  const handleNewLonekorningAnstalldToggle = (anställdId: number) => {
    if (!enableNewLonekorningModal) return;

    setNewLonekorningValdaAnstallda((prev) =>
      prev.includes(anställdId) ? prev.filter((id) => id !== anställdId) : [...prev, anställdId]
    );
  };

  const handleNewLonekorningBack = () => {
    if (!enableNewLonekorningModal) return;

    if (newLonekorningSteg === "anställda") {
      setNewLonekorningSteg("datum");
    }
  };

  const handleNewLonekorningClose = () => {
    if (!enableNewLonekorningModal) return;

    setNyLonekorningModalOpen(false);
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
    refreshTrigger: internalRefreshTrigger,
    setRefreshTrigger: setInternalRefreshTrigger,
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
    företagsprofil,
    setFöretagsprofil,
    bankgiroModalOpen,
    setBankgiroModalOpen,
    skatteModalOpen,
    setSkatteModalOpen,
    showDeleteLönekorningModal,
    setShowDeleteLönekorningModal,
    showDeleteLönespecModal,
    setShowDeleteLönespecModal,
    deleteLönespecId,
    skatteDatum,
    setSkatteDatum,
    skatteBokförPågår,
    setSkatteBokförPågår,
    skatteToast,
    setSkatteToast,
    // Lista mode states
    lonekorningar,
    setLonekorningar,
    listLoading,
    setListLoading,
    // Spec lista mode states
    specListTaBortLaddning,
    setSpecListTaBortLaddning,
    // Spec lista computed values
    specListCurrentStep,
    specListAllaHarBankgiro,
    specListAllaHarMailats,
    specListAllaHarBokförts,
    specListLönekörningKomplett,
    specListHasIncompleteSpecs,
    specListWorkflowSteps,
    // Computed
    anstallda,
    anställdaLoading,
    skatteData,
    session,
    hasLonekorningar: lonekorningar.length > 0,
    // Functions
    beräknaSkatteData,
    hanteraBokförSkatter,
    hanteraTaBortSpec,
    loadLönekörningSpecar,
    handleTaBortLönekörning,
    confirmDeleteLönekorning,
    confirmDeleteLönespec,
    refreshData,
    prepareBatchData,
    handleMailaSpecar,
    handleBokför,
    handleGenereraAGI,
    handleBokförSkatter,
    handleRefreshData,
    hanteraAGI,
    // Lista mode functions
    loadLonekorningar,
    formatPeriodName,
    getItemClassName,
    // Spec lista mode functions
    specListHandleTaBortLönespec,
    specListHandleHämtaBankgiro,
    specListHandleBokför,
    specListHandleGenereraAGI,
    specListHandleBokförSkatter,
    // New lönekörning modal state (only when enableNewLonekorningModal is true)
    newLonekorningUtbetalningsdatum,
    setNewLonekorningUtbetalningsdatum,
    newLonekorningLoading,
    newLonekorningValdaAnstallda,
    newLonekorningSteg,
    // New lönekörning modal computed
    newLonekorningCanProceed: enableNewLonekorningModal
      ? newLonekorningSteg === "datum"
        ? !!newLonekorningUtbetalningsdatum
        : newLonekorningValdaAnstallda.length > 0
      : false,
    // New lönekörning modal functions
    handleNewLonekorningCreate,
    handleNewLonekorningAnstalldToggle,
    handleNewLonekorningBack,
    handleNewLonekorningClose,
  };
};

/**
 * ===== HOOK FÖR LÖNEKÖRNING OCH AGI-GENERERING =====
 *
 * Detta är huvudhooken för att hantera lönekörningar i BokförCom, inklusive
 * generering av AGI (Arbetsgivardeklaration) XML-filer för Skatteverket.
 *
 * VIKTIGA LÄRDOMAR FRÅN AGI-DEBUGGING:
 * - AGI-generering kräver korrekt formaterad lönedata från databasen
 * - Organisationsnummer och personnummer måste valideras innan XML-generering
 * - Alla belopp måste vara positiva (inga negativa värden tillåts)
 * - Faltkoder är obligatoriska enligt Skatteverkets schema version 1.1.17.1
 *
 * @file useLonekorning.ts - Huvudhook för lönekörning och AGI-funktioner
 */

import { useState, useEffect } from "react";
import { useSession } from "../../_lib/auth-client";
import { showToast } from "../../_components/Toast";
import { markeraAGIGenererad, markeraSkatternaBokforda } from "../actions/lonespecarActions";
import { hamtaAllaAnstallda, hamtaForetagsprofil } from "../actions/anstalldaActions";
import { hamtaUtlagg } from "../actions/utlaggActions";
import { bokforLoneskatter } from "../actions/bokforingActions";
import {
  Lönekörning,
  LonekorningHookProps,
  LönespecData,
  AnställdData,
  AnställdListItem,
  UtläggData,
  BatchDataItem,
} from "../types/types";
import {
  hamtaLonespecifikationerForLonekorning,
  uppdateraLonekorningSteg,
  taBortLonekorning,
  hamtaAllaLonekorningar,
  skapaLonekorning,
  skapaLonespecifikationerForLonekorning,
} from "../actions/lonekorningActions";
import {
  valideraFlertalsAnställda,
  skapaValideringsFelmeddelande,
} from "../utils/anstalldValidering";

function forvaldUtbetalningsdag(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 25);
}

const mapAnställdaToListItems = (data: AnställdData[] = []): AnställdListItem[] =>
  data
    .filter((post): post is AnställdData & { id: number } => typeof post?.id === "number")
    .map((post) => {
      const förnamn = (post.förnamn ?? "").trim();
      const efternamn = (post.efternamn ?? "").trim();
      const fallbackNamn = (post.namn ?? post.mail ?? post.epost ?? "").trim();
      const fullName = [förnamn, efternamn].filter(Boolean).join(" ").trim();

      return {
        id: post.id,
        namn: fullName || fallbackNamn,
        epost: post.mail || post.epost || "",
        roll: post.jobbtitel || "",
        förnamn,
        efternamn,
        personnummer: post.personnummer || "",
        clearingnummer: post.clearingnummer || "",
        bankkonto: post.bankkonto || "",
        adress: post.adress || "",
        postnummer: post.postnummer || "",
        ort: post.ort || "",
        skattetabell: post.skattetabell,
        skattekolumn: post.skattekolumn,
        sparade_dagar: post.sparade_dagar,
        använda_förskott: post.använda_förskott,
      };
    });

export const useLonekorning = ({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
  extrarader,
  beräknadeVärden,
  enableListMode = false,
  specListValdaSpecar = [],
  specListLönekörning,
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

  // ===== ANVÄNDNINGSOMRÅDEN FÖR DENNA HOOK =====
  //
  // 1. STANDARDLÄGE: Hantering av hela lönekörningsprocessen
  //    - Skapa ny lönekörning med valda anställda
  //    - Generera lönespecifikationer
  //    - Bokför löner i redovisningen
  //    - Generera AGI XML-filer för Skatteverket
  //    - Bokför arbetsgivaravgifter och skatter
  //
  // 2. LISTLÄGE: Visa befintliga lönekörningar
  //    - Bläddra genom tidigare lönekörningar
  //    - Se status och framsteg för varje lönekörning
  //
  // 3. SPEC-LISTLÄGE: Hantera valda lönespecifikationer
  //    - Användbart när man arbetar med specifika lönespecar
  //    - Möjliggör återanvändning av AGI-logiken från andra delar av appen

  // ===== HUVUDTILLSTÅND =====
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nyLonekorningModalOpen, setNyLonekorningModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const [valdLonekorning, setValdLonekorning] = useState<Lönekörning | null>(null);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const [lönekörningSpecar, setLönekörningSpecar] = useState<LönespecData[]>([]);

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
    useState<Date | null>(forvaldUtbetalningsdag());
  const [newLonekorningLoading, setNewLonekorningLoading] = useState(false);
  const [newLonekorningValdaAnstallda, setNewLonekorningValdaAnstallda] = useState<number[]>([]);
  const [newLonekorningSteg, setNewLonekorningSteg] = useState<"datum" | "anställda">("datum");

  // Modal states
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [showDeleteLönekorningModal, setShowDeleteLönekorningModal] = useState(false);
  const [showDeleteLönespecModal, setShowDeleteLönespecModal] = useState(false);
  const [deleteLönespecId, setDeleteLönespecId] = useState<number | null>(null);
  const [lönekörningAttTaBort, setLönekörningAttTaBort] = useState<Lönekörning | null>(null);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);

  // Data states
  const [localAnställda, setLocalAnställda] = useState<AnställdListItem[]>([]);
  const [utlaggMap, setUtlaggMap] = useState<Record<number, UtläggData[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [företagsprofil, setFöretagsprofil] = useState<
    import("../types/types").Företagsprofil | null
  >(null);

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

  const batchData: BatchDataItem[] = prepareBatchData(lönekörningSpecar, anstallda || []);

  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === "string") {
      const normalized = value
        .replace(/\s+/g, "")
        .replace(/[^\d,.-]/g, "")
        .replace(/,/g, ".");
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

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
      const socialaAvgifter = parseAmount(beräkningar?.socialaAvgifter ?? spec.sociala_avgifter);
      const skatt = parseAmount(beräkningar?.skatt ?? spec.skatt);

      totalSocialaAvgifter += isNaN(socialaAvgifter) ? 0 : socialaAvgifter;
      totalPersonalskatt += isNaN(skatt) ? 0 : skatt;
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
      const result = await hamtaLonespecifikationerForLonekorning(valdLonekorning.id);

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

  const handleTaBortLönekörning = (target?: Lönekörning) => {
    const kandidat = target ?? valdLonekorning;
    if (!kandidat) return;

    setLönekörningAttTaBort(kandidat);
    setShowDeleteLönekorningModal(true);
  };

  const handleTaBortLönekörningFrånLista = (target: Lönekörning) => {
    handleTaBortLönekörning(target);
  };

  const confirmDeleteLönekorning = async () => {
    const kandidat = lönekörningAttTaBort ?? valdLonekorning;
    if (!kandidat) return;

    setShowDeleteLönekorningModal(false);

    try {
      setTaBortLoading(true);
      const result = await taBortLonekorning(kandidat.id);

      if (result.success) {
        if (valdLonekorning?.id === kandidat.id) {
          setValdLonekorning(null);
        }
        setLonekorningar((prev) => prev.filter((l) => l.id !== kandidat.id));
        setInternalRefreshTrigger((prev) => prev + 1);
      } else {
        showToast(`Fel vid borttagning: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönekörning:", error);
      showToast("Ett oväntat fel uppstod vid borttagning", "error");
    } finally {
      setTaBortLoading(false);
      setLönekörningAttTaBort(null);
    }
  };

  const cancelDeleteLönekorning = () => {
    if (taBortLoading) return;
    setShowDeleteLönekorningModal(false);
    setLönekörningAttTaBort(null);
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
      const anställdaData = await hamtaAllaAnstallda();
      const anställdaListItems = mapAnställdaToListItems(anställdaData);
      setLocalAnställda(anställdaListItems);

      const utlaggPromises = anställdaListItems.map((a) => hamtaUtlagg(a.id));
      const utlaggResults = await Promise.all(utlaggPromises);
      const utlaggMap: Record<number, UtläggData[]> = {};
      anställdaListItems.forEach((a, idx) => {
        utlaggMap[a.id] = utlaggResults[idx];
      });
      setUtlaggMap(utlaggMap);
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
      const result = await bokforLoneskatter({
        socialaAvgifter: skatteData.socialaAvgifter,
        personalskatt: skatteData.personalskatt,
        datum,
        kommentar: "Löneskatter från lönekörning",
      });

      if (result.success) {
        setSkatteToast({ type: "success", message: "Löneskatter bokförda!" });

        setTimeout(async () => {
          setSkatteModalOpen(false);
          const uppdateradeSpecar: number[] = [];
          for (const spec of lönekörningSpecar) {
            if (!spec.skatter_bokförda) {
              await markeraSkatternaBokforda(spec.id);
              uppdateradeSpecar.push(spec.id);
            }
          }
          if (uppdateradeSpecar.length > 0) {
            const markeraSkatter = (spec: (typeof lönekörningSpecar)[number]) =>
              uppdateradeSpecar.includes(spec.id)
                ? {
                    ...spec,
                    skatter_bokförda: true,
                  }
                : spec;

            setLönekörningSpecar((prev) => prev.map(markeraSkatter));
          }
        }, 2000);
      } else {
        setSkatteToast({
          type: "error",
          message: `Fel vid bokföring: ${result.error || "Okänt fel"}`,
        });
      }
    } catch (error: unknown) {
      console.error("❌ Fel vid bokföring av skatter:", error);
      setSkatteToast({
        type: "error",
        message: `Fel vid bokföring: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setSkatteBokförPågår(false);
    }
  };

  // Workflow handlers
  const handleBokför = async () => {
    if (valdLonekorning?.id) {
      setValdLonekorning((prev) =>
        prev ? { ...prev, aktuellt_steg: 3, bokford_datum: new Date() } : prev
      );
      try {
        await uppdateraLonekorningSteg(valdLonekorning.id, 3);
      } catch (error) {
        console.error("❌ Fel vid uppdatering av workflow:", error);
      }
    }
    setBokforModalOpen(true);
  };

  /**
   * ===== HUVUD-FUNKTIONEN FÖR AGI-GENERERING =====
   *
   * Denna funktion koordinerar hela processen att generera en AGI-fil:
   * 1. Validerar att alla nödvändiga data finns
   * 2. Konverterar BokförComs lönedata till Skatteverkets format
   * 3. Genererar XML enligt schema 1.1.17.1
   * 4. Laddar ner filen och uppdaterar workflow
   *
   * LÄRDOMAR FRÅN DEBUGGING:
   * - Företagsprofilen måste vara komplett (org.nr, telefon, e-post)
   * - Anställddata behöver personnummer i korrekt format
   * - Alla belopp måste vara positiva för att undvika schema-fel
   * - XML-strukturen måste följa Skatteverkets krav exakt
   */
  const handleGenereraAGI = async () => {
    if (valdLonekorning?.id) {
      try {
        // ===== SÄKERSTÄLL ATT FÖRETAGSPROFIL FINNS =====
        let profil = företagsprofil;
        if (!profil && session?.user?.id) {
          profil = await hamtaForetagsprofil(session.user.id);
          if (!profil) {
            showToast("Företagsinfo saknas – fyll i under Inställningar", "error");
            return;
          }
          setFöretagsprofil(profil);
        }

        // ===== VALIDERING AV FÖRETAGSDATA =====
        // KRITISKT: Skatteverket kräver komplett företagsinformation för AGI
        if (!profil?.organisationsnummer || !profil?.telefonnummer || !profil?.epost) {
          showToast(
            "Företagsprofilen saknar nödvändiga uppgifter för AGI-generering. Kontrollera organisationsnummer, telefon och e-post i företagsprofilen.",
            "error"
          );
          return;
        }

        // ===== HÄMTA FULLSTÄNDIG ANSTÄLLDDATA =====
        // Behöver komplett data med personnummer, adresser etc för XML-generering
        const fullAnställdaData = await hamtaAllaAnstallda();

        // ===== IMPORT AV AGI-FUNKTIONER =====
        // Dynamisk import för att undvika beroendeproblem
        const { convertLonespecToAGI, generateAGIXML } = await import("../utils/agiUtils");

        // ===== KONVERTERING TILL AGI-FORMAT =====
        // Här scer konverteringen från BokförComs interna format till Skatteverkets krav
        // Denna funktion hanterar alla kritiska formateringar som upptäcktes under debugging
        const agiData = convertLonespecToAGI(
          lönekörningSpecar, // Valda lönespecifikationer
          fullAnställdaData || [], // Anställdas personuppgifter
          { ...profil, [Symbol.for("__typename")]: undefined }, // Företagsuppgifter (ta bort GraphQL-metadata)
          valdLonekorning.period || new Date().toISOString().substring(0, 7) // Period i YYYY-MM format
        );

        // ===== XML-GENERERING =====
        // Skapar den faktiska XML-filen enligt Skatteverkets schema 1.1.17.1
        const xmlContent = generateAGIXML(agiData);

        // ===== FILNEDLADDNING =====
        // Skapa och ladda ner XML-filen till användarens dator
        const blob = new Blob([xmlContent], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Filnamn enligt mönster: AGI_[organisationsnummer]_[YYYYMM].xml
        a.download = `AGI_${profil.organisationsnummer}_${agiData.redovisningsperiod}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Rensa minne

        // ===== UPPDATERA WORKFLOW-STATUS =====
        // Markera att AGI har genererats och flytta till nästa steg (4)
        setValdLonekorning((prev) =>
          prev ? { ...prev, aktuellt_steg: 4, agi_genererad_datum: new Date() } : prev
        );
        await uppdateraLonekorningSteg(valdLonekorning.id, 4);

        // ===== BEKRÄFTA FRAMGÅNG =====
        showToast(
          `AGI-fil genererad och nedladdad: AGI_${profil.organisationsnummer}_${agiData.redovisningsperiod}.xml`,
          "success"
        );
      } catch (error) {
        // ===== FELHANTERING =====
        // Logga detaljerad information för debugging
        console.error("❌ Fel vid AGI-generering:", error);
        showToast(
          "Fel vid AGI-generering: " + (error instanceof Error ? error.message : "Okänt fel"),
          "error"
        );
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
        await uppdateraLonekorningSteg(valdLonekorning.id, 5);
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
          const anställdaData = await hamtaAllaAnstallda();
          const anställdaListItems = mapAnställdaToListItems(anställdaData);
          setLocalAnställda(anställdaListItems);

          const utlaggPromises = anställdaListItems.map((a) => hamtaUtlagg(a.id));
          const utlaggResults = await Promise.all(utlaggPromises);
          const utlaggMap: Record<number, UtläggData[]> = {};
          anställdaListItems.forEach((a, idx) => {
            utlaggMap[a.id] = utlaggResults[idx];
          });
          setUtlaggMap(utlaggMap);
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
    if (!valdLonekorning) return;

    const loadSpecar = async () => {
      try {
        setLoading(true);
        const result = await hamtaLonespecifikationerForLonekorning(valdLonekorning.id);

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

    loadSpecar();
  }, [valdLonekorning]);

  // Lista mode effect
  useEffect(() => {
    if (!enableListMode) return;

    const loadLonekorningar = async () => {
      try {
        setListLoading(true);
        const result = await hamtaAllaLonekorningar();

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

    loadLonekorningar();
  }, [enableListMode]); // New lönekörning modal effect
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
        const profile = await hamtaForetagsprofil(session?.user?.id || "");
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
  function prepareBatchData(specData: LönespecData[], allEmployees: AnställdListItem[]) {
    return specData
      .map((spec) => {
        const anställd = allEmployees.find((a) => a.id === spec.anställd_id);
        if (!anställd) {
          console.warn(
            `Anställd med id ${spec.anställd_id} hittades inte för lönespec ${spec.id}.`
          );
          return null;
        }

        // ✅ Extrarader kommer nu direkt från databasen via lönespec
        // Fallback till extrarader prop om den finns (för kompatibilitet)
        const specExtrarader = spec.extrarader || extrarader?.[spec.id] || [];

        return {
          lönespec: spec,
          anställd,
          företagsprofil,
          extrarader: specExtrarader,
          beräknadeVärden: beräknadeVärden?.[spec.id] || {},
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

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
      const result = await hamtaAllaLonekorningar();

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

  const deletePeriodLabel = lönekörningAttTaBort?.period
    ? formatPeriodName(lönekörningAttTaBort.period)
    : "";

  // Spec lista mode functions
  const specListHandleTaBortLönespec = async (spec: LönespecData) => {
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
    if (!lönekörningSpecar.length) {
      showToast("Det finns inga lönespecifikationer att exportera.", "info");
      return;
    }

    const harDatum =
      Boolean(utbetalningsdatum) ||
      lönekörningSpecar.some((spec) => Boolean(spec.utbetalningsdatum));

    if (!harDatum) {
      showToast("Ange ett utbetalningsdatum innan du skapar Bankgirofil.", "error");
      return;
    }

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

    handleBokför();
  };

  /**
   * ===== WRAPPER FÖR AGI-GENERERING I LISTLÄGE =====
   *
   * Hanterar AGI-generering både när hooken används som del av en lönekörning
   * och när den används i listläge med externa callbacks.
   *
   * Denna flexibilitet gör det möjligt att återanvända samma AGI-logik
   * i olika delar av applikationen.
   */
  const specListHandleGenereraAGI = () => {
    if (onSpecListGenereraAGI) {
      // Extern callback från parent-komponent (t.ex. annan sida)
      onSpecListGenereraAGI();
      return;
    }
    // Använd intern AGI-generering
    handleGenereraAGI();
  };

  /**
   * ===== WRAPPER FÖR SKATTEBOKFÖRING =====
   *
   * Hanterar bokföring av skatter - sista steget i lönekörningsprocessen
   */
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
      onClick: onSpecListMailaSpecar || (() => {}), // Callback hanteras nu av parent komponent
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
    const uppdateradeSpecar: number[] = [];
    for (const spec of lönekörningSpecar) {
      if (!spec.agi_genererad) {
        await markeraAGIGenererad(spec.id);
        uppdateradeSpecar.push(spec.id);
      }
    }

    if (uppdateradeSpecar.length > 0) {
      const markeraAgi = (spec: (typeof lönekörningSpecar)[number]) =>
        uppdateradeSpecar.includes(spec.id)
          ? {
              ...spec,
              agi_genererad: true,
            }
          : spec;

      setLönekörningSpecar((prev) => prev.map(markeraAgi));
    }
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

    // ===== VALIDERA ANSTÄLLDA INNAN LÖNESPEC-SKAPANDE =====
    // Kolla att alla valda anställda har obligatoriska fält
    const valideringsResultat = valideraFlertalsAnställda(anstallda, newLonekorningValdaAnstallda);

    if (valideringsResultat.length > 0) {
      const felmeddelande = skapaValideringsFelmeddelande(valideringsResultat);
      showToast(felmeddelande, "error");

      // Lista specifika anställda med problem i konsolen för debugging
      console.warn("⚠️ Valideringsfel för anställda:", valideringsResultat);
      return;
    }

    setNewLonekorningLoading(true);
    try {
      // Skapa lönekörning med period baserat på utbetalningsdatum
      const period = newLonekorningUtbetalningsdatum.toISOString().substring(0, 7); // YYYY-MM
      const lönekörningResult = await skapaLonekorning(period);

      if (!lönekörningResult.success) {
        showToast(lönekörningResult.error || "Kunde inte skapa lönekörning", "error");
        return;
      }

      // Skapa lönespecifikationer för valda anställda
      const lönespecResult = await skapaLonespecifikationerForLonekorning(
        lönekörningResult.data!.id,
        newLonekorningUtbetalningsdatum,
        newLonekorningValdaAnstallda
      );

      if (!lönespecResult.success) {
        showToast(lönespecResult.error || "Kunde inte skapa lönespecifikationer", "error");
        return;
      }

      // Reset state for next time
      setNewLonekorningUtbetalningsdatum(forvaldUtbetalningsdag());
      setNewLonekorningSteg("datum");
      setNewLonekorningValdaAnstallda([]);

      // Anropa callback - parent ansvarar för att stänga modal
      if (lönekörningResult.data) {
        onLonekorningCreated?.(lönekörningResult.data);
      }

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
    bokforModalOpen,
    setBokforModalOpen,
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
    lönekörningAttTaBort,
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
    batchData,
    deletePeriodLabel,
    // Functions
    beräknaSkatteData,
    hanteraBokförSkatter,
    hanteraTaBortSpec,
    loadLönekörningSpecar,
    handleTaBortLönekörning,
    handleTaBortLönekörningFrånLista,
    confirmDeleteLönekorning,
    cancelDeleteLönekorning,
    confirmDeleteLönespec,
    refreshData,
    handleBokför,
    handleGenereraAGI,
    handleBokförSkatter,
    handleRefreshData,
    hanteraAGI,
    // Lista mode functions
    loadLonekorningar,
    formatPeriodName,
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

import { useState } from "react";
import { RAD_KONFIGURATIONER } from "../utils/extraradDefinitioner";
import { bokförLöneutbetalning } from "../actions/bokforingActions";
import type {
  WizardBokföringsPost,
  LönespecData,
  ExtraradData,
  BeräknadeVärden,
} from "../types/types";

// Mapping från extrarad-typ till bokföringskonto - SINGLE SOURCE OF TRUTH
const EXTRARAD_TILL_KONTO: Record<string, { konto: string; kontoNamn: string }> = {
  // Skattepliktiga förmåner
  boende: { konto: "7381", kontoNamn: "Kostnader för fri bostad" },
  gratisFrukost: { konto: "7382", kontoNamn: "Kostnader för fria eller subventionerade måltider" },
  gratisLunchMiddag: {
    konto: "7382",
    kontoNamn: "Kostnader för fria eller subventionerade måltider",
  },
  gratisMat: { konto: "7382", kontoNamn: "Kostnader för fria eller subventionerade måltider" },
  ranteforman: { konto: "7386", kontoNamn: "Subventionerad ränta" },
  forsakring: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },
  parkering: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },
  annanForman: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },

  // Semester
  semestertillagg: { konto: "7285", kontoNamn: "Semesterlöner till tjänstemän" },
  semesterskuld: { konto: "7285", kontoNamn: "Semesterlöner till tjänstemän" },

  // Övertid och tillägg
  overtid: { konto: "7210", kontoNamn: "Löner till tjänstemän" },
  obTillagg: { konto: "7210", kontoNamn: "Löner till tjänstemän" },
  risktillagg: { konto: "7210", kontoNamn: "Löner till tjänstemän" },

  // Avdrag (obetald frånvaro dras av från lönen)
  obetaldFranvaro: { konto: "7210", kontoNamn: "Löner till tjänstemän" },

  // Skattefria ersättningar
  resersattning: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
  logi: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
  uppehalleInrikes: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
  uppehalleUtrikes: { konto: "7323", kontoNamn: "Skattefria traktamenten, utlandet" },
  annanKompensation: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
  privatBil: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },

  // Företagsbilsförmåner
  foretagsbil: { konto: "7385", kontoNamn: "Kostnader för fri bil" },
  foretagsbilBensinDiesel: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },
  foretagsbilEl: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },

  // Manuella poster
  manuellPost: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
};

// Validering för att säkerställa konsistens mellan definitions och mappningar
const validateExtraradMapping = () => {
  if (typeof window === "undefined") return; // Skip på server-side

  const definieradeTyper = Object.keys(RAD_KONFIGURATIONER);
  const bokföringsTyper = Object.keys(EXTRARAD_TILL_KONTO);

  // Kontrollera saknade mappningar för skattepliktiga/skattefria extrarader
  const skattepliktigaTyper = definieradeTyper.filter(
    (typ) => RAD_KONFIGURATIONER[typ].skattepliktig === true
  );
  const skattefriaTyper = definieradeTyper.filter(
    (typ) => RAD_KONFIGURATIONER[typ].skattepliktig === false
  );

  const saknarBokföring = [...skattepliktigaTyper, ...skattefriaTyper].filter(
    (typ) => !bokföringsTyper.includes(typ)
  );

  // Kontrollera onödiga mappningar (typ som inte finns i definitionen)
  const onödigaMappningar = bokföringsTyper.filter((typ) => !definieradeTyper.includes(typ));

  // Logga varningar i development mode
  if (process.env.NODE_ENV === "development") {
    if (saknarBokföring.length > 0) {
      console.warn("🚨 BokforLoner: Saknar bokföringskonton för extraradtyper:", saknarBokföring);
      console.warn("Lägg till dem i EXTRARAD_TILL_KONTO mappningen");
    }

    if (onödigaMappningar.length > 0) {
      console.warn(
        "⚠️ BokforLoner: Onödiga bokföringsmappningar (typ finns ej i definitionen):",
        onödigaMappningar
      );
    }
  }

  return {
    saknarBokföring,
    onödigaMappningar,
    ärKonsistent: saknarBokföring.length === 0 && onödigaMappningar.length === 0,
  };
};

interface UseBokföringslogikProps {
  lönespec: LönespecData;
  extrarader: ExtraradData[];
  beräknadeVärden: BeräknadeVärden;
  anställdNamn: string;
  onBokfört?: () => void;
  onClose: () => void;
}

export function useBokföringslogik({
  lönespec,
  extrarader,
  beräknadeVärden,
  anställdNamn,
  onBokfört,
  onClose,
}: UseBokföringslogikProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Validera mappningen vid första rendering (endast i development)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    validateExtraradMapping();
  }

  // Analysera extrarader och mappa till konton
  const analyseraBokföringsposter = (): WizardBokföringsPost[] => {
    const poster: WizardBokföringsPost[] = [];

    // Använd ENDAST de redan beräknade värdena - SINGLE SOURCE OF TRUTH
    const bruttolön = beräknadeVärden.bruttolön || 0;
    const totalSkatt = beräknadeVärden.skatt || 0;
    const totalNettolön = beräknadeVärden.nettolön || 0;

    // Analysera extrarader för specifika konton baserat på typ
    let reraFörmåner = 0; // Endast förmåner som behöver motkonto (7385, 7381-7389 utom 7399)
    const kontoSummor: Record<string, { kontoNamn: string; belopp: number }> = {};

    extrarader.forEach((rad) => {
      const typ = rad.typ; // Detta är nyckeln från RAD_KONFIGURATIONER
      const belopp = parseFloat(rad.kolumn3 || "0") || 0;

      if (belopp === 0) return;

      // Använd mappning istället för string-matching
      const kontoInfo = EXTRARAD_TILL_KONTO[typ];
      if (kontoInfo) {
        // Gruppera belopp per konto (behåll negativt belopp för avdrag)
        if (!kontoSummor[kontoInfo.konto]) {
          kontoSummor[kontoInfo.konto] = { kontoNamn: kontoInfo.kontoNamn, belopp: 0 };
        }
        kontoSummor[kontoInfo.konto].belopp += belopp; // Behåll riktigt belopp (kan vara negativt)

        // Kategorisera för motkonton
        const radKonfig = RAD_KONFIGURATIONER[typ];
        if (radKonfig?.skattepliktig) {
          // Förmånskonton (7381-7389) behöver motkonto, inte lönetillägg
          const kontoNummer = kontoInfo.konto;
          if (kontoNummer >= "7381" && kontoNummer <= "7389") {
            reraFörmåner += Math.abs(belopp);
          }
        } else {
          // Kategorisera som skattefri ersättning (används inte längre i bokföringen)
        }
      }
    });

    // Lägg till extraradsposter
    Object.entries(kontoSummor).forEach(([konto, { kontoNamn, belopp }]) => {
      poster.push({
        konto,
        kontoNamn,
        debet: Number(Math.round(belopp * 100) / 100),
        kredit: 0,
        beskrivning: kontoNamn,
      });
    });

    // HUVUDPOSTER

    // Beräkna semestertillägg separat (ska på 7285, inte 7210)
    let semestertillägBelopp = 0;
    extrarader.forEach((rad) => {
      const typ = rad.typ;
      const belopp = parseFloat(rad.kolumn3 || "0") || 0;
      if (typ === "semestertillagg" && belopp > 0) {
        semestertillägBelopp += belopp;
      }
    });

    // Bokio-quirk: Beräkna sjuk-justering tidigt för kontantlön-beräkning
    const harSjukavdrag = extrarader.some(
      (rad) =>
        rad.typ &&
        (rad.typ.includes("sjuk") ||
          rad.typ.includes("karens") ||
          rad.typ.includes("reducerade") ||
          rad.typ.includes("vård"))
    );
    const sjukJustering = harSjukavdrag ? 0.01 : 0;

    // Använd kontantlön direkt från beräknadeVärden (redan korrigerad för avdrag)
    // Men dra av semestertillägg som ska på separat konto och sjuk-justering
    const kontantlön =
      (beräknadeVärden.kontantlön || bruttolön - reraFörmåner) -
      semestertillägBelopp -
      sjukJustering;

    // 1. Löner till tjänstemän (7210) - kontantlön MINUS semestertillägg
    if (kontantlön > 0) {
      // Ta bort eventuell tidigare 7210-post från extrarader för att undvika dubletter
      const befintlig7210Index = poster.findIndex((p) => p.konto === "7210");
      if (befintlig7210Index !== -1) {
        poster.splice(befintlig7210Index, 1);
      }

      poster.push({
        konto: "7210",
        kontoNamn: "Löner till tjänstemän",
        debet: Number(Math.round(kontantlön * 100) / 100),
        kredit: 0,
        beskrivning: "Kontantlön",
      });
    }

    if (harSjukavdrag) {
      poster.push({
        konto: "7281",
        kontoNamn: "Sjuklöner till tjänstemän",
        debet: 0,
        kredit: 0.01,
        beskrivning: "Sjuklön justering",
      });
    }

    // 2. Motkonto skattepliktiga förmåner (7399) - endast för rena förmåner
    if (reraFörmåner > 0) {
      poster.push({
        konto: "7399",
        kontoNamn: "Motkonto skattepliktiga förmåner",
        debet: 0,
        kredit: Number(Math.round(reraFörmåner * 100) / 100),
        beskrivning: "Motkonto förmåner",
      });
    }

    // 3. SOCIALA AVGIFTER - Dela upp enligt Bokios modell

    // Beräkna total kontantlön för sociala avgifter (7210 + 7285)
    const totalKontantlönFörSocialaAvgifter = kontantlön + semestertillägBelopp;

    // 7510: Lagstadgade sociala avgifter på kontantlön (inklusive semestertillägg)
    const socialaAvgifterKontant =
      Math.round(totalKontantlönFörSocialaAvgifter * 0.3142 * 100) / 100;
    if (socialaAvgifterKontant > 0) {
      poster.push({
        konto: "7510",
        kontoNamn: "Lagstadgade sociala avgifter",
        debet: Number(socialaAvgifterKontant),
        kredit: 0,
        beskrivning: "Sociala avgifter kontantlön",
      });
    }

    // Analysera förmåner för 7515
    let förmånerFör7515 = 0; // Andra skattepliktiga förmåner som får 7515

    // Dela upp förmånerna baserat på konto
    Object.entries(kontoSummor).forEach(([konto, { belopp }]) => {
      const radKonfig =
        RAD_KONFIGURATIONER[
          Object.keys(RAD_KONFIGURATIONER).find((typ) => {
            const mapping = EXTRARAD_TILL_KONTO[typ];
            return mapping && mapping.konto === konto;
          }) || ""
        ];

      if (radKonfig?.skattepliktig && belopp > 0) {
        const kontoNummer = konto;
        if (kontoNummer >= "7381" && kontoNummer <= "7389") {
          // Alla förmåner 7381-7389 bokförs på 7515 enligt Bokio
          förmånerFör7515 += belopp;
        }
      }
    });

    // 7512: Sociala avgifter för specifika förmånsvärden
    // 7512 borttagen enligt Bokio-modell

    // 7515: Sociala avgifter på skattepliktiga kostnadsersättningar
    if (förmånerFör7515 > 0) {
      const socialaAvgifterFörmåner7515 = Math.round(förmånerFör7515 * 0.3142 * 100) / 100;
      poster.push({
        konto: "7515",
        kontoNamn: "Sociala avgifter på skattepliktiga kostnadsersättningar",
        debet: Number(socialaAvgifterFörmåner7515),
        kredit: 0,
        beskrivning: "Sociala avgifter förmåner",
      });
    }

    // SKULDER

    // 5. Personalskatt (2710)
    if (totalSkatt > 0) {
      poster.push({
        konto: "2710",
        kontoNamn: "Personalskatt",
        debet: 0,
        kredit: Number(Math.round(totalSkatt * 100) / 100),
        beskrivning: "Personalskatt",
      });
    }

    // 6. Avräkning lagstadgade sociala avgifter (2731) - summa av faktiska debetposter
    let totalAllaSocialaAvgifter = 0;

    // Hitta alla sociala avgifter-poster som redan lagts till
    poster.forEach((post) => {
      if (post.konto === "7510" || post.konto === "7515") {
        totalAllaSocialaAvgifter += post.debet;
      }
    });

    if (totalAllaSocialaAvgifter > 0) {
      poster.push({
        konto: "2731",
        kontoNamn: "Avräkning lagstadgade sociala avgifter",
        debet: 0,
        kredit: Number(Math.round(totalAllaSocialaAvgifter * 100) / 100),
        beskrivning: "Skuld sociala avgifter",
      });
    }

    // 7. Företagskonto (1930) - ENDAST nettolön (ej skattefria ersättningar)
    if (totalNettolön > 0) {
      poster.push({
        konto: "1930",
        kontoNamn: "Företagskonto / affärskonto",
        debet: 0,
        kredit: Number(Math.round(totalNettolön * 100) / 100),
        beskrivning: "Nettolön utbetalning",
      });
    }

    return poster.filter((p) => p.debet > 0 || p.kredit > 0);
  };

  const handleBokför = async () => {
    if (!lönespec?.id) {
      setError("Ingen lönespecifikation vald");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Skicka hela arrayen med bokföringsposter till backend
      const poster = analyseraBokföringsposter();
      const result = await bokförLöneutbetalning({
        lönespecId: lönespec.id,
        bokföringsPoster: poster,
        extrarader,
        beräknadeVärden,
        anställdNamn,
        period: lönespec.månad && lönespec.år ? `${lönespec.månad}/${lönespec.år}` : "",
        utbetalningsdatum: new Date().toISOString().split("T")[0],
      });

      setToast({
        message: result.message || "Bokföring genomförd",
        type: "success",
        isVisible: true,
      });

      // Vänta lite så användaren hinner se toast:en innan modalen stängs
      setTimeout(() => {
        onBokfört?.();
        onClose();
      }, 2000); // Stäng efter 2 sekunder
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ett fel inträffade vid bokföring";
      setError(errorMessage);
      console.error("Bokföringsfel:", error);
    } finally {
      setLoading(false);
    }
  };

  // Beräkna poster och totaler för UI
  const poster = analyseraBokföringsposter();
  const totalDebet = poster.reduce((sum, p) => sum + Number(p.debet), 0);
  const totalKredit = poster.reduce((sum, p) => sum + Number(p.kredit), 0);
  const ärBalanserad = Math.abs(totalDebet - totalKredit) < 0.01;

  return {
    // State
    loading,
    error,
    toast,
    setToast,

    // Beräknade värden
    poster,
    totalDebet,
    totalKredit,
    ärBalanserad,

    // Functions
    handleBokför,
    analyseraBokföringsposter,
  };
}

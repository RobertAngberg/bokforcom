// beräknaTotalsummaAutomatiskt: true = antal × belopp per enhet (räkna ut totalsumman automatiskt)
// beräknaTotalsummaAutomatiskt: false = användaren matar in totalsumman direkt

/**
 * Systemet fungerar genom att:
 * 1. Läsa konfiguration från extraradDefinitioner.ts
 * 2. Skapa dynamiska formulär baserat på konfigurationen
 * 3. Beräkna totalsummor baserat på användarens input
 * 4. Formatera värden för visning i UI:t
 *
 * Huvudkonfigurationen finns i RAD_KONFIGURATIONER som definierar:
 * - Vilka fält som ska visas (antal, belopp, kommentar)
 * - Hur beräkningar ska göras (fasta värden vs användardefinierade)
 * - Hur värden ska formateras och valideras
 */

import { RAD_KONFIGURATIONER, RadKonfiguration } from "./extraradDefinitioner";

/**
 * FILTRERAR RADER BASERAT PÅ SÖKTERM
 *
 * Används för att söka bland alla tillgängliga extraradtyper i dropdown-menyn.
 * Söker i radernas label-text och returnerar matchande resultat.
 *
 * @param rader - Array med alla tillgängliga rader {id, label}
 * @param sökterm - Texten användaren söker efter
 * @returns Filtrerade rader som matchar söktermen
 */
export function filtreraRader(rader: { id: string; label: string }[], sökterm: string) {
  if (!sökterm.trim()) return rader;
  return rader.filter((rad) => rad.label.toLowerCase().includes(sökterm.toLowerCase()));
}

/**
 * BERÄKNAR TOTALSUMMA FÖR EN EXTRARAD
 *
 * Denna funktion hanterar alla typer av beräkningar för extrarader:
 * 1. För rader med beräknaTotalt-funktion (t.ex. karensavdrag, daglön-baserade):
 *    Använder grundlön och antal för att beräkna automatiskt
 * 2. För rader utan beräknaTotalt (t.ex. försäkring, företagsbil):
 *    Använder antal × belopp som användaren anger manuellt
 * 3. Specialfall för text-input (t.ex. företagsbilmodell):
 *    Om antal inte är ett nummer, använder bara beloppet
 *
 * @param rowId - ID för extraradtypen (t.ex. "foretagsbilExtra", "karensavdrag")
 * @param modalFields - Formulärdata från användaren {kolumn2: antal, kolumn3: belopp}
 * @param grundlön - Användarens månadslön (behövs för automatiska beräkningar)
 * @returns Totalsumma som sträng
 */
export function beräknaSumma(rowId: string, modalFields: any, grundlön?: number) {
  const config = RAD_KONFIGURATIONER[rowId];

  // Automatiska beräkningar (karensavdrag, daglön-baserade avdrag, etc.)
  if (config?.beräknaTotalt && grundlön) {
    console.log("🔄 AUTOMATISK BERÄKNING");
    const antal = parseFloat(modalFields.kolumn2) || 0;

    if (!isNaN(antal)) {
      let summa = config.beräknaTotalt(grundlön, antal);

      // Hantera negativa belopp (avdrag)
      if (config.negativtBelopp) {
        summa = -Math.abs(summa);
      }

      return summa.toFixed(2);
    }
  }

  // KR-enheter utan belopp-fält (flyttat hit)
  if (config?.enhet === "kr" && !config.fält.beräknaTotalsummaAutomatiskt) {
    const summa = parseFloat(modalFields.kolumn2) || 0;
    if (config.negativtBelopp) {
      return (-Math.abs(summa)).toString();
    }
    return summa.toString();
  }

  // Om raden har beräknaTotalsummaAutomatiskt : true, spara totalsumman i kolumn3
  if (config?.fält.beräknaTotalsummaAutomatiskt) {
    const antal = parseFloat(modalFields.kolumn2);
    const beloppPerEnhet = parseFloat(modalFields.kolumn3) || 0;
    if (isNaN(antal)) return "0";
    const totalsumma = antal * beloppPerEnhet;
    return totalsumma.toFixed(2);
  }

  // Standard: antal × belopp
  const antal = parseFloat(modalFields.kolumn2);
  const belopp = parseFloat(modalFields.kolumn3) || 0;

  if (isNaN(antal)) {
    return belopp.toString();
  }

  const resultat = antal * belopp;
  return resultat.toString();
}

/**
 * FORMATERAR KOLUMN2-VÄRDET FÖR VISNING I TABELLEN
 *
 * Tar rå-värdet från kolumn2 och formaterar det för presentation baserat på
 * extraradtypen. Lägger till rätt enheter och formatering.
 *
 * Exempel:
 * - "5" + enhet "dagar" → "5 Dag"
 * - "100" + boende → "100m²"
 * - "3" + gratisFrukost → "3 Mål"
 *
 * @param rowId - ID för extraradtypen
 * @param modalFields - Formulärdata med råvärden
 * @returns Formaterat värde för visning
 */
export function formatKolumn2Värde(rowId: string, modalFields: any) {
  const config = RAD_KONFIGURATIONER[rowId];

  // Hantera dropdown-enheter (t.ex. semesterskuld: "5 Dag", "10 Timme")
  if (config?.fält.enhetDropdown && modalFields.enhet) {
    return `${modalFields.kolumn2} ${modalFields.enhet}`;
  }

  if (config) {
    const antal = modalFields.kolumn2;

    // Mappning från intern enhet till visningstext
    const enhetTexts: Record<string, string> = {
      dagar: "Dag",
      timmar: "Timme",
      st: "st",
      mål: "Mål",
      kvm: "m²",
      km: "km",
      kr: "", // Kronor visas utan enhet
    };

    const enhetText = enhetTexts[config.enhet] || "";

    // Specialfall för vissa extraradtyper
    if (rowId === "boende") return `${antal}m²`;
    if (rowId === "gratisFrukost" || rowId === "gratisLunchMiddag") return `${antal} Mål`;
    if (config.enhet === "kr") return antal; // Bara siffran för kronor
    if (enhetText) return `${antal} ${enhetText}`;
  }

  // Fallback: visa råvärdet
  return modalFields.kolumn2;
}

/**
 * INITIALISERAR FORMULÄRFÄLT FÖR NYA EXTRARADER
 *
 * Skapar default-värden för formuläret när användaren väljer en extraradtyp.
 * För automatiska beräkningar (t.ex. karensavdrag) förberäknas värdet.
 * För manuella poster (t.ex. försäkring) lämnas fälten tomma.
 *
 * @param rowId - ID för extraradtypen
 * @param grundlön - Användarens månadslön (för automatiska beräkningar)
 * @returns Initial state för formulärfälten
 */
export function initializeModalFields(rowId: string, grundlön?: number) {
  const config = RAD_KONFIGURATIONER[rowId];

  // För automatiska beräkningar: förberäkna värdet
  if (config?.beräknaVärde && grundlön) {
    const värde = config.beräknaVärde(grundlön);
    return {
      kolumn2: config.fält.beräknaTotalsummaAutomatiskt ? "1" : "", // Antal defaultar till 1 om belopp ska visas
      kolumn3: värde.toFixed(2), // Förberäknat värde
      kolumn4: "", // Tom kommentar
      enhet: config.fält.enhetDropdown ? config.fält.enhetDropdown[0] : "", // Första dropdown-alternativet
    };
  }

  // För manuella poster: tomma fält
  return {
    kolumn2: "",
    kolumn3: "",
    kolumn4: "",
    enhet: config?.fält.enhetDropdown ? config.fält.enhetDropdown[0] : "",
  };
}

/**
 * SKAPAR STANDARD FORMULÄRFÄLT
 *
 * Fallback-funktion som används när ingen specifik konfiguration finns.
 * Skapar grundläggande fält: Antal, Belopp, Kommentar.
 *
 * @param modalFields - Aktuella formulärvärden
 * @param setModalFields - State-setter för formulärfälten
 * @returns Array med formulärfält-objekt
 */
export function getStandardFields(modalFields: any, setModalFields: any) {
  return [
    {
      label: "Antal",
      name: "kolumn2",
      type: "text" as const,
      value: modalFields.kolumn2,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
      required: true,
      placeholder: "Ange antal",
    },
    {
      label: "à SEK",
      name: "kolumn3",
      type: "number" as const,
      value: modalFields.kolumn3,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setModalFields((f: any) => ({ ...f, kolumn3: e.target.value })),
      step: "0.01",
      required: true,
      placeholder: "Belopp per enhet",
    },
    {
      label: "Kommentar",
      name: "kolumn4",
      type: "text" as const,
      value: modalFields.kolumn4,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
      required: false,
      placeholder: "Valfri kommentar",
    },
  ];
}

/**
 * SKAPAR DYNAMISKA FORMULÄRFÄLT BASERAT PÅ EXTRARADTYP
 *
 * Detta är huvudfunktionen som bygger formuläret för varje extraradtyp.
 * Läser konfigurationen och skapar lämpliga fält:
 *
 * 1. Första fältet (kolumn2): Kan vara antal, modell, summa, etc.
 * 2. Dropdown för enhet (om konfigurerat): Timme/Dag/St för flexibla poster
 * 3. Beloppsfält (kolumn3): Visas endast om beräknaTotalsummaAutomatiskt  är true
 * 4. Kommentarsfält (kolumn4): Visas alltid utom om skipKommentar är true
 *
 * Exempel på olika konfigurationer:
 * - Karensavdrag: Antal + förberäknat belopp + kommentar
 * - Försäkring: Antal + manuellt belopp + kommentar
 * - Företagsbil: Modell (text) + manuellt belopp + kommentar
 * - Semesterskuld: Antal + enhetsdropdown + manuellt belopp + kommentar
 *
 * @param rowId - ID för extraradtypen
 * @param modalFields - Aktuella formulärvärden
 * @param setModalFields - State-setter för formulärfälten
 * @param grundlön - Användarens månadslön (för automatiska beräkningar)
 * @returns Array med formulärfält-objekt redo för rendering
 */
export function getFieldsForRow(
  rowId: string,
  modalFields: any,
  setModalFields: any,
  grundlön?: number
) {
  const config = RAD_KONFIGURATIONER[rowId];

  if (config) {
    // Specialfall: Obetald frånvaro – visa ENDAST summa och kommentar
    if (rowId === "obetaldFranvaro") {
      return [
        {
          label: config.fält.antalLabel, // "Summa"
          name: "kolumn2",
          type: "number",
          value: modalFields.kolumn2,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
          required: true,
          step: config.fält.step || "0.01",
          placeholder: config.fält.antalPlaceholder,
        },
        {
          label: "Kommentar",
          name: "kolumn4",
          type: "text" as const,
          value: modalFields.kolumn4,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
          required: false,
          placeholder: "Valfri kommentar",
        },
      ];
    }

    // Specialfall: Övertid – visa ENDAST summa och kommentar
    if (rowId === "overtid") {
      return [
        {
          label: config.fält.antalLabel, // "Summa"
          name: "kolumn2",
          type: "number",
          value: modalFields.kolumn2,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
          required: true,
          step: config.fält.step || "0.01",
          placeholder: config.fält.antalPlaceholder,
        },
        {
          label: "Kommentar",
          name: "kolumn4",
          type: "text" as const,
          value: modalFields.kolumn4,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
          required: false,
          placeholder: "Valfri kommentar",
        },
      ];
    }

    // Specialfall: OB-tillägg – visa ENDAST summa och kommentar
    if (rowId === "obTillagg") {
      return [
        {
          label: config.fält.antalLabel, // "Summa"
          name: "kolumn2",
          type: "number",
          value: modalFields.kolumn2,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
          required: true,
          step: config.fält.step || "0.01",
          placeholder: config.fält.antalPlaceholder,
        },
        {
          label: "Kommentar",
          name: "kolumn4",
          type: "text" as const,
          value: modalFields.kolumn4,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
          required: false,
          placeholder: "Valfri kommentar",
        },
      ];
    }

    // Specialfall: Risktillägg – visa ENDAST summa och kommentar
    if (rowId === "risktillagg") {
      return [
        {
          label: config.fält.antalLabel, // "Summa"
          name: "kolumn2",
          type: "number",
          value: modalFields.kolumn2,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
          required: true,
          step: config.fält.step || "0.01",
          placeholder: config.fält.antalPlaceholder,
        },
        {
          label: "Kommentar",
          name: "kolumn4",
          type: "text" as const,
          value: modalFields.kolumn4,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
          required: false,
          placeholder: "Valfri kommentar",
        },
      ];
    }

    const fields: any[] = [
      // FÖRSTA FÄLTET: Antal/Modell/Summa (beroende på extraradtyp)
      {
        label: config.fält.antalLabel, // "Antal", "Modell", "Summa", etc.
        name: "kolumn2",
        type: rowId === "foretagsbilExtra" ? "text" : "number",
        value: modalFields.kolumn2,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setModalFields((f: any) => ({ ...f, kolumn2: e.target.value })),
        required: true,
        min: rowId === "foretagsbilExtra" ? undefined : "0", // Ingen min-gräns för text
        step: config.fält.step || "1", // Steg för nummer-input
        placeholder: config.fält.antalPlaceholder, // Dynamisk placeholder
      },
    ];

    // ENHETSDROPDOWN: För flexibla poster som semesterskuld
    if (config.fält.enhetDropdown) {
      fields.push({
        label: "Enhet",
        name: "enhet",
        type: "select" as const,
        value: modalFields.enhet,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
          setModalFields((f: any) => ({ ...f, enhet: e.target.value })),
        required: true,
        options: config.fält.enhetDropdown, // ["Timme", "Dag", "St"]
      });
    }

    // BELOPPSFÄLT: Endast för manuella poster (när beräknaTotalsummaAutomatiskt är false)
    if (!config.fält.beräknaTotalsummaAutomatiskt) {
      fields.push({
        label: "å SEK",
        name: "kolumn3",
        type: "number" as const,
        value: modalFields.kolumn3,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setModalFields((f: any) => ({ ...f, kolumn3: e.target.value })),
        step: "0.01", // Tillåt ören
        required: true,
        // min: rowId === "nettolönejustering" ? undefined : "0", // ← TILLÅT NEGATIVA FÖR NETTOLÖNEJUSTERING
        // Använd custom placeholder eller fallback till generisk
        placeholder: config.fält.beloppPlaceholder || "Belopp per " + config.enhet,
      });
    }

    // KOMMENTARSFÄLT
    if (!config.fält.skipKommentar) {
      fields.push({
        label: "Kommentar",
        name: "kolumn4",
        type: "text" as const,
        value: modalFields.kolumn4,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setModalFields((f: any) => ({ ...f, kolumn4: e.target.value })),
        required: false,
        placeholder: "Valfri kommentar",
      });
    }

    return fields;
  }

  // FALLBACK: Om ingen konfiguration finns, använd standardfält
  return getStandardFields(modalFields, setModalFields);
}

import { useState } from "react";

interface UseBankgiroExportProps {
  anställda: any[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string, any>;
  onExportComplete?: () => void;
  onClose?: () => void;
  direktNedladdning?: boolean;
}

export function useBankgiroExport({
  anställda,
  utbetalningsdatum,
  lönespecar,
  onExportComplete,
  onClose,
  direktNedladdning = false,
}: UseBankgiroExportProps) {
  const [visaModal, setVisaModal] = useState(false);
  const [kundnummer, setKundnummer] = useState("123456");
  const [bankgironummer, setBankgironummer] = useState("123-1234");

  // Beräkna anställda med lönespecar och totaler
  const anställdaMedLönespec = anställda.filter((a) => lönespecar[a.id]);
  const totalBelopp = anställdaMedLönespec.reduce((sum, anställd) => {
    const lönespec = lönespecar[anställd.id];
    return sum + parseFloat(lönespec?.nettolön || 0);
  }, 0);

  // Format datum till YYMMDD
  const formatDatum = (datum: Date): string => {
    return datum.toISOString().slice(2, 10).replace(/-/g, "");
  };

  // Format bankgironummer
  const formatBankgiro = (nummer: string): string => {
    return nummer.replace("-", "").padStart(10, "0");
  };

  // Generera bankgirofil-innehåll
  const genereraBankgiroContent = (
    användarKundnummer?: string,
    användarBankgiro?: string
  ): string => {
    if (!utbetalningsdatum) return "";

    const datum = formatDatum(utbetalningsdatum);
    const bankgiroClean = formatBankgiro(användarBankgiro || bankgironummer);
    const använtKundnummer = användarKundnummer || kundnummer;

    let fil = "";

    // Header (01-post)
    const header = `01${datum}  LÖN${" ".repeat(46)}SEK${använtKundnummer.padStart(6, "0")}0001${bankgiroClean}  \n`;
    fil += header;

    // Betalningsposter (35-post) för varje anställd
    anställdaMedLönespec.forEach((anställd) => {
      const lönespec = lönespecar[anställd.id];
      const nettolön = Math.round(parseFloat(lönespec?.nettolön || 0) * 100); // Öre
      const clearingPadded = (anställd.clearingnummer || "0000").padStart(4, "0");
      const kontoPadded = (anställd.bankkonto || "0").padStart(10, "0");
      const beloppPadded = nettolön.toString().padStart(12, "0");
      const namn = `Lön ${anställd.förnamn} ${anställd.efternamn}`.substring(0, 12);

      const betalning = `35${datum}    ${clearingPadded}${kontoPadded}${beloppPadded}${" ".repeat(18)}${kontoPadded}${namn.padEnd(12, " ")}\n`;
      fil += betalning;
    });

    // Slutpost (09-post)
    const totalÖre = Math.round(totalBelopp * 100);
    const antalPoster = anställdaMedLönespec.length.toString().padStart(8, "0");
    const totalBeloppPadded = totalÖre.toString().padStart(12, "0");

    const slutpost = `09${datum}${" ".repeat(20)}${totalBeloppPadded}${antalPoster}${" ".repeat(40)}\n`;
    fil += slutpost;

    return fil;
  };

  // Ladda ner fil
  const laddaNerFil = (filInnehåll: string) => {
    if (!utbetalningsdatum) return;

    const datum = formatDatum(utbetalningsdatum);
    const blob = new Blob([filInnehåll], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loner_${datum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generera och ladda ner bankgirofil med användarinställningar
  const genereraBankgirofil = () => {
    if (!utbetalningsdatum) return;

    const filInnehåll = genereraBankgiroContent();
    laddaNerFil(filInnehåll);

    // Markera export som genomförd
    onExportComplete?.();
    setVisaModal(false);
  };

  // Direkt nedladdning utan modal (med defaults)
  const laddarNerDirekt = () => {
    if (!utbetalningsdatum) {
      alert("Utbetalningsdatum saknas!");
      return;
    }

    // Använd default-värden för snabb nedladdning
    const filInnehåll = genereraBankgiroContent("123456", "123456789");
    laddaNerFil(filInnehåll);

    // Markera export som genomförd
    onExportComplete?.();
    onClose?.();
  };

  // Modal control
  const öppnaModal = () => setVisaModal(true);
  const stängModal = () => {
    setVisaModal(false);
    onClose?.();
  };

  // Validering
  const kanGenerera = utbetalningsdatum && anställdaMedLönespec.length > 0;

  return {
    // State
    visaModal,
    kundnummer,
    setKundnummer,
    bankgironummer,
    setBankgironummer,

    // Computed values
    anställdaMedLönespec,
    totalBelopp,
    kanGenerera,

    // Actions
    genereraBankgirofil,
    laddarNerDirekt,
    öppnaModal,
    stängModal,

    // Utilities
    genereraBankgiroContent,
    formatDatum,
    formatBankgiro,
    laddaNerFil,
  };
}

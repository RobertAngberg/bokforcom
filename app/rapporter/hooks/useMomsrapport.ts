import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getMomsrapport, fetchFöretagsprofil } from "../actions/momsrapportActions";
import { MomsRad } from "../types/types";

export const useMomsrapport = () => {
  // State management
  const [initialData, setInitialData] = useState<MomsRad[]>([]);
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [år, setÅr] = useState("2025");
  const [activeId, setActiveId] = useState<string | number | null>(null);

  // Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingXML, setIsExportingXML] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>("");

  // Constants
  const årLista = ["2023", "2024", "2025"];

  // Data fetching effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(""); // Rensa tidigare fel

        const [momsData, profilData] = await Promise.all([
          getMomsrapport(år),
          fetchFöretagsprofil(),
        ]);

        // Validera data
        if (!momsData) {
          throw new Error(`Kunde inte ladda momsdata för år ${år}`);
        }

        if (!profilData) {
          console.warn("Kunde inte ladda företagsprofil - fortsätter utan");
        }

        setInitialData(momsData);
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
        setFöretagsnamn(profilData?.företagsnamn ?? "Okänt företag");

        console.log(`Momsdata laddad för ${år}: ${momsData.length} rader`);
      } catch (error) {
        console.error("Fel vid laddning av momsdata:", error);
        const errorMessage =
          error instanceof Error ? error.message : `Kunde inte ladda momsdata för år ${år}`;
        setError(errorMessage);
        setExportMessage(errorMessage);
        setTimeout(() => setExportMessage(""), 5000);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [år]); // Re-load when year changes

  // Helper functions
  const get = (fält: string) => initialData.find((r) => r.fält === fält)?.belopp ?? 0;
  const sum = (...fält: string[]) => fält.reduce((acc, f) => acc + get(f), 0);

  const generateXML = () => {
    // Mapping från fält till XML-taggar enligt Skatteverkets specifikation
    // Baserat på eSKDUpload DTD Version 6.0
    const fieldMapping: { [key: string]: string } = {
      "05": "ForsMomsEjAnnan", // Momspliktig försäljning exkl. andra fält
      "06": "UttagMoms", // Momspliktiga uttag
      "07": "UlagMargbesk", // Försäljning med vinstmarginalmetoden
      "08": "HyrinkomstFriv", // Hyresinkomster med frivillig moms
      "10": "MomsUtgHog", // Utgående moms 25%
      "11": "MomsUtgMedel", // Utgående moms 12%
      "12": "MomsUtgLag", // Utgående moms 6%
      "20": "InkopVaruAnnatEg", // Inköp varor från annat EU-land
      "21": "InkopTjanstAnnatEg", // Inköp tjänster från annat EU-land
      "22": "InkopTjanstUtomEg", // Inköp tjänster från utanför EU
      "23": "InkopVaruSverige", // Inköp varor i Sverige med omvänd moms
      "24": "InkopTjanstSverige", // Inköp tjänster i Sverige med omvänd moms
      "30": "MomsInkopUtgHog", // Utgående moms 25% på inköp (omvänd)
      "31": "MomsInkopUtgMedel", // Utgående moms 12% på inköp (omvänd)
      "32": "MomsInkopUtgLag", // Utgående moms 6% på inköp (omvänd)
      "35": "ForsVaruAnnatEg", // Försäljning varor till annat EU-land
      "36": "ForsVaruUtomEg", // Export varor utanför EU
      "37": "InkopVaruMellan3p", // 3-partshandel inköp
      "38": "ForsVaruMellan3p", // 3-partshandel försäljning
      "39": "ForsTjSkskAnnatEg", // Försäljning tjänster skatteskyldighet EU
      "40": "ForsTjOvrUtomEg", // Försäljning tjänster utanför EU
      "41": "ForsKopareSkskSverige", // Försäljning köpare skattskyldighet Sverige
      "42": "ForsOvrigt", // Övrigt momsundantaget
      "48": "MomsIngAvdr", // Ingående moms att dra av
      "49": "MomsBetala", // Moms att betala/få tillbaka
      "50": "MomsUlagImport", // Beskattningsunderlag import
      "60": "MomsImportUtgHog", // Utgående moms 25% import
      "61": "MomsImportUtgMedel", // Utgående moms 12% import
      "62": "MomsImportUtgLag", // Utgående moms 6% import
    };

    // Formatera period: År + 12 för helårsrapport
    const period = `${år}12`;

    // Bygg XML enligt Skatteverkets eSKDUpload DTD Version 6.0
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml +=
      '<!DOCTYPE eSKDUpload PUBLIC "-//Skatteverket, Sweden//DTD Skatteverket eSKDUpload-DTD Version 6.0//SV" "https://www.skatteverket.se/download/18.3f4496fd14864cc5ac99cb1/1415022101213/eSKDUpload_6p0.dtd">\n';
    xml += '<eSKDUpload Version="6.0">\n';
    xml += `  <OrgNr>${organisationsnummer}</OrgNr>\n`;
    xml += "  <Moms>\n";
    xml += `    <Period>${period}</Period>\n`;

    // Lägg till fält som har värden
    let fieldsAdded = 0;
    Object.entries(fieldMapping).forEach(([fältNr, xmlTag]) => {
      const värde = get(fältNr);
      if (värde !== 0) {
        // Skatteverket kräver heltal (inga decimaler)
        const belopp = Math.round(värde);
        xml += `    <${xmlTag}>${belopp}</${xmlTag}>\n`;
        fieldsAdded++;
      }
    });

    xml += "  </Moms>\n";
    xml += "</eSKDUpload>";

    // Log för debugging
    console.log(`XML genererad: ${fieldsAdded} fält inkluderade för period ${period}`);

    return xml;
  };

  // Export functions
  const exportXML = () => {
    setIsExportingXML(true);
    setExportMessage("");

    try {
      // Validera att vi har organisationsnummer
      if (!organisationsnummer || organisationsnummer === "XXXXXX-XXXX") {
        throw new Error("Organisationsnummer saknas - kan inte skapa XML för Skatteverket");
      }

      // Validera att vi har någon momsdata
      const harData = fullData.some((rad) => rad.belopp !== 0);
      if (!harData) {
        throw new Error("Ingen momsdata att exportera");
      }

      const xmlContent = generateXML();

      // Validera att XML:en genererades korrekt
      if (!xmlContent.includes("<Moms>")) {
        throw new Error("XML-generering misslyckades");
      }

      const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `momsdeklaration_${år}_${organisationsnummer.replace("-", "")}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage(`XML-fil för Skatteverket har laddats ner (${år})`);
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("XML export error:", error);
      const errorMessage = error instanceof Error ? error.message : "Fel vid XML export";
      setExportMessage(errorMessage);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingXML(false);
    }
  };

  const exportPDF = async () => {
    setIsExportingPDF(true);
    setExportMessage("");

    try {
      const element = document.getElementById("momsrapport-print-area");
      if (!element) {
        throw new Error("Kunde inte hitta rapporten för export");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: false,
      });

      const imageData = canvas.toDataURL("image/png");
      if (
        imageData ===
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      ) {
        throw new Error("Canvas är tom!");
      }

      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = 210;
      const imgWidth = pdfWidth - 15;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imageData, "PNG", 7.5, 5, imgWidth, imgHeight);
      pdf.save(`momsrapport-${år}-${företagsnamn.replace(/\s+/g, "-")}.pdf`);

      setExportMessage("PDF-rapporten har laddats ner");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("PDF export error:", error);
      setExportMessage("Fel vid PDF export");
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportCSV = async () => {
    setIsExportingCSV(true);
    setExportMessage("");

    try {
      // Skapa CSV data
      const csvRows = [];

      // Header med företagsinformation
      csvRows.push([`Momsrapport för ${företagsnamn || "Företag"}`]);
      csvRows.push([`Organisationsnummer: ${organisationsnummer || "N/A"}`]);
      csvRows.push([`År: ${år}`]);
      csvRows.push([`Genererad: ${new Date().toLocaleDateString("sv-SE")}`]);
      csvRows.push([]); // Tom rad

      // Tabellhuvud
      csvRows.push(["Fält", "Beskrivning", "Belopp (SEK)"]);

      // Grupperade data
      const groups = [
        {
          title: "A. Momspliktig försäljning eller uttag exkl. moms",
          fields: ["05", "06", "07", "08"],
        },
        {
          title: "B. Utgående moms på försäljning",
          fields: ["10", "11", "12"],
        },
        {
          title: "C. Inkomster med omvänd moms",
          fields: ["20", "21", "22", "23", "24"],
        },
        {
          title: "D. Utgående moms omvänd",
          fields: ["30", "31", "32"],
        },
        {
          title: "E. Momsfri försäljning och export",
          fields: ["35", "36", "37", "38", "39", "40", "41", "42"],
        },
        {
          title: "F. Ingående moms",
          fields: ["48"],
        },
        {
          title: "G. Moms att betala eller få tillbaka",
          fields: ["49"],
        },
        {
          title: "H. Import",
          fields: ["50"],
        },
        {
          title: "I. Utgående moms import",
          fields: ["60", "61", "62"],
        },
      ];

      // Lägg till grupperad data
      groups.forEach((group) => {
        csvRows.push([]); // Tom rad före grupp
        csvRows.push([group.title, "", ""]);

        group.fields.forEach((fältNr) => {
          const rad = fullData.find((r) => r.fält === fältNr);
          if (rad) {
            const belopp = new Intl.NumberFormat("sv-SE", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(rad.belopp);

            csvRows.push([rad.fält, rad.beskrivning, belopp]);
          }
        });
      });

      // Lägg till summering
      csvRows.push([]); // Tom rad
      csvRows.push(["SUMMERING", "", ""]);
      csvRows.push(["Utgående moms totalt", "", utgåendeMoms.toLocaleString("sv-SE")]);
      csvRows.push(["Ingående moms", "", ingåendeMoms.toLocaleString("sv-SE")]);
      csvRows.push([
        "Moms att betala/få tillbaka (beräknat)",
        "",
        momsAttBetalaEllerFaTillbaka.toLocaleString("sv-SE"),
      ]);
      csvRows.push(["Moms att betala/få tillbaka (ruta 49)", "", ruta49.toLocaleString("sv-SE")]);
      csvRows.push([
        "Avvikelse",
        "",
        Math.abs(momsAttBetalaEllerFaTillbaka - ruta49).toLocaleString("sv-SE"),
      ]);
      csvRows.push(["Status", "", ärKorrekt ? "OK" : "AVVIKELSE"]);

      // Konvertera till CSV-sträng
      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Ladda ner filen
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `momsrapport-${år}-${företagsnamn.replace(/\s+/g, "-")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("CSV-filen har laddats ner");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (error) {
      console.error("CSV export error:", error);
      setExportMessage("Fel vid CSV export");
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Calculated values
  const ruta49 = get("49");
  const utgåendeMoms = sum("10", "11", "12", "30", "31", "32", "60", "61", "62");
  const ingåendeMoms = get("48");
  const momsAttBetalaEllerFaTillbaka = utgåendeMoms - ingåendeMoms;
  const diff = Math.abs(momsAttBetalaEllerFaTillbaka - ruta49);
  const ärKorrekt = diff < 1;

  // Full data for table
  const fullData: MomsRad[] = [
    { fält: "05", beskrivning: "Momspliktig försäljning", belopp: get("05") },
    { fält: "06", beskrivning: "Momspliktiga uttag", belopp: get("06") },
    { fält: "07", beskrivning: "Vinstmarginalbeskattning", belopp: get("07") },
    { fält: "08", beskrivning: "Hyresinkomster med frivillig moms", belopp: get("08") },
    { fält: "10", beskrivning: "Utgående moms 25%", belopp: get("10") },
    { fält: "11", beskrivning: "Utgående moms 12%", belopp: get("11") },
    { fält: "12", beskrivning: "Utgående moms 6%", belopp: get("12") },
    { fält: "20", beskrivning: "Inköp varor från annat EU-land", belopp: get("20") },
    { fält: "21", beskrivning: "Inköp tjänster från EU-land", belopp: get("21") },
    { fält: "22", beskrivning: "Inköp tjänster från utanför EU", belopp: get("22") },
    { fält: "23", beskrivning: "Inköp varor i Sverige (omv moms)", belopp: get("23") },
    { fält: "24", beskrivning: "Inköp tjänster i Sverige (omv moms)", belopp: get("24") },
    { fält: "30", beskrivning: "Utgående moms 25% (omv moms)", belopp: get("30") },
    { fält: "31", beskrivning: "Utgående moms 12% (omv moms)", belopp: get("31") },
    { fält: "32", beskrivning: "Utgående moms 6% (omv moms)", belopp: get("32") },
    { fält: "50", beskrivning: "Beskattningsunderlag import", belopp: get("50") },
    { fält: "60", beskrivning: "Utgående moms 25% (import)", belopp: get("60") },
    { fält: "61", beskrivning: "Utgående moms 12% (import)", belopp: get("61") },
    { fält: "62", beskrivning: "Utgående moms 6% (import)", belopp: get("62") },
    { fält: "35", beskrivning: "Varuförsäljning till EU-land", belopp: get("35") },
    { fält: "36", beskrivning: "Export varor utanför EU", belopp: get("36") },
    { fält: "37", beskrivning: "3-partshandel inköp", belopp: get("37") },
    { fält: "38", beskrivning: "3-partshandel försäljning", belopp: get("38") },
    { fält: "39", beskrivning: "Tjänst till EU (huvudregel)", belopp: get("39") },
    { fält: "40", beskrivning: "Tjänst till utanför EU", belopp: get("40") },
    { fält: "41", beskrivning: "Försäljning med omv moms", belopp: get("41") },
    { fält: "42", beskrivning: "Övrigt momsundantaget", belopp: get("42") },
    { fält: "48", beskrivning: "Ingående moms att dra av", belopp: get("48") },
    { fält: "49", beskrivning: "Moms att betala eller få tillbaka", belopp: ruta49 },
  ];

  return {
    // State
    initialData,
    setInitialData,
    organisationsnummer,
    setOrganisationsnummer,
    företagsnamn,
    setFöretagsnamn,
    loading,
    setLoading,
    error,
    setError,
    år,
    setÅr,
    activeId,
    setActiveId,
    // Export state
    isExportingPDF,
    setIsExportingPDF,
    isExportingCSV,
    setIsExportingCSV,
    isExportingXML,
    setIsExportingXML,
    exportMessage,
    setExportMessage,
    // Constants
    årLista,
    // Helper functions
    get,
    sum,
    generateXML,
    // Export functions
    exportXML,
    exportPDF,
    exportCSV,
    // Calculated values
    ruta49,
    utgåendeMoms,
    ingåendeMoms,
    momsAttBetalaEllerFaTillbaka,
    diff,
    ärKorrekt,
    // Data
    fullData,
  };
};

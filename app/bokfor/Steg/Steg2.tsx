// #region Huvud
"use client";

import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation"; // router ej längre använd efter borttag av info-rutor
import LaddaUppFil from "../LaddaUppFil";
import Information from "../Information";
import Kommentar from "../Kommentar";
import Forhandsgranskning from "../Forhandsgranskning";
import TillbakaPil from "../../_components/TillbakaPil";
import Knapp from "../../_components/Knapp";
import ValjLeverantorModal from "../../_components/ValjLeverantorModal";
import { hämtaBokföringsmetod, extractDataFromOCRKundfaktura } from "../_actions/actions";
import { Step2Props } from "../_types/types";
// #endregion

export default function Steg2({
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
  setKommentar,
  valtFörval,
  extrafält,
  setExtrafält,
  utlaggMode,
  bokförSomFaktura: initialBokförSomFaktura = false,
  setBokförSomFaktura: externalSetBokförSomFaktura,
  kundfakturadatum: initialKundfakturadatum = null,
  setKundfakturadatum: externalSetKundfakturadatum,
}: Step2Props) {
  // State för fakturametod-funktionalitet
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("");
  const [bokförSomFaktura, setBokförSomFaktura] = useState<boolean>(initialBokförSomFaktura);
  const [fakturadatum, setFakturadatum] = useState<string | null>(initialKundfakturadatum);
  const [ocrText, setOcrText] = useState<string>("");
  const [reprocessFile, setReprocessFile] = useState<(() => Promise<void>) | null>(null);
  // const router = useRouter();
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // Heuristik: detektera kostnads- vs intäktskonton i valt förval
  const harIntaktskonto = valtFörval?.konton?.some((k) => k.kontonummer?.startsWith("3")) || false;
  const harKostnadskonto =
    valtFörval?.konton?.some((k) => /^(4|5|6|7|8)/.test(k.kontonummer ?? "")) || false;
  // Föreslå leverantörsfaktura om användaren kör fakturametoden, vi hittat kostnadskonto och inga intäktskonton
  const foreslaLevfakt =
    bokföringsmetod === "Fakturametoden" && harKostnadskonto && !harIntaktskonto;

  // DEBUG: Logga heuristik-data (utan att påverka logiken)
  useEffect(() => {
    try {
      const kontonData = (valtFörval?.konton || []).map((k) => ({
        kontonummer: k.kontonummer,
        debet: k.debet,
        kredit: k.kredit,
        klass: k.kontonummer ? k.kontonummer[0] : undefined,
      }));

      const extrafaltData = Object.fromEntries(
        Object.entries(extrafält || {}).map(([k, v]) => [k, v])
      );

      // Använd groupCollapsed för att inte spamma konsolen
      console.groupCollapsed("🧪 Heuristik Steg2 | foreslaLevfakt=" + foreslaLevfakt);
      console.log("bokföringsmetod:", bokföringsmetod);
      console.log("harIntaktskonto:", harIntaktskonto);
      console.log("harKostnadskonto:", harKostnadskonto);
      console.log("utlaggMode:", utlaggMode);
      if (valtFörval) {
        console.log("valtFörval.id:", (valtFörval as any).id);
        console.log("valtFörval.namn:", (valtFörval as any).namn);
      } else {
        console.log("valtFörval: none");
      }
      console.log("Extrafält:", extrafaltData);
      if (kontonData.length) {
        console.table(kontonData);
        const klasser = Array.from(new Set(kontonData.map((k) => k.klass))).filter(Boolean);
        console.log("Kontoklasser i valtFörval:", klasser.join(", "));
      } else {
        console.log("Inga konton i valtFörval ännu.");
      }
      console.groupEnd();
    } catch (err) {
      console.warn("Heuristik debug misslyckades:", err);
    }
  }, [
    bokföringsmetod,
    valtFörval,
    harIntaktskonto,
    harKostnadskonto,
    foreslaLevfakt,
    extrafält,
    utlaggMode,
  ]);

  // Sync med external state när det finns
  useEffect(() => {
    if (externalSetBokförSomFaktura) {
      externalSetBokförSomFaktura(bokförSomFaktura);
    }
  }, [bokförSomFaktura, externalSetBokförSomFaktura]);

  useEffect(() => {
    if (externalSetKundfakturadatum) {
      externalSetKundfakturadatum(fakturadatum);
    }
  }, [fakturadatum, externalSetKundfakturadatum]);

  // Hämta användarens bokföringsmetod
  useEffect(() => {
    const hämtaMetod = async () => {
      try {
        const metod = await hämtaBokföringsmetod();
        setBokföringsmetod(metod);
      } catch (error) {
        console.error("❌ Fel vid hämtning av bokföringsmetod:", error);
        setBokföringsmetod("Kontantmetoden");
      }
    };
    hämtaMetod();
  }, []);

  // Kör kundfaktura-AI när OCR-text finns och fakturamoden är aktiv
  useEffect(() => {
    if (bokförSomFaktura && ocrText) {
      const runKundfakturaAI = async () => {
        try {
          console.log("🧠 Kör AI-extraktion för kundfaktura (auto)...");
          const parsed = await extractDataFromOCRKundfaktura(ocrText);

          if (parsed?.fakturadatum) {
            setFakturadatum(parsed.fakturadatum);
          }
          if (parsed?.belopp && !isNaN(parsed.belopp)) {
            setBelopp(Number(parsed.belopp));
          }
        } catch (error) {
          console.error("❌ Fel vid AI-extraktion för kundfaktura (auto):", error);
        }
      };
      runKundfakturaAI();
    }
  }, [bokförSomFaktura, ocrText, setBelopp, setFakturadatum]);

  // (Tidigare) visaFakturaCheckbox borttagen – ersatt av leverantörsknapp vid inköp

  // Hantera OCR-text från LaddaUppFil
  const handleOcrTextChange = useCallback((text: string) => {
    setOcrText(text);
  }, []);

  // Ta emot reprocess-funktionen från LaddaUppFil
  const handleReprocessTrigger = useCallback((reprocessFn: () => Promise<void>) => {
    setReprocessFile(() => reprocessFn);
  }, []);

  // Hantera checkbox-klick - trigga OCR igen för fakturamoden
  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      setBokförSomFaktura(checked);

      if (checked && reprocessFile) {
        console.log("🔄 Triggar ny OCR för fakturamoden...");
        await reprocessFile();
      }
    },
    [reprocessFile]
  );

  //#region Visa specialförval om det finns
  if (valtFörval?.specialtyp) {
    try {
      console.log("🔍 Försöker ladda specialförval:", valtFörval.specialtyp);
      const SpecialComponent = require(`./SpecialForval/${valtFörval.specialtyp}`).default;
      return (
        <SpecialComponent
          mode="steg2"
          setCurrentStep={setCurrentStep}
          fil={fil}
          setFil={setFil}
          pdfUrl={pdfUrl}
          setPdfUrl={setPdfUrl}
          belopp={belopp}
          setBelopp={setBelopp}
          transaktionsdatum={transaktionsdatum}
          setTransaktionsdatum={setTransaktionsdatum}
          kommentar={kommentar}
          setKommentar={setKommentar}
          valtFörval={valtFörval}
          extrafält={extrafält}
          setExtrafält={setExtrafält}
        />
      );
    } catch (err) {
      console.error("❌ Fel vid laddning av specialförval:", valtFörval.specialtyp, err);
      return (
        <div className="p-10 text-white bg-red-900 text-center">
          ⚠️ Kunde inte ladda specialförval: {valtFörval.specialtyp}
        </div>
      );
    }
  }
  // #endregion

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">
          {utlaggMode ? "Steg 2: Fyll i uppgifter för utlägg" : "Steg 2: Fyll i uppgifter"}
        </h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            {/* (Tidigare info-rutor borttagna) */}
            <LaddaUppFil
              fil={fil}
              setFil={setFil}
              setPdfUrl={setPdfUrl}
              setBelopp={setBelopp}
              setTransaktionsdatum={setTransaktionsdatum}
              onOcrTextChange={handleOcrTextChange}
              skipBasicAI={bokförSomFaktura}
              onReprocessTrigger={handleReprocessTrigger}
            />
            {foreslaLevfakt && !utlaggMode && (
              <div className="mt-4 mb-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                    checked={visaLeverantorModal}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisaLeverantorModal(true);
                      } else {
                        setVisaLeverantorModal(false);
                      }
                    }}
                  />
                  <span className="text-sm text-white">Bokför som leverantörsfaktura</span>
                </label>
              </div>
            )}

            <Information
              belopp={belopp ?? 0}
              setBelopp={setBelopp}
              transaktionsdatum={transaktionsdatum}
              setTransaktionsdatum={setTransaktionsdatum}
              visaFakturadatum={bokförSomFaktura}
              fakturadatum={fakturadatum}
              setFakturadatum={setFakturadatum}
            />
            <Kommentar kommentar={kommentar ?? ""} setKommentar={setKommentar} />
            <Knapp
              text="Bokför"
              onClick={() => setCurrentStep(3)}
              disabled={!belopp || !transaktionsdatum || !fil || !pdfUrl}
              fullWidth
            />
          </div>
          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
      {/* Leverantörsmodal */}
      <ValjLeverantorModal
        isOpen={visaLeverantorModal}
        onClose={() => setVisaLeverantorModal(false)}
      />
    </>
  );
}

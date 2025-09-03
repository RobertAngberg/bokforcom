// #region Huvud
"use client";

import { useState, useEffect, useCallback } from "react";
import LaddaUppFil from "./LaddaUppFil";
import Information from "./Information";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../_components/TillbakaPil";
import Knapp from "../_components/Knapp";
import { hämtaBokföringsmetod, extractDataFromOCRKundfaktura } from "./actions";
import { Step2Props } from "./types";
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

  // Kolla om förvalet innehåller inkomstkonto (3xxx)
  const harInkomstkonto =
    valtFörval?.konton?.some((konto) => konto.kontonummer?.startsWith("3")) || false;

  // Visa checkboxen endast om användaren har Fakturametoden och det finns inkomstkonto
  const visaFakturaCheckbox = bokföringsmetod === "Fakturametoden" && harInkomstkonto;

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

        <h1 className="mb-6 text-3xl text-center text-white">Steg 2: Fyll i uppgifter</h1>
        <div className="flex flex-col-reverse justify-between h-auto md:flex-row">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
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

            {/* Checkbox för fakturametod */}
            {visaFakturaCheckbox && (
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bokförSomFaktura}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-white">Bokför som faktura</span>
                </label>
                {bokförSomFaktura && (
                  <p className="text-xs text-gray-400 mt-2 ml-7">
                    Skapar en kundfordran istället för direktbetalning
                  </p>
                )}
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
              disabled={!belopp || !transaktionsdatum}
              fullWidth
            />
          </div>
          <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
        </div>
      </div>
    </>
  );
}

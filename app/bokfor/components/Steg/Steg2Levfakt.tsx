"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import { datePickerValue, datePickerOnChange } from "../../../_utils/datum";
import LaddaUppFil from "./LaddaUppFil";
import Kommentar from "./Kommentar";
import Forhandsgranskning from "./Forhandsgranskning";
import TillbakaPil from "../../../_components/TillbakaPil";
import Knapp from "../../../_components/Knapp";
import TextFalt from "../../../_components/TextFalt";
import { useBokforContext } from "../../context/BokforContextProvider";
import { getLeverantorer } from "../../../faktura/actions/leverantorActions";

registerLocale("sv", sv);

export default function Steg2Levfakt() {
  const { state, actions, handlers } = useBokforContext();
  const leverantorNamn = state.leverantör?.namn?.trim();

  // State för dynamiskt laddade specialkomponenter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SpecialComponent, setSpecialComponent] = useState<any>(null);
  const [componentLoading, setComponentLoading] = useState(false);

  // Dynamisk laddning av specialkomponent baserat på vald förval
  useEffect(() => {
    const loadSpecialComponent = async () => {
      if (!state.valtFörval?.specialtyp) {
        setSpecialComponent(null);
        return;
      }

      // Mapping mellan specialtyp och komponentnamn - komplett lista från database
      const specialtypMapping: Record<string, string> = {
        AvgifterAvrakningsnotaMoms: "AvgifterAvrakningsnotaMoms",
        AvrakningsnotaUtanMoms: "AvrakningsnotaUtanMoms",
        Banklan: "Banklan",
        Billeasing: "Billeasing",
        Direktpension: "Direktpension",
        DrojsmalsrantaLevFakt: "DrojsmalsrantaLevFakt",
        EgetUttag: "EgetUttag",
        Hyrbil: "Hyrbil",
        ITtjansterEU: "ITtjansterEU",
        ITtjansterUtanfEU: "ITtjansterUtanfEU",
        Importmoms: "Importmoms",
        InkopTjanstEU: "InkopTjanstEU",
        InkopTjanstUtanfEU: "InkopTjanstUtanfEU",
        InkopTjansterSverigeOmvand: "InkopTjansterSverigeOmvand",
        InkopVarorEU25: "InkopVarorEU25",
        InkopVarorUtanfEU: "InkopVarorUtanfEU",
        Kontorsmaterial: "Kontorsmaterial",
        MilersattningEnskildFirma: "MilersattningEnskildFirma",
        Pensionsforsakring: "Pensionsforsakring",
        Rantekostnader: "Rantekostnader",
        Representation: "Representation",
        UberAvgift: "UberAvgift",
        AmorteringBanklan: "AmorteringBanklan",
      };

      const componentName = specialtypMapping[state.valtFörval.specialtyp];

      if (!componentName) {
        setSpecialComponent(null);
        return;
      }

      try {
        setComponentLoading(true);
        // Modern dynamic import istället för require()
        const componentModule = await import(`./SpecialForval/${componentName}`);
        setSpecialComponent(() => componentModule.default);
      } catch (error) {
        console.error(`Kunde inte ladda specialkomponent ${componentName}:`, error);
        setSpecialComponent(null);
      } finally {
        setComponentLoading(false);
      }
    };

    loadSpecialComponent();
  }, [state.valtFörval?.specialtyp]);
  const levfaktHelper = handlers.useSteg2LevfaktHelper();

  useEffect(() => {
    let aborted = false;

    const autoSelectLeverantor = async () => {
      if (state.leverantör) return;
      try {
        const result = await getLeverantorer();
        if (!result.success || !result.leverantörer || result.leverantörer.length === 0) {
          return;
        }

        if (aborted) return;

        const params =
          typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const leverantorIdParam = params?.get("leverantorId");

        const hittaOchSättLeverantor = (leverantorData: (typeof result.leverantörer)[number]) => {
          if (aborted) return;
          actions.setLeverantör({
            id: leverantorData.id,
            namn: leverantorData.namn || "",
            organisationsnummer: leverantorData.organisationsnummer || undefined,
            adress: leverantorData.adress || undefined,
            postnummer: leverantorData.postnummer || undefined,
            ort: leverantorData.ort || undefined,
            telefon: leverantorData.telefon || undefined,
            email: leverantorData.email || undefined,
            skapad: leverantorData.skapad || undefined,
            uppdaterad: leverantorData.uppdaterad || undefined,
          });
        };

        if (leverantorIdParam) {
          const leverantorId = Number(leverantorIdParam);
          const match = result.leverantörer.find((lev) => lev.id === leverantorId);
          if (match) {
            hittaOchSättLeverantor(match);
            return;
          }
        }

        if (result.leverantörer.length === 1) {
          hittaOchSättLeverantor(result.leverantörer[0]);
        }
      } catch (error) {
        console.error("Kunde inte autovälja leverantör:", error);
      }
    };

    autoSelectLeverantor();

    return () => {
      aborted = true;
    };
  }, [actions, state.leverantör]);
  // Visa bara på steg 2 och i levfakt mode
  if (state.currentStep !== 2 || !state.levfaktMode) return null;

  // Rendera dynamiskt laddad specialkomponent om det finns
  if (state.valtFörval?.specialtyp) {
    // Visa laddningsindikator medan komponenten laddas
    if (componentLoading) {
      return (
        <div className="p-10 text-white text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          Laddar specialförval...
        </div>
      );
    }

    // Visa felmeddelande om komponenten inte kunde laddas
    if (!SpecialComponent) {
      return (
        <div className="p-10 text-white bg-red-900 text-center">
          ⚠️ Kunde inte ladda specialförval: {state.valtFörval.specialtyp}
        </div>
      );
    }

    // Rendera den dynamiskt laddade komponenten
    return (
      <SpecialComponent
        mode="steg2"
        renderMode="levfakt"
        belopp={state.belopp}
        setBelopp={actions.setBelopp}
        transaktionsdatum={state.transaktionsdatum}
        setTransaktionsdatum={actions.setTransaktionsdatum}
        kommentar={state.kommentar}
        setKommentar={actions.setKommentar}
        setCurrentStep={actions.setCurrentStep}
        fil={state.fil}
        setFil={actions.setFil}
        pdfUrl={state.pdfUrl}
        setPdfUrl={actions.setPdfUrl}
        extrafält={state.extrafält}
        setExtrafält={actions.setExtrafält}
        leverantör={state.leverantör}
        setLeverantör={actions.setLeverantör}
        fakturanummer={levfaktHelper.state.fakturanummer}
        setFakturanummer={levfaktHelper.actions.setFakturanummer}
        fakturadatum={levfaktHelper.state.fakturadatum}
        setFakturadatum={levfaktHelper.actions.setFakturadatum}
        förfallodatum={levfaktHelper.state.förfallodatum}
        setFörfallodatum={levfaktHelper.actions.setFörfallodatum}
      />
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => actions.setCurrentStep(1)} />

        <h1 className="mb-6 text-3xl text-center text-white">
          {`Steg 2: Leverantörsfaktura${leverantorNamn ? ` - ${leverantorNamn}` : ""}`}
        </h1>
        <div className="flex flex-col-reverse justify-between gap-6 h-auto md:flex-row md:items-start">
          <div className="w-full mb-10 md:w-[40%] md:mb-0 bg-slate-900 border border-gray-700 rounded-xl p-6 text-white">
            <LaddaUppFil
              fil={state.fil || null}
              setFil={actions.setFil}
              setPdfUrl={actions.setPdfUrl}
              setBelopp={actions.setBelopp}
              setTransaktionsdatum={actions.setTransaktionsdatum}
              setLeverantör={actions.setLeverantör}
              setFakturadatum={actions.setFakturadatum}
              setFörfallodatum={levfaktHelper.actions.setFörfallodatum}
              setFakturanummer={levfaktHelper.actions.setFakturanummer}
            />
            {/* Fakturadatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Fakturadatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.fakturadatum) || new Date()}
                onChange={(date) => {
                  actions.setFakturadatum(datePickerOnChange(date));
                }}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />
            </div>

            {/* Förfallodatum */}
            <div className="mb-4">
              <label className="block mb-2 text-white">Förfallodatum:</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                selected={datePickerValue(state.förfallodatum) || new Date()}
                onChange={(date) => {
                  levfaktHelper.actions.setFörfallodatum(datePickerOnChange(date));
                }}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />
            </div>

            {/* Fakturanummer */}
            <div className="mb-4">
              <TextFalt
                label="Fakturanummer"
                name="fakturanummer"
                type="text"
                value={levfaktHelper.state.fakturanummer || ""}
                onChange={(e) => levfaktHelper.actions.setFakturanummer(e.target.value)}
                placeholder="Ange fakturanummer..."
              />
            </div>

            {/* Belopp */}
            <div className="mb-4">
              <TextFalt
                label="Belopp"
                name="belopp"
                type="number"
                value={state.belopp?.toString() || ""}
                onChange={(e) => actions.setBelopp(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
                maxLength={12}
              />
            </div>

            <Kommentar kommentar={state.kommentar ?? ""} setKommentar={actions.setKommentar} />
            <Knapp
              fullWidth
              text="Bokför leverantörsfaktura"
              onClick={() => actions.setCurrentStep(3)}
              disabled={
                !state.belopp ||
                !levfaktHelper.state.fakturanummer ||
                !state.fakturadatum ||
                !state.förfallodatum ||
                !state.fil ||
                !state.pdfUrl
              }
            />
          </div>
          <div className="w-full md:w-[58%] md:mt-0">
            <Forhandsgranskning fil={state.fil} pdfUrl={state.pdfUrl} />
          </div>
        </div>
      </div>
    </>
  );
}

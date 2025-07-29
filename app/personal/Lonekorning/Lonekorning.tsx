//#region Imports
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  hämtaAllaLönespecarFörUser,
  hämtaAllaAnställda,
  hämtaUtlägg,
  hämtaFöretagsprofil,
  bokförLöneskatter,
} from "../actions";
// import { useLonespecContext } from "../Lonespecar/LonespecContext";
import LönespecView from "../Lonespecar/LonespecView";
import AnstolldaLista from "./AnstalldaLista";
import BankgiroExport from "./BankgiroExport";
import BokforLoner from "../Lonespecar/BokforLoner";
import MailaLonespec from "../Lonespecar/MailaLonespec";
import BokforKnappOchModal from "./BokforKnappOchModal";
import Knapp from "../../_components/Knapp";
import { useLonespecContext } from "../Lonespecar/LonespecContext";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { klassificeraExtrarader } from "../Lonespecar/loneberokningar";
import { RAD_KONFIGURATIONER } from "../Lonespecar/Extrarader/extraradDefinitioner";
import SkatteBokforingModal from "./SkatteBokforingModal";
import AGIDebugModal from "./AGIDebugModal";
import NySpecModal from "./NySpecModal";
import UtbetalningsdatumValjare from "./UtbetalningsdatumValjare";
import LonespecLista from "./LonespecLista";
//#endregion

//#region Component
export default function Lonekorning() {
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const { extrarader, beräknadeVärden } = useLonespecContext();
  //#endregion

  //#region State
  const [loading, setLoading] = useState(true);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<string | null>(null);
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [specarPerDatum, setSpecarPerDatum] = useState<Record<string, any[]>>({});
  const [datumLista, setDatumLista] = useState<string[]>([]);
  const [valdaSpecar, setValdaSpecar] = useState<any[]>([]);
  const [anstallda, setAnstallda] = useState<any[]>([]);
  const [utlaggMap, setUlaggMap] = useState<Record<number, any[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);
  const [skatteDatum, setSkatteDatum] = useState<Date | null>(null);
  const [skatteBokförPågår, setSkatteBokförPågår] = useState(false);
  const [agiDebugData, setAgiDebugData] = useState<any>(null);
  const [visaDebug, setVisaDebug] = useState(false);
  //#endregion

  //#region Skatte beräkningar
  const beräknaSkatteData = () => {
    if (!valdaSpecar || valdaSpecar.length === 0) {
      return {
        socialaAvgifter: 0,
        personalskatt: 0,
        totaltSkatter: 0,
      };
    }

    // Summera alla sociala avgifter och skatter från valda lönespecar
    let totalSocialaAvgifter = 0;
    let totalPersonalskatt = 0;

    valdaSpecar.forEach((spec) => {
      const beräkningar = beräknadeVärden[spec.id];
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

  const skatteData = beräknaSkatteData();
  //#endregion

  //#region Lönespec hantering
  const hanteraTaBortSpec = async (specId: number) => {
    // Importera taBortLönespec från actions om det behövs
    const { taBortLönespec } = await import("../actions");
    const resultat = await taBortLönespec(specId);
    if (resultat.success) {
      alert("✅ Lönespecifikation borttagen!");
      // Ta bort från state
      setValdaSpecar((prev) => prev.filter((s) => s.id !== specId));
      setSpecarPerDatum((prev) => {
        const updated = { ...prev };
        if (utbetalningsdatum && updated[utbetalningsdatum]) {
          updated[utbetalningsdatum] = updated[utbetalningsdatum].filter((s) => s.id !== specId);
          // If no lönespecar left for this date, remove the date
          if (updated[utbetalningsdatum].length === 0) {
            delete updated[utbetalningsdatum];
          }
        }
        return updated;
      });
      setDatumLista((prev) => {
        const filtered = prev.filter((d) => {
          // Only keep dates that still have lönespecar
          return specarPerDatum[d] && specarPerDatum[d].filter((s) => s.id !== specId).length > 0;
        });
        // If current utbetalningsdatum is now empty, clear selection
        if (utbetalningsdatum && filtered.indexOf(utbetalningsdatum) === -1) {
          setUtbetalningsdatum(filtered[0] || null);
        }
        return filtered;
      });
    } else {
      alert(`❌ Kunde inte ta bort lönespec: ${resultat.message}`);
    }
  };
  //#endregion

  //#region Skatte bokföring
  const hanteraBokförSkatter = async () => {
    if (skatteData.socialaAvgifter === 0 && skatteData.personalskatt === 0) {
      alert("Inga skatter att bokföra!");
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
        alert("✅ Löneskatter bokförda!");
        setSkatteModalOpen(false);
        setSkatteDatum(null);
      } else {
        alert(`❌ Fel vid bokföring: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Bokföring misslyckades:", error);
      alert("❌ Något gick fel vid bokföringen");
    } finally {
      setSkatteBokförPågår(false);
    }
  };
  //#endregion

  //#region Effects
  useEffect(() => {
    // Hämta och gruppera alla lönespecar per utbetalningsdatum
    const fetchData = async () => {
      setLoading(true);
      try {
        const [specar, anstallda] = await Promise.all([
          hämtaAllaLönespecarFörUser(),
          hämtaAllaAnställda(),
        ]);
        setAnstallda(anstallda);
        // Hämta utlägg för varje anställd parallellt
        const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
        const utlaggResults = await Promise.all(utlaggPromises);
        const utlaggMap: Record<number, any[]> = {};
        anstallda.forEach((a, idx) => {
          utlaggMap[a.id] = utlaggResults[idx];
        });
        setUlaggMap(utlaggMap);
        // Gruppera per utbetalningsdatum och ta bort tomma datum
        const grupperat: Record<string, any[]> = {};
        specar.forEach((spec) => {
          if (spec.utbetalningsdatum) {
            if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
            grupperat[spec.utbetalningsdatum].push(spec);
          }
        });
        // Ta bort datum med 0 lönespecar
        const grupperatUtanTomma = Object.fromEntries(
          Object.entries(grupperat).filter(([_, list]) => list.length > 0)
        );
        const datumSort = Object.keys(grupperatUtanTomma).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        setDatumLista(datumSort);
        setSpecarPerDatum(grupperatUtanTomma);
        // Förvalt: visa lönespecar för senaste datum
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
  }, []);

  useEffect(() => {
    // Uppdatera valda lönespecar när datum ändras
    if (utbetalningsdatum && specarPerDatum[utbetalningsdatum]) {
      setValdaSpecar(specarPerDatum[utbetalningsdatum]);
    }
  }, [utbetalningsdatum, specarPerDatum]);
  //#endregion

  //#region AGI Generation
  const { data: session } = useSession();

  // Funktion för att formatera organisationsnummer/personnummer för enskild firma
  const formateraOrganisationsnummer = (orgnr: string): string => {
    if (!orgnr) return "";
    // Ta bort alla bindestreck först
    const endast_siffror = orgnr.replace(/-/g, "");

    if (endast_siffror.length === 10) {
      // Kontrollera om det är ett personnummer genom att titta på månad (position 2-3)
      const månad = parseInt(endast_siffror.slice(2, 4));

      if (månad >= 1 && månad <= 12) {
        // Detta verkar vara ett personnummer (YYMMDD-XXXX) - konvertera till 12-siffrigt
        const år = endast_siffror.slice(0, 2);
        const fullYear = parseInt(år) <= 99 ? "19" + år : "20" + år;
        const restAvNummer = endast_siffror.slice(2);
        return fullYear + restAvNummer.slice(0, 4) + "-" + restAvNummer.slice(4);
      } else {
        // Detta är ett organisationsnummer - formatera som XXXXXX-XXXX
        return endast_siffror.slice(0, 6) + "-" + endast_siffror.slice(6);
      }
    }

    if (endast_siffror.length === 12) {
      // Redan 12 siffror (YYYYMMDD-XXXX)
      return endast_siffror.slice(0, 8) + "-" + endast_siffror.slice(8);
    }

    return orgnr; // Returnera som det är om det inte matchar
  };
  const hanteraAGI = async () => {
    try {
      // Hämta företagsdata först
      let företagsdata = null;
      if (session?.user?.id) {
        företagsdata = await hämtaFöretagsprofil(session.user.id);
      }

      const debugInfo = {
        anställdaData: [] as any[],
        lönespecData: [] as any[],
        finalAgiData: null as any,
        företagsdata: företagsdata, // Lägg till för debug
      };

      // Samla data från alla lönespecar för den valda perioden
      // IDENTITET-typ kräver 12 siffror utan bindestreck enligt Skatteverkets schema
      const originalOrgnr = företagsdata?.organisationsnummer || "556026-9986";
      const formateratOrgnr = originalOrgnr.replace(/-/g, ""); // Ta bort bindestreck

      // Om det är 10 siffror, lägg till "19" framför för att göra det 12 siffror
      const slutgiltigtOrgnr =
        formateratOrgnr.length === 10 ? "19" + formateratOrgnr : formateratOrgnr;

      const agiData = {
        organisationsnummer: slutgiltigtOrgnr,
        agRegistreradId: slutgiltigtOrgnr, // Samma som organisationsnummer
        redovisningsperiod: utbetalningsdatum
          ? new Date(utbetalningsdatum).toISOString().slice(0, 7).replace("-", "")
          : new Date().toISOString().slice(0, 7).replace("-", ""),
        individuppgifter: [] as any[],
        summaArbAvgSlf: 0,
        summaSkatteavdr: 0,
        // Lägg till företagsdata för XML-generering
        företagsnamn: företagsdata?.företagsnamn || "Auto Generated",
        kontaktperson: {
          namn: företagsdata?.företagsnamn || "Auto Generated",
          telefon: företagsdata?.telefonnummer || "08-123456",
          epost: företagsdata?.epost || "info@example.se",
        },
      };

      // AGI-generering från valda lönespecar
      valdaSpecar.forEach((spec) => {
        const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
        if (!anstalld) return;

        // Spara anställd-data för debug
        debugInfo.anställdaData.push({
          id: anstalld.id,
          namn: `${anstalld.förnamn} ${anstalld.efternamn}`,
          personnummer: anstalld.personnummer,
          adress: anstalld.adress,
          postnummer: anstalld.postnummer,
          ort: anstalld.ort,
          tjänsteställe_adress: anstalld.tjänsteställe_adress,
          tjänsteställe_ort: anstalld.tjänsteställe_ort,
        });

        const beräkningar = beräknadeVärden[spec.id];
        const bruttolön = beräkningar?.bruttolön || spec.bruttolön || spec.grundlön || 0;
        const skatt = beräkningar?.skatt || spec.skatt || 0;
        const socialaAvgifter = beräkningar?.socialaAvgifter || spec.sociala_avgifter || 0;

        // 🆕 KORREKT AGI-MAPPNING: Analysera extrarader enligt Skatteverkets koder
        const specExtrarader = extrarader[spec.id] || []; // Hämta från context istället för spec
        const { skattepliktigaFörmåner, skattefriaErsättningar } =
          klassificeraExtrarader(specExtrarader);

        // 🔍 DEBUG: Logga extrarader för att se vad som händer
        console.log(`🔍 AGI Debug för lönespec ${spec.id}:`, {
          extraradAntal: specExtrarader.length,
          extrarader: specExtrarader.map((rad: any) => ({
            typ: rad.typ,
            kolumn1: rad.kolumn1,
            kolumn3: rad.kolumn3,
            belopp: parseFloat(rad.kolumn3) || 0,
          })),
          skattepliktigaFörmåner,
          skattefriaErsättningar,
        });

        // Analysera specifika AGI-komponenter från extrarader
        let harTraktamente = false;
        let harBilersättning = false;
        let bilförmånVärde = 0;
        let övrigaFörmånerVärde = 0;

        specExtrarader.forEach((rad: any) => {
          const konfig = RAD_KONFIGURATIONER[rad.typ];
          const belopp = parseFloat(rad.kolumn3) || 0;

          if (belopp === 0) return; // Skippa tomma rader

          // Traktamente (051) - skattefria traktamenten
          if (
            [
              "uppehalleInrikes",
              "uppehalleUtrikes",
              "logi",
              "resersattning",
              "annanKompensation",
            ].includes(rad.typ)
          ) {
            if (belopp > 0) harTraktamente = true;
          }

          // Bilersättning (050) - skattefria bilersättningar
          else if (["privatBil", "foretagsbilBensinDiesel", "foretagsbilEl"].includes(rad.typ)) {
            if (belopp > 0) harBilersättning = true;
          }

          // Bilförmån (013) - skattepliktig bilförmån (specifikt företagsbil som förmån)
          else if (["foretagsbilExtra", "foretagsbil"].includes(rad.typ) && konfig?.skattepliktig) {
            bilförmånVärde += belopp;
          }

          // Övriga skattepliktiga förmåner (012) - alla andra skattepliktiga förmåner
          else if (konfig?.skattepliktig && belopp > 0) {
            // Alla skattepliktiga förmåner som inte är bilförmån
            övrigaFörmånerVärde += belopp;
          }
        }); // Spara lönespec-data för debug
        debugInfo.lönespecData.push({
          id: spec.id,
          grundlön: spec.grundlön,
          specSkatt: spec.skatt,
          beräkningar: beräkningar,
          beräknadBruttolön: bruttolön,
          beräknadSkatt: skatt,
          socialaAvgifter,
          // Ny debug-info för AGI
          harTraktamente,
          harBilersättning,
          skattepliktigaFörmåner,
          bilförmånVärde,
          extraraderAntal: specExtrarader.length,
        });

        // Lägg till individuppgift med all tillgänglig data
        agiData.individuppgifter.push({
          specifikationsnummer: agiData.individuppgifter.length + 1,
          betalningsmottagareId: anstalld.personnummer
            ? anstalld.personnummer.length === 10
              ? "19" + anstalld.personnummer
              : anstalld.personnummer
            : "198202252386", // Fallback
          fornamn: anstalld.förnamn,
          efternamn: anstalld.efternamn,

          // Adressuppgifter från anställd-tabellen
          gatuadress: anstalld.adress,
          postnummer: anstalld.postnummer,
          postort: anstalld.ort,

          // Arbetsplatsuppgifter
          arbetsplatsensGatuadress: anstalld.tjänsteställe_adress,
          arbetsplatsensOrt: anstalld.tjänsteställe_ort,

          // Lönedata från lönespec
          kontantErsattningUlagAG: Math.round(bruttolön - skattepliktigaFörmåner), // 011: Kontant ersättning (bruttolön minus förmåner)
          skatteplOvrigaFormanerUlagAG: Math.round(skattepliktigaFörmåner - bilförmånVärde), // 012: Övriga förmåner (exkl. bil)
          skatteplBilformanUlagAG: Math.round(bilförmånVärde), // 013: Bilförmån
          avdrPrelSkatt: skatt,

          // Utökad lönedata om tillgänglig
          bruttoLon: beräkningar?.bruttolön || spec.bruttolön,
          nettoLon: beräkningar?.nettolön || spec.nettolön,

          // Korrekt AGI-mappning från extrarader
          traktamente: harTraktamente, // 051: boolean för traktamente
          bilersattning: harBilersättning, // 050: boolean för bilersättning

          // Metadata
          utbetalningsdatum: spec.utbetalningsdatum,
          lonePeriod: spec.utbetalningsdatum
            ? new Date(spec.utbetalningsdatum).toISOString().slice(0, 7)
            : `${spec.månad || "unknown"}-${spec.år || "unknown"}`,
        });

        // Summera totaler
        agiData.summaArbAvgSlf += socialaAvgifter;
        agiData.summaSkatteavdr += skatt;
      });

      // Spara final AGI-data för debug
      debugInfo.finalAgiData = agiData;

      // Generera XML
      const xml = genereraAGIXML(agiData);

      // Spara XML för debug
      (debugInfo as any).generatedXML = xml;

      setAgiDebugData(debugInfo);
      setVisaDebug(true);

      // Ladda ner filen
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arbetsgivardeklaration_${agiData.redovisningsperiod}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Fel vid AGI-generering:", error);
      alert("❌ Fel vid AGI-generering: " + (error?.message || error));
    }
  };

  // Hjälpfunktion för XML-generering
  const genereraAGIXML = (data: any) => {
    const timestamp = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Skatteverket omrade="Arbetsgivardeklaration" xmlns="http://xmls.skatteverket.se/se/skatteverket/da/instans/schema/1.1"
xmlns:agd="http://xmls.skatteverket.se/se/skatteverket/da/komponent/schema/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://xmls.skatteverket.se/se/skatteverket/da/instans/schema/1.1
http://xmls.skatteverket.se/se/skatteverket/da/arbetsgivardeklaration/arbetsgivardeklaration_1.1.xsd">
  <agd:Avsandare>
    <agd:Programnamn>BokförCom AGI Generator v1.0</agd:Programnamn>
    <agd:Organisationsnummer>${data.organisationsnummer}</agd:Organisationsnummer>
    <agd:TekniskKontaktperson>
      <agd:Namn>${data.kontaktperson.namn}</agd:Namn>
      <agd:Telefon>${data.kontaktperson.telefon}</agd:Telefon>
      <agd:Epostadress>${data.kontaktperson.epost}</agd:Epostadress>
    </agd:TekniskKontaktperson>
    <agd:Skapad>${timestamp}</agd:Skapad>
  </agd:Avsandare>
  
  <agd:Blankettgemensamt>
    <agd:Arbetsgivare>
      <agd:AgRegistreradId>${data.agRegistreradId}</agd:AgRegistreradId>
      <agd:Kontaktperson>
        <agd:Namn>${data.kontaktperson.namn}</agd:Namn>
        <agd:Telefon>${data.kontaktperson.telefon}</agd:Telefon>
        <agd:Epostadress>${data.kontaktperson.epost}</agd:Epostadress>
      </agd:Kontaktperson>
    </agd:Arbetsgivare>
  </agd:Blankettgemensamt>
  
  <!-- Huvuduppgift -->
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${data.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${data.redovisningsperiod}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:HU>
        <agd:ArbetsgivareHUGROUP>
          <agd:AgRegistreradId faltkod="201">${data.agRegistreradId}</agd:AgRegistreradId>
        </agd:ArbetsgivareHUGROUP>
        
        <agd:RedovisningsPeriod faltkod="006">${data.redovisningsperiod}</agd:RedovisningsPeriod>
        <agd:SummaArbAvgSlf faltkod="487">${Math.round(data.summaArbAvgSlf)}</agd:SummaArbAvgSlf>
        <agd:SummaSkatteavdr faltkod="497">${Math.round(data.summaSkatteavdr)}</agd:SummaSkatteavdr>
      </agd:HU>
    </agd:Blankettinnehall>
  </agd:Blankett>
      
  ${data.individuppgifter
    .map(
      (iu: any) => `
  <!-- Individuppgift -->
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${data.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${data.redovisningsperiod}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:IU>
        <agd:ArbetsgivareIUGROUP>
          <agd:AgRegistreradId faltkod="201">${data.agRegistreradId}</agd:AgRegistreradId>
        </agd:ArbetsgivareIUGROUP>
        
        <agd:BetalningsmottagareIUGROUP>
          <agd:BetalningsmottagareIDChoice>
            <agd:BetalningsmottagarId faltkod="215">${iu.betalningsmottagareId}</agd:BetalningsmottagarId>
          </agd:BetalningsmottagareIDChoice>
          <agd:Fornamn faltkod="216">${iu.fornamn}</agd:Fornamn>
          <agd:Efternamn faltkod="217">${iu.efternamn}</agd:Efternamn>
          ${iu.gatuadress ? `<agd:Gatuadress faltkod="218">${iu.gatuadress}</agd:Gatuadress>` : ""}
          ${iu.postnummer ? `<agd:Postnummer faltkod="219">${iu.postnummer}</agd:Postnummer>` : ""}
          ${iu.postort ? `<agd:Postort faltkod="220">${iu.postort}</agd:Postort>` : ""}
        </agd:BetalningsmottagareIUGROUP>
        
        ${iu.arbetsplatsensGatuadress ? `<agd:ArbetsplatsensGatuadress faltkod="245">${iu.arbetsplatsensGatuadress}</agd:ArbetsplatsensGatuadress>` : ""}
        ${iu.arbetsplatsensOrt ? `<agd:ArbetsplatsensOrt faltkod="246">${iu.arbetsplatsensOrt}</agd:ArbetsplatsensOrt>` : ""}
        
        <agd:RedovisningsPeriod faltkod="006">${data.redovisningsperiod}</agd:RedovisningsPeriod>
        <agd:Specifikationsnummer faltkod="570">${iu.specifikationsnummer}</agd:Specifikationsnummer>
        <agd:KontantErsattningUlagAG faltkod="011">${Math.round(iu.kontantErsattningUlagAG)}</agd:KontantErsattningUlagAG>
        ${iu.skatteplOvrigaFormanerUlagAG && iu.skatteplOvrigaFormanerUlagAG > 0 ? `<agd:SkatteplOvrigaFormanerUlagAG faltkod="012">${Math.round(iu.skatteplOvrigaFormanerUlagAG)}</agd:SkatteplOvrigaFormanerUlagAG>` : ""}
        ${iu.skatteplBilformanUlagAG && iu.skatteplBilformanUlagAG > 0 ? `<agd:SkatteplBilformanUlagAG faltkod="013">${Math.round(iu.skatteplBilformanUlagAG)}</agd:SkatteplBilformanUlagAG>` : ""}
        <agd:AvdrPrelSkatt faltkod="001">${Math.round(iu.avdrPrelSkatt)}</agd:AvdrPrelSkatt>
        ${iu.bilersattning ? `<agd:Bilersattning faltkod="050">true</agd:Bilersattning>` : ""}
        ${iu.traktamente ? `<agd:Traktamente faltkod="051">true</agd:Traktamente>` : ""}
      </agd:IU>
    </agd:Blankettinnehall>
  </agd:Blankett>`
    )
    .join("")}
  
</Skatteverket>`;
  };
  //#endregion

  //#region Render
  // Helper to build batch data for modal
  // ...existing code...

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Knapp text="📝 Skapa ny lönespecifikation" onClick={() => setNySpecModalOpen(true)} />
      </div>

      <NySpecModal
        isOpen={nySpecModalOpen}
        onClose={() => setNySpecModalOpen(false)}
        nySpecDatum={nySpecDatum}
        setNySpecDatum={setNySpecDatum}
        anstallda={anstallda}
        onSpecCreated={async () => {
          // Refresh lönespecar
          const [specar, anstallda] = await Promise.all([
            hämtaAllaLönespecarFörUser(),
            hämtaAllaAnställda(),
          ]);
          setAnstallda(anstallda);
          const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
          const utlaggResults = await Promise.all(utlaggPromises);
          const utlaggMap: Record<number, any[]> = {};
          anstallda.forEach((a, idx) => {
            utlaggMap[a.id] = utlaggResults[idx];
          });
          setUlaggMap(utlaggMap);
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
        }}
      />

      <UtbetalningsdatumValjare
        datumLista={datumLista}
        utbetalningsdatum={utbetalningsdatum}
        setUtbetalningsdatum={setUtbetalningsdatum}
        specarPerDatum={specarPerDatum}
      />

      {utbetalningsdatum && (
        <LonespecLista
          valdaSpecar={valdaSpecar}
          anstallda={anstallda}
          utlaggMap={utlaggMap}
          onTaBortSpec={hanteraTaBortSpec}
          onHämtaBankgiro={() => setBankgiroModalOpen(true)}
          onMailaSpecar={() => setBatchMailModalOpen(true)}
          onBokför={() => setBokforModalOpen(true)}
          onGenereraAGI={hanteraAGI}
          onBokförSkatter={() => setSkatteModalOpen(true)}
        />
      )}

      {/* EXPORT & BOKFÖRING - LÄNGST NER */}
      {/* EXPORT & BOKFÖRING - LÄNGST NER */}
      {/* Batch mail och bokföring kan implementeras här om du vill, men nu är all gammal state och props borttagen. */}
      {/* Bankgiro modal */}
      {bankgiroModalOpen && (
        <BankgiroExport
          anställda={anstallda}
          utbetalningsdatum={utbetalningsdatum ? new Date(utbetalningsdatum) : null}
          lönespecar={Object.fromEntries(valdaSpecar.map((spec) => [spec.anställd_id, spec]))}
          open={true}
          onClose={() => setBankgiroModalOpen(false)}
        />
      )}
      {/* Batch mail modal */}
      {batchMailModalOpen && (
        <MailaLonespec
          batch={valdaSpecar.map((spec) => ({
            lönespec: spec,
            anställd: anstallda.find((a) => a.id === spec.anställd_id),
            företagsprofil: undefined,
            extrarader: [],
            beräknadeVärden: {},
          }))}
          batchMode={true}
          open={true}
          onClose={() => setBatchMailModalOpen(false)}
        />
      )}
      {/* Bokför modal */}
      {bokforModalOpen && (
        <BokforLoner
          lönespec={valdaSpecar[0]}
          extrarader={valdaSpecar[0] ? extrarader[valdaSpecar[0].id] || [] : []}
          beräknadeVärden={valdaSpecar[0] ? beräknadeVärden[valdaSpecar[0].id] || {} : {}}
          anställdNamn={
            valdaSpecar[0]
              ? (anstallda.find((a) => a.id === valdaSpecar[0].anställd_id)?.förnamn || "") +
                " " +
                (anstallda.find((a) => a.id === valdaSpecar[0].anställd_id)?.efternamn || "")
              : ""
          }
          isOpen={true}
          onClose={() => setBokforModalOpen(false)}
        />
      )}

      {/* AGI Debug Modal */}
      <AGIDebugModal
        visaDebug={visaDebug}
        setVisaDebug={setVisaDebug}
        agiDebugData={agiDebugData}
      />

      {/* Skatte modal */}
      <SkatteBokforingModal
        skatteModalOpen={skatteModalOpen}
        setSkatteModalOpen={setSkatteModalOpen}
        valdaSpecar={valdaSpecar}
        skatteData={skatteData}
        utbetalningsdatum={utbetalningsdatum}
        skatteDatum={skatteDatum}
        setSkatteDatum={setSkatteDatum}
        hanteraBokförSkatter={hanteraBokförSkatter}
        skatteBokförPågår={skatteBokförPågår}
      />
    </div>
  );
  //#endregion
}

"use client";

import { useState } from "react";
import { klassificeraExtrarader } from "../Lonespecar/loneberakningar";
import { RAD_KONFIGURATIONER } from "../Lonespecar/Extrarader/extraradDefinitioner";
import { AGIGeneratorProps } from "../_types/types";

// Props-typ flyttad till delade typer

export default function AGIGenerator({
  valdaSpecar,
  anstallda,
  beräknadeVärden,
  extrarader,
  utbetalningsdatum,
  session,
  hämtaFöretagsprofil,
  onAGIComplete,
}: AGIGeneratorProps) {
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const formatOrganisationsnummer = (orgnr: string): string => {
    const endast_siffror = orgnr.replace(/[^0-9]/g, "");

    if (endast_siffror.length === 10) {
      // Standard format: YYMMDD-XXXX
      return endast_siffror.slice(0, 6) + "-" + endast_siffror.slice(6);
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
      let företagsdata: any = null;
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

          // Traktamente - skattefria traktamenten baserat på typ
          if (rad.typ === "traktamente" && belopp > 0) {
            harTraktamente = true;
          }

          // Bilersättning - skattefria bilersättningar baserat på typ
          if (rad.typ === "bilersättning" && belopp > 0) {
            harBilersättning = true;
          }

          // Skattepliktiga bilförmåner
          if (rad.typ === "bilförmån" && belopp > 0) {
            bilförmånVärde += belopp;
          }

          // Andra skattepliktiga förmåner - generellt för skattepliktiga förmåner
          if (konfig?.skattepliktig === true && rad.typ !== "bilförmån" && belopp > 0) {
            övrigaFörmånerVärde += belopp;
          }
        });

        // Skapa individuppgift för AGI
        const individuppgift = {
          specifikationsnummer: spec.id.toString(),
          betalningsmottagareId: anstalld.personnummer || `TEMP${anstalld.id}`,

          // Personuppgifter
          fornamn: anstalld.förnamn || "Okänt",
          efternamn: anstalld.efternamn || "Namn",
          gatuadress: anstalld.adress || null,
          postnummer: anstalld.postnummer || null,
          postort: anstalld.ort || null,

          // Arbetsplats
          arbetsplatsensGatuadress: anstalld.tjänsteställe_adress || null,
          arbetsplatsensOrt: anstalld.tjänsteställe_ort || null,

          // Ekonomiska uppgifter (alla måste vara nummer för AGI)
          kontantErsattningUlagAG: Math.round(bruttolön), // Kod 011
          skatteplOvrigaFormanerUlagAG:
            övrigaFörmånerVärde > 0 ? Math.round(övrigaFörmånerVärde) : null, // Kod 012
          skatteplBilformanUlagAG: bilförmånVärde > 0 ? Math.round(bilförmånVärde) : null, // Kod 013
          avdrPrelSkatt: Math.round(skatt), // Kod 001

          // Indikatorer (boolean/flaggor)
          traktamente: harTraktamente, // Kod 051
          bilersattning: harBilersättning, // Kod 050
        };

        agiData.individuppgifter.push(individuppgift);
        agiData.summaArbAvgSlf += Math.round(socialaAvgifter);
        agiData.summaSkatteavdr += Math.round(skatt);

        // Spara för debug
        debugInfo.lönespecData.push({
          id: spec.id,
          grundlön: spec.grundlön,
          bruttolön: spec.bruttolön,
          specSkatt: spec.skatt,
          beräknadSkatt: skatt,
          socialaAvgifter: socialaAvgifter,
          beräknadBruttolön: bruttolön,
        });
      });

      debugInfo.finalAgiData = agiData;

      const xml = genereraAGIXML(agiData);

      // Ladda ner filen direkt utan debug-modal
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arbetsgivardeklaration_${agiData.redovisningsperiod}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Anropa callback när AGI är genererad
      onAGIComplete?.();
    } catch (error: any) {
      console.error("Fel vid AGI-generering:", error);
      setToast({ type: "error", message: `Fel vid AGI-generering: ${error?.message || error}` });
    }
  };

  // Hjälpfunktion för XML-generering
  const genereraAGIXML = (data: any) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<agd:ArbetsgivareDeklaration xmlns:agd="http://xmls.skatteverket.se/se/skatteverket/da/instans/infoForArbetsgivare/20121001" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://xmls.skatteverket.se/se/skatteverket/da/instans/infoForArbetsgivare/20121001 http://xmls.skatteverket.se/se/skatteverket/da/schema/infoForArbetsgivare/20121001/ArbetsgivareDeklaration.xsd">
  
  <!-- Blankettgemensamt -->
  <agd:Blankettgemensamt>
    <agd:Identitet>
      <agd:Organisationsnummer>${data.organisationsnummer}</agd:Organisationsnummer>
    </agd:Identitet>
    
    <agd:Arbetsgivare>
      <agd:Namn>${data.företagsnamn}</agd:Namn>
      <agd:KontaktpersonNamn>${data.kontaktperson.namn}</agd:KontaktpersonNamn>
      <agd:KontaktpersonTelefonnummer>${data.kontaktperson.telefon}</agd:KontaktpersonTelefonnummer>
      <agd:KontaktpersonEpost>${data.kontaktperson.epost}</agd:KontaktpersonEpost>
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
  
  <!-- Individuppgifter -->
  ${data.individuppgifter
    .map(
      (iu: any) => `
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${data.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${data.redovisningsperiod}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:IU>
        <agd:BetalningsmottagareIUGROUP>
          <agd:BetalningsmottagareId faltkod="215">${iu.betalningsmottagareId}</agd:BetalningsmottagareId>
        </agd:BetalningsmottagareIUGROUP>
        
        <agd:Fornamn faltkod="216">${iu.fornamn}</agd:Fornamn>
        <agd:Efternamn faltkod="217">${iu.efternamn}</agd:Efternamn>
        ${iu.gatuadress ? `<agd:Gatuadress faltkod="218">${iu.gatuadress}</agd:Gatuadress>` : ""}
        ${iu.postnummer ? `<agd:Postnummer faltkod="219">${iu.postnummer}</agd:Postnummer>` : ""}
        ${iu.postort ? `<agd:Postort faltkod="220">${iu.postort}</agd:Postort>` : ""}
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
    
</agd:ArbetsgivareDeklaration>`;
  };

  return {
    hanteraAGI,
    toast,
    setToast,
  };
}

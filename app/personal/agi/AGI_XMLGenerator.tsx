"use client";

import React, { useState } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";

interface TekniskKontakt {
  namn: string;
  telefon: string;
  epost: string;
}

interface IndividuppgiftData {
  specifikationsnummer: number;

  // ID-fält (endast ett av dessa ska vara ifyllt)
  betalningsmottagareId?: string;
  fodelsetid?: string;
  annatId?: string;

  // Namn och adress
  fornamn?: string;
  efternamn?: string;
  gatuadress?: string;
  postnummer?: string;
  postort?: string;
  landskodPostort?: string;

  // Födelse och medborgarskap
  fodelseort?: string;
  landskodFodelseort?: string;
  landskodMedborgare?: string;

  // TIN (skatteregistreringsnummer)
  tin?: string;
  landskodTIN?: string;

  // Ersättningar - kontant ersättning
  kontantErsattningUlagAG?: number;
  kontantErsattningEjUlagSA?: number;

  // Bilförmån
  skatteplBilformanUlagAG?: number;
  drivmVidBilformanUlagAG?: number;
  betForDrivmVidBilformanUlagAG?: number;

  // Övriga förmåner
  skatteplOvrigaFormanerUlagAG?: number;

  // Avräkning avgiftsfri ersättning
  avrakningAvgiftsfriErs?: number;

  // Ersättningskoder (upp till 3 par kod/belopp)
  ersattningsKod1?: string;
  ersattningsBelopp1?: number;
  ersattningsKod2?: string;
  ersattningsBelopp2?: number;
  ersattningsKod3?: string;
  ersattningsBelopp3?: number;

  // Förmåner (checkboxar)
  traktamente?: boolean;
  bilersattning?: boolean;

  // Arbetsplats
  arbetsplatsensGatuadress?: string;
  arbetsplatsensOrt?: string;

  // Utsändning
  utsandUnderTid?: string;
  konventionMed?: string;
  landskodArbetsland?: string;

  // Sjöinkomst
  fartygssignal?: string;
  antalDagarSjoinkomst?: number;
  narfartFjarrfart?: string;
  fartygetsNamn?: string;

  // Verksamhet (A-SINK)
  verksamhetensArt?: string;

  // Skattefält (endast ett av dessa ska vara ifyllt)
  avdrPrelSkatt?: number;
  avdrSkattSINK?: number;
  avdrSkattASINK?: number;
  skattebefrEnlAvtal?: boolean;
  ejskatteavdragEjbeskattningSv?: boolean;
  lokalanstalld?: boolean;
  ambassadanstISvMAvtal?: boolean;

  // Korrigering
  borttag?: boolean;
}

interface FranvarouppgiftData {
  franvaroDatum: string;
  betalningsmottagareId: string;
  specifikationsnummer: number;
  franvaroTyp: "FORALDRAPENNING" | "TILLFALLIG_FORALDRAPENNING";

  // För tillfällig föräldrapenning
  franvaroProcentTFP?: number;
  franvaroTimmarTFP?: number;

  // För föräldrapenning
  franvaroProcentFP?: number;
  franvaroTimmarFP?: number;

  // Korrigering
  franvaroBorttag?: boolean;
}

interface AGIFormData {
  // Avsändare
  programnamn: string;
  organisationsnummer: string;
  tekniskKontakt: TekniskKontakt;

  // Huvuduppgift
  agRegistreradId: string;
  redovisningsperiod: string;
  ejFastDriftställe?: boolean;

  // Summor från huvuduppgift
  summaArbAvgSlf?: number;
  summaSkatteavdr?: number;
  totalSjuklonekostnad?: number;

  // Individuppgifter och frånvarouppgifter
  individuppgifter: IndividuppgiftData[];
  franvarouppgifter: FranvarouppgiftData[];
}

export default function AGI_XMLGenerator() {
  // Hjälpfunktion för att formatera redovisningsperiod till XML-format (ta bort bindestreck)
  const formatRedovisningsperiodForXML = (period: string): string => {
    return period.replace("-", "");
  };

  // Hjälpfunktion för att formatera organisationsnummer till XML-format (ta bort bindestreck)
  const formatOrganisationsnummerForXML = (orgnr: string): string => {
    return orgnr.replace("-", "");
  };

  const [formData, setFormData] = useState<AGIFormData>({
    programnamn: "BokförCom AGI Generator v1.0",
    organisationsnummer: "",
    tekniskKontakt: {
      namn: "",
      telefon: "",
      epost: "",
    },
    agRegistreradId: "",
    redovisningsperiod: "",
    individuppgifter: [],
    franvarouppgifter: [],
  });

  const [generatedXML, setGeneratedXML] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Organisationsnummer format validation (Skatteverkets IDENTITET pattern)
    if (!formData.organisationsnummer) {
      errors.push("Organisationsnummer är obligatoriskt");
    } else if (
      !/^\d{6}-\d{4}$/.test(formData.organisationsnummer) &&
      !/^\d{12}$/.test(formData.organisationsnummer.replace("-", ""))
    ) {
      errors.push(
        "Organisationsnummer måste ha format XXXXXX-XXXX eller 12 siffror (t.ex. 556123-4567 eller 165560269986)"
      );
    }

    // AG-registrerat ID (12 siffror)
    if (!formData.agRegistreradId) {
      errors.push("AG-registrerat ID är obligatoriskt");
    } else if (!/^\d{12}$/.test(formData.agRegistreradId)) {
      errors.push("AG-registrerat ID måste ha 12 siffror (t.ex. 165560269986)");
    }

    // Redovisningsperiod format validation (Skatteverkets REDOVISNINGSPERIOD pattern)
    if (!formData.redovisningsperiod) {
      errors.push("Redovisningsperiod är obligatorisk");
    } else if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(formData.redovisningsperiod)) {
      errors.push(
        `Redovisningsperiod "${formData.redovisningsperiod}" är ogiltig. Format YYYY-MM (t.ex. 2025-06)`
      );
    } else {
      // Additional check for minimum date (2018-07)
      const [year, month] = formData.redovisningsperiod.split("-").map(Number);
      if (year < 2018 || (year === 2018 && month < 7)) {
        errors.push(
          `Redovisningsperiod "${formData.redovisningsperiod}" är för tidig. Måste vara från 2018-07 och framåt`
        );
      }
    }

    // Kontaktperson validation
    if (!formData.tekniskKontakt.namn) {
      errors.push("Teknisk kontaktperson namn är obligatoriskt");
    }
    if (!formData.tekniskKontakt.telefon) {
      errors.push("Teknisk kontaktperson telefon är obligatoriskt");
    }

    // E-post format validation
    if (!formData.tekniskKontakt.epost) {
      errors.push("Teknisk kontaktperson e-post är obligatorisk");
    } else if (
      !/^[a-zA-Z0-9_]+([-+.'][a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*\.[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*$/.test(
        formData.tekniskKontakt.epost
      )
    ) {
      errors.push("Teknisk kontaktperson e-post måste ha giltigt format (t.ex. namn@exempel.se)");
    }

    // Individuppgifter validation
    formData.individuppgifter.forEach((iu, index) => {
      const hasAnyId = iu.betalningsmottagareId || iu.fodelsetid || iu.annatId;
      if (!hasAnyId) {
        errors.push(
          `Individuppgift ${index + 1}: Minst ett ID-fält måste vara ifyllt (Betalningsmottagare ID, Födelsetid eller Annat ID)`
        );
      }
    });

    return errors;
  };

  const generateXML = () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const timestamp = new Date().toISOString();

    // Generera frånvarouppgifter XML
    const franvaroXML = formData.franvarouppgifter
      .map(
        (fu) => `
  <agd:Franvarouppgift>
    <agd:AgRegistreradId faltkod="201">${formData.agRegistreradId}</agd:AgRegistreradId>
    <agd:RedovisningsPeriod faltkod="006">${formatRedovisningsperiodForXML(formData.redovisningsperiod)}</agd:RedovisningsPeriod>
    <agd:FranvaroDatum faltkod="821">${fu.franvaroDatum}</agd:FranvaroDatum>
    <agd:BetalningsmottagarId faltkod="215">${fu.betalningsmottagareId}</agd:BetalningsmottagarId>
    <agd:FranvaroSpecifikationsnummer faltkod="822">${fu.specifikationsnummer}</agd:FranvaroSpecifikationsnummer>
    <agd:FranvaroTyp faltkod="823">${fu.franvaroTyp}</agd:FranvaroTyp>
    ${fu.franvaroTyp === "TILLFALLIG_FORALDRAPENNING" && fu.franvaroProcentTFP ? `<agd:FranvaroProcentTFP faltkod="824">${fu.franvaroProcentTFP}</agd:FranvaroProcentTFP>` : ""}
    ${fu.franvaroTyp === "TILLFALLIG_FORALDRAPENNING" && fu.franvaroTimmarTFP ? `<agd:FranvaroTimmarTFP faltkod="825">${fu.franvaroTimmarTFP}</agd:FranvaroTimmarTFP>` : ""}
    ${fu.franvaroTyp === "FORALDRAPENNING" && fu.franvaroProcentFP ? `<agd:FranvaroProcentFP faltkod="826">${fu.franvaroProcentFP}</agd:FranvaroProcentFP>` : ""}
    ${fu.franvaroTyp === "FORALDRAPENNING" && fu.franvaroTimmarFP ? `<agd:FranvaroTimmarFP faltkod="827">${fu.franvaroTimmarFP}</agd:FranvaroTimmarFP>` : ""}
    ${fu.franvaroBorttag ? `<agd:FranvaroBorttag faltkod="820">1</agd:FranvaroBorttag>` : ""}
  </agd:Franvarouppgift>`
      )
      .join("");

    // Generera individuppgifter XML
    const individuppgifterXML = formData.individuppgifter
      .map(
        (iu) => `
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${formData.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${formatRedovisningsperiodForXML(formData.redovisningsperiod)}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:IU>
        <agd:ArbetsgivareIUGROUP>
          <agd:AgRegistreradId faltkod="201">${formData.agRegistreradId}</agd:AgRegistreradId>
        </agd:ArbetsgivareIUGROUP>
        
        <agd:BetalningsmottagareIUGROUP>
          ${
            iu.betalningsmottagareId || iu.fodelsetid || iu.annatId
              ? `
          <agd:BetalningsmottagareIDChoice>
            ${iu.betalningsmottagareId ? `<agd:BetalningsmottagarId faltkod="215">${iu.betalningsmottagareId}</agd:BetalningsmottagarId>` : ""}
            ${iu.fodelsetid ? `<agd:Fodelsetid faltkod="222">${iu.fodelsetid}</agd:Fodelsetid>` : ""}
            ${iu.annatId ? `<agd:AnnatId faltkod="224">${iu.annatId}</agd:AnnatId>` : ""}
          </agd:BetalningsmottagareIDChoice>`
              : ""
          }
          
          ${iu.fornamn ? `<agd:Fornamn faltkod="216">${iu.fornamn}</agd:Fornamn>` : ""}
          ${iu.efternamn ? `<agd:Efternamn faltkod="217">${iu.efternamn}</agd:Efternamn>` : ""}
          ${iu.gatuadress ? `<agd:Gatuadress faltkod="218">${iu.gatuadress}</agd:Gatuadress>` : ""}
          ${iu.postnummer ? `<agd:Postnummer faltkod="219">${iu.postnummer}</agd:Postnummer>` : ""}
          ${iu.postort ? `<agd:Postort faltkod="220">${iu.postort}</agd:Postort>` : ""}
          ${iu.landskodPostort ? `<agd:LandskodPostort faltkod="221">${iu.landskodPostort}</agd:LandskodPostort>` : ""}
          ${iu.fodelseort ? `<agd:Fodelseort faltkod="077">${iu.fodelseort}</agd:Fodelseort>` : ""}
          ${iu.landskodFodelseort ? `<agd:LandskodFodelseort faltkod="078">${iu.landskodFodelseort}</agd:LandskodFodelseort>` : ""}
          ${iu.landskodMedborgare ? `<agd:LandskodMedborgare faltkod="081">${iu.landskodMedborgare}</agd:LandskodMedborgare>` : ""}
          ${iu.tin ? `<agd:TIN faltkod="252">${iu.tin}</agd:TIN>` : ""}
          ${iu.landskodTIN ? `<agd:LandskodTIN faltkod="076">${iu.landskodTIN}</agd:LandskodTIN>` : ""}
        </agd:BetalningsmottagareIUGROUP>
        
        <agd:RedovisningsPeriod faltkod="006">${formatRedovisningsperiodForXML(formData.redovisningsperiod)}</agd:RedovisningsPeriod>
        <agd:Specifikationsnummer faltkod="570">${iu.specifikationsnummer}</agd:Specifikationsnummer>
        
        <!-- Ersättningar -->
        ${iu.kontantErsattningUlagAG ? `<agd:KontantErsattningUlagAG faltkod="011">${iu.kontantErsattningUlagAG}</agd:KontantErsattningUlagAG>` : ""}
        ${iu.kontantErsattningEjUlagSA ? `<agd:KontantErsattningEjUlagSA faltkod="131">${iu.kontantErsattningEjUlagSA}</agd:KontantErsattningEjUlagSA>` : ""}
        ${iu.skatteplBilformanUlagAG ? `<agd:SkatteplBilformanUlagAG faltkod="013">${iu.skatteplBilformanUlagAG}</agd:SkatteplBilformanUlagAG>` : ""}
        ${iu.drivmVidBilformanUlagAG ? `<agd:DrivmVidBilformanUlagAG faltkod="018">${iu.drivmVidBilformanUlagAG}</agd:DrivmVidBilformanUlagAG>` : ""}
        ${iu.betForDrivmVidBilformanUlagAG ? `<agd:BetForDrivmVidBilformanUlagAG faltkod="098">${iu.betForDrivmVidBilformanUlagAG}</agd:BetForDrivmVidBilformanUlagAG>` : ""}
        ${iu.skatteplOvrigaFormanerUlagAG ? `<agd:SkatteplOvrigaFormanerUlagAG faltkod="014">${iu.skatteplOvrigaFormanerUlagAG}</agd:SkatteplOvrigaFormanerUlagAG>` : ""}
        ${iu.avrakningAvgiftsfriErs ? `<agd:AvrakningAvgiftsfriErs faltkod="010">${iu.avrakningAvgiftsfriErs}</agd:AvrakningAvgiftsfriErs>` : ""}
        
        <!-- Ersättningskoder -->
        ${iu.ersattningsKod1 && iu.ersattningsBelopp1 ? `<agd:ErsattningsKod1 faltkod="004">${iu.ersattningsKod1}</agd:ErsattningsKod1>` : ""}
        ${iu.ersattningsKod1 && iu.ersattningsBelopp1 ? `<agd:ErsattningsBelopp1 faltkod="005">${iu.ersattningsBelopp1}</agd:ErsattningsBelopp1>` : ""}
        ${iu.ersattningsKod2 && iu.ersattningsBelopp2 ? `<agd:ErsattningsKod2 faltkod="254">${iu.ersattningsKod2}</agd:ErsattningsKod2>` : ""}
        ${iu.ersattningsKod2 && iu.ersattningsBelopp2 ? `<agd:ErsattningsBelopp2 faltkod="255">${iu.ersattningsBelopp2}</agd:ErsattningsBelopp2>` : ""}
        ${iu.ersattningsKod3 && iu.ersattningsBelopp3 ? `<agd:ErsattningsKod3 faltkod="256">${iu.ersattningsKod3}</agd:ErsattningsKod3>` : ""}
        ${iu.ersattningsKod3 && iu.ersattningsBelopp3 ? `<agd:ErsattningsBelopp3 faltkod="257">${iu.ersattningsBelopp3}</agd:ErsattningsBelopp3>` : ""}
        
        <!-- Förmåner -->
        ${iu.traktamente ? `<agd:Traktamente faltkod="051">1</agd:Traktamente>` : ""}
        ${iu.bilersattning ? `<agd:Bilersattning faltkod="050">1</agd:Bilersattning>` : ""}
        
        <!-- Arbetsplats -->
        ${iu.arbetsplatsensGatuadress ? `<agd:ArbetsplatsensGatuadress faltkod="245">${iu.arbetsplatsensGatuadress}</agd:ArbetsplatsensGatuadress>` : ""}
        ${iu.arbetsplatsensOrt ? `<agd:ArbetsplatsensOrt faltkod="246">${iu.arbetsplatsensOrt}</agd:ArbetsplatsensOrt>` : ""}
        
        <!-- Utsändning -->
        ${iu.utsandUnderTid ? `<agd:UtsandUnderTid faltkod="091">${iu.utsandUnderTid}</agd:UtsandUnderTid>` : ""}
        ${iu.konventionMed ? `<agd:KonventionMed faltkod="305">${iu.konventionMed}</agd:KonventionMed>` : ""}
        ${iu.landskodArbetsland ? `<agd:LandskodArbetsland faltkod="090">${iu.landskodArbetsland}</agd:LandskodArbetsland>` : ""}
        
        <!-- Sjöinkomst -->
        ${iu.fartygssignal ? `<agd:Fartygssignal faltkod="026">${iu.fartygssignal}</agd:Fartygssignal>` : ""}
        ${iu.antalDagarSjoinkomst ? `<agd:AntalDagarSjoinkomst faltkod="027">${iu.antalDagarSjoinkomst}</agd:AntalDagarSjoinkomst>` : ""}
        ${iu.narfartFjarrfart ? `<agd:NarfartFjarrfart faltkod="028">${iu.narfartFjarrfart}</agd:NarfartFjarrfart>` : ""}
        ${iu.fartygetsNamn ? `<agd:FartygetsNamn faltkod="223">${iu.fartygetsNamn}</agd:FartygetsNamn>` : ""}
        
        <!-- Verksamhet (A-SINK) -->
        ${iu.verksamhetensArt ? `<agd:VerksamhetensArt faltkod="112">${iu.verksamhetensArt}</agd:VerksamhetensArt>` : ""}
        
        <!-- Skattefält (exakt ett måste vara ifyllt) -->
        ${iu.avdrPrelSkatt !== undefined ? `<agd:AvdrPrelSkatt faltkod="001">${iu.avdrPrelSkatt}</agd:AvdrPrelSkatt>` : ""}
        ${iu.avdrSkattSINK !== undefined ? `<agd:AvdrSkattSINK faltkod="274">${iu.avdrSkattSINK}</agd:AvdrSkattSINK>` : ""}
        ${iu.avdrSkattASINK !== undefined ? `<agd:AvdrSkattASINK faltkod="275">${iu.avdrSkattASINK}</agd:AvdrSkattASINK>` : ""}
        ${iu.skattebefrEnlAvtal ? `<agd:SkattebefrEnlAvtal faltkod="114">1</agd:SkattebefrEnlAvtal>` : ""}
        ${iu.ejskatteavdragEjbeskattningSv ? `<agd:EjskatteavdragEjbeskattningSv faltkod="276">1</agd:EjskatteavdragEjbeskattningSv>` : ""}
        ${iu.lokalanstalld ? `<agd:Lokalanstalld faltkod="253">1</agd:Lokalanstalld>` : ""}
        ${iu.ambassadanstISvMAvtal ? `<agd:AmbassadanstISvMAvtal faltkod="094">1</agd:AmbassadanstISvMAvtal>` : ""}
        
        <!-- Korrigering -->
        ${iu.borttag ? `<agd:Borttag faltkod="205">1</agd:Borttag>` : ""}
      </agd:IU>
    </agd:Blankettinnehall>
  </agd:Blankett>`
      )
      .join("");

    // Generera komplett XML
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Skatteverket omrade="Arbetsgivardeklaration" xmlns="http://xmls.skatteverket.se/se/skatteverket/da/instans/schema/1.1"
xmlns:agd="http://xmls.skatteverket.se/se/skatteverket/da/komponent/schema/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://xmls.skatteverket.se/se/skatteverket/da/instans/schema/1.1
http://xmls.skatteverket.se/se/skatteverket/da/arbetsgivardeklaration/arbetsgivardeklaration_1.1.xsd">
  <agd:Avsandare>
    <agd:Programnamn>${formData.programnamn}</agd:Programnamn>
    <agd:Organisationsnummer>${formatOrganisationsnummerForXML(formData.organisationsnummer)}</agd:Organisationsnummer>
    <agd:TekniskKontaktperson>
      <agd:Namn>${formData.tekniskKontakt.namn}</agd:Namn>
      <agd:Telefon>${formData.tekniskKontakt.telefon}</agd:Telefon>
      <agd:Epostadress>${formData.tekniskKontakt.epost}</agd:Epostadress>
    </agd:TekniskKontaktperson>
    <agd:Skapad>${timestamp}</agd:Skapad>
  </agd:Avsandare>
  
  <agd:Blankettgemensamt>
    <agd:Arbetsgivare>
      <agd:AgRegistreradId>${formData.agRegistreradId}</agd:AgRegistreradId>
      <agd:Kontaktperson>
        <agd:Namn>${formData.tekniskKontakt.namn}</agd:Namn>
        <agd:Telefon>${formData.tekniskKontakt.telefon}</agd:Telefon>
        <agd:Epostadress>${formData.tekniskKontakt.epost}</agd:Epostadress>
      </agd:Kontaktperson>
    </agd:Arbetsgivare>
  </agd:Blankettgemensamt>
  
  <!-- Huvuduppgift -->
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${formData.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${formatRedovisningsperiodForXML(formData.redovisningsperiod)}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:HU>
        <agd:ArbetsgivareHUGROUP>
          <agd:AgRegistreradId faltkod="201">${formData.agRegistreradId}</agd:AgRegistreradId>
          ${formData.ejFastDriftställe ? '<agd:EjFastDriftstalleISv faltkod="115">1</agd:EjFastDriftstalleISv>' : ""}
        </agd:ArbetsgivareHUGROUP>
        
        <agd:RedovisningsPeriod faltkod="006">${formatRedovisningsperiodForXML(formData.redovisningsperiod)}</agd:RedovisningsPeriod>
        
        ${formData.summaArbAvgSlf ? `<agd:SummaArbAvgSlf faltkod="487">${formData.summaArbAvgSlf}</agd:SummaArbAvgSlf>` : ""}
        ${formData.summaSkatteavdr ? `<agd:SummaSkatteavdr faltkod="497">${formData.summaSkatteavdr}</agd:SummaSkatteavdr>` : ""}
        ${formData.totalSjuklonekostnad ? `<agd:TotalSjuklonekostnad faltkod="499">${formData.totalSjuklonekostnad}</agd:TotalSjuklonekostnad>` : ""}
      </agd:HU>
    </agd:Blankettinnehall>
  </agd:Blankett>
      
  <!-- Individuppgifter -->
  ${individuppgifterXML}
  
  <!-- Frånvarouppgifter (2025) -->
  ${franvaroXML}
  
</Skatteverket>`;

    setGeneratedXML(xml);
  };

  const addIndividuppgift = () => {
    setFormData((prev) => ({
      ...prev,
      individuppgifter: [
        ...prev.individuppgifter,
        {
          specifikationsnummer: prev.individuppgifter.length + 1,
          avdrPrelSkatt: 0, // Default till preliminärskatt
        },
      ],
    }));
  };

  const addFranvarouppgift = () => {
    setFormData((prev) => ({
      ...prev,
      franvarouppgifter: [
        ...prev.franvarouppgifter,
        {
          franvaroDatum: "",
          betalningsmottagareId: "",
          specifikationsnummer: prev.franvarouppgifter.length + 1,
          franvaroTyp: "FORALDRAPENNING",
        },
      ],
    }));
  };

  const loadTestData = () => {
    setFormData({
      programnamn: "BokförCom AGI Generator v1.0",
      organisationsnummer: "165560269986",
      tekniskKontakt: {
        namn: "Anna Andersson",
        telefon: "08-123456",
        epost: "anna.andersson@example.se",
      },
      agRegistreradId: "165560269986",
      redovisningsperiod: "2025-06",
      ejFastDriftställe: false,
      summaArbAvgSlf: 10997,
      summaSkatteavdr: 7000,
      // totalSjuklonekostnad: 2000, // Inte giltigt för 2025
      individuppgifter: [
        {
          specifikationsnummer: 1,
          betalningsmottagareId: "198202252386",
          fornamn: "Erik",
          efternamn: "Eriksson",
          kontantErsattningUlagAG: 35000,
          avdrPrelSkatt: 7000,
        },
      ],
      franvarouppgifter: [],
    });
  };

  const resetForm = () => {
    setFormData({
      programnamn: "BokförCom AGI Generator v1.0",
      organisationsnummer: "",
      tekniskKontakt: {
        namn: "",
        telefon: "",
        epost: "",
      },
      agRegistreradId: "",
      redovisningsperiod: "",
      individuppgifter: [],
      franvarouppgifter: [],
    });
    setGeneratedXML("");
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">🏢 AGI XML Generator</h1>
        <p className="text-gray-300 text-lg">
          Generera Arbetsgivardeklaration XML enligt Skatteverkets schema 1.1.17.1
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-900 border border-red-600 rounded-md p-4 mb-6">
          <h3 className="text-red-200 font-medium mb-2">Valideringsfel:</h3>
          <ul className="list-disc list-inside text-red-300 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* Avsändare */}
        <AnimeradFlik title="Avsändare" icon="👤" forcedOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Programnamn</label>
              <input
                type="text"
                value={formData.programnamn}
                onChange={(e) => setFormData((prev) => ({ ...prev, programnamn: e.target.value }))}
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organisationsnummer
              </label>
              <input
                type="text"
                placeholder="556123-4567"
                value={formData.organisationsnummer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organisationsnummer: e.target.value }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kontaktperson namn
              </label>
              <input
                type="text"
                value={formData.tekniskKontakt.namn}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tekniskKontakt: { ...prev.tekniskKontakt, namn: e.target.value },
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
              <input
                type="text"
                value={formData.tekniskKontakt.telefon}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tekniskKontakt: { ...prev.tekniskKontakt, telefon: e.target.value },
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">E-post</label>
              <input
                type="email"
                value={formData.tekniskKontakt.epost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tekniskKontakt: { ...prev.tekniskKontakt, epost: e.target.value },
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
          </div>
        </AnimeradFlik>

        {/* Huvuduppgift */}
        <AnimeradFlik title="Huvuduppgift" icon="🏢" forcedOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                AG-registrerat ID
              </label>
              <input
                type="text"
                placeholder="165560269986"
                value={formData.agRegistreradId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agRegistreradId: e.target.value }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Redovisningsperiod
              </label>
              <input
                type="text"
                placeholder="2025-06"
                value={formData.redovisningsperiod}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, redovisningsperiod: e.target.value }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ejFastDriftställe || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ejFastDriftställe: e.target.checked }))
                  }
                  className="mr-2"
                />
                Ej fast driftställe i Sverige
              </label>
            </div>
          </div>
        </AnimeradFlik>

        {/* Summor */}
        <AnimeradFlik title="Summor från huvuduppgift" icon="🧮">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Summa arbetsgivaravgifter (487)
              </label>
              <input
                type="number"
                value={formData.summaArbAvgSlf || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    summaArbAvgSlf: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Summa skatteavdrag (497)
              </label>
              <input
                type="number"
                value={formData.summaSkatteavdr || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    summaSkatteavdr: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Total sjuklönekostnad (232)
              </label>
              <input
                type="number"
                value={formData.totalSjuklonekostnad || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalSjuklonekostnad: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
              />
            </div>
          </div>
        </AnimeradFlik>

        {/* Individuppgifter */}
        <AnimeradFlik title={`Individuppgifter (${formData.individuppgifter.length})`} icon="👥">
          <div className="space-y-4">
            <button
              onClick={addIndividuppgift}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Lägg till individuppgift
            </button>
            {formData.individuppgifter.map((iu, index) => (
              <div key={index} className="border border-gray-600 bg-gray-900 rounded-md p-4">
                <h4 className="font-medium mb-3 text-white">Individuppgift {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Specifikationsnummer
                    </label>
                    <input
                      type="number"
                      value={iu.specifikationsnummer}
                      onChange={(e) => {
                        const newIndivid = [...formData.individuppgifter];
                        newIndivid[index].specifikationsnummer = parseInt(e.target.value);
                        setFormData((prev) => ({ ...prev, individuppgifter: newIndivid }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Preliminärskatt (001)
                    </label>
                    <input
                      type="number"
                      value={iu.avdrPrelSkatt || ""}
                      onChange={(e) => {
                        const newIndivid = [...formData.individuppgifter];
                        newIndivid[index].avdrPrelSkatt = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        setFormData((prev) => ({ ...prev, individuppgifter: newIndivid }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Kontant ersättning (011)
                    </label>
                    <input
                      type="number"
                      value={iu.kontantErsattningUlagAG || ""}
                      onChange={(e) => {
                        const newIndivid = [...formData.individuppgifter];
                        newIndivid[index].kontantErsattningUlagAG = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        setFormData((prev) => ({ ...prev, individuppgifter: newIndivid }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimeradFlik>

        {/* Frånvarouppgifter */}
        <AnimeradFlik
          title={`Frånvarouppgifter 2025 (${formData.franvarouppgifter.length})`}
          icon="📅"
        >
          <div className="space-y-4">
            <button
              onClick={addFranvarouppgift}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Lägg till frånvarouppgift
            </button>
            {formData.franvarouppgifter.map((fu, index) => (
              <div key={index} className="border border-gray-600 bg-gray-900 rounded-md p-4">
                <h4 className="font-medium mb-3 text-white">Frånvarouppgift {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Frånvarodatum
                    </label>
                    <input
                      type="date"
                      value={fu.franvaroDatum}
                      onChange={(e) => {
                        const newFranvaro = [...formData.franvarouppgifter];
                        newFranvaro[index].franvaroDatum = e.target.value;
                        setFormData((prev) => ({ ...prev, franvarouppgifter: newFranvaro }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Betalnings­mottagare ID
                    </label>
                    <input
                      type="text"
                      value={fu.betalningsmottagareId}
                      onChange={(e) => {
                        const newFranvaro = [...formData.franvarouppgifter];
                        newFranvaro[index].betalningsmottagareId = e.target.value;
                        setFormData((prev) => ({ ...prev, franvarouppgifter: newFranvaro }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Frånvarotyp
                    </label>
                    <select
                      value={fu.franvaroTyp}
                      onChange={(e) => {
                        const newFranvaro = [...formData.franvarouppgifter];
                        newFranvaro[index].franvaroTyp = e.target.value as
                          | "FORALDRAPENNING"
                          | "TILLFALLIG_FORALDRAPENNING";
                        setFormData((prev) => ({ ...prev, franvarouppgifter: newFranvaro }));
                      }}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50"
                    >
                      <option value="FORALDRAPENNING">Föräldrapenning</option>
                      <option value="TILLFALLIG_FORALDRAPENNING">Tillfällig föräldrapenning</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimeradFlik>

        {/* Generera XML */}
        <div className="flex gap-4">
          <button
            onClick={resetForm}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium"
          >
            🗑️ Rensa
          </button>
          <button
            onClick={loadTestData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            📝 Ladda testdata
          </button>
          <button
            onClick={generateXML}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Generera XML
          </button>
        </div>

        {/* XML Output */}
        {generatedXML && (
          <AnimeradFlik title="Genererad XML" icon="📄" forcedOpen={true}>
            <div className="bg-gray-900 border border-gray-600 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm overflow-x-auto text-gray-300">
                {generatedXML}
              </pre>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(generatedXML)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Kopiera XML
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([generatedXML], { type: "text/xml" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "arbetsgivardeklaration.xml";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Ladda ner XML
              </button>
            </div>
          </AnimeradFlik>
        )}
      </div>
    </div>
  );
}

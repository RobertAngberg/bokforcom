/**
 * AGI (Arbetsgivardeklaration) XML-generering
 * Baserat på återställd kod från git commit ca21f31
 */

interface AGIData {
  agRegistreradId: string;
  redovisningsperiod: string;
  organisationsnummer: string;
  tekniskKontakt: {
    namn: string;
    telefon: string;
    epost: string;
  };
  individuppgifter: Array<{
    specifikationsnummer: number;
    betalningsmottagareId?: string;
    fodelsetid?: string;
    annatId?: string;
    fornamn?: string;
    efternamn?: string;
    gatuadress?: string;
    postnummer?: string;
    postort?: string;
    kontantErsattningUlagAG?: number;
    kontantErsattningEjUlagSA?: number;
    skatteplBilformanUlagAG?: number;
    skatteplOvrigaFormanerUlagAG?: number;
    avrakningAvgiftsfriErs?: number;
  }>;
  franvarouppgifter: Array<{
    franvaroDatum: string;
    betalningsmottagareId: string;
    specifikationsnummer: number;
    franvaroTyp: string;
    franvaroProcentTFP?: number;
    franvaroTimmarTFP?: number;
    franvaroProcentFP?: number;
    franvaroTimmarFP?: number;
    franvaroBorttag?: boolean;
  }>;
}

export function generateAGIXML(agiData: AGIData): string {
  const timestamp = new Date().toISOString();

  // Generera frånvarouppgifter XML
  const franvaroXML = agiData.franvarouppgifter
    .map(
      (fu) => `
  <agd:Franvarouppgift>
    <agd:AgRegistreradId faltkod="201">${agiData.agRegistreradId}</agd:AgRegistreradId>
    <agd:RedovisningsPeriod faltkod="006">${agiData.redovisningsperiod}</agd:RedovisningsPeriod>
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
  const individuppgifterXML = agiData.individuppgifter
    .map(
      (iu) => `
  <agd:Blankett>
    <agd:Arendeinformation>
      <agd:Arendeagare>${agiData.agRegistreradId}</agd:Arendeagare>
      <agd:Period>${agiData.redovisningsperiod}</agd:Period>
    </agd:Arendeinformation>
    
    <agd:Blankettinnehall>
      <agd:IU>
        <agd:ArbetsgivareIUGROUP>
          <agd:AgRegistreradId faltkod="201">${agiData.agRegistreradId}</agd:AgRegistreradId>
        </agd:ArbetsgivareIUGROUP>
        
        <agd:BetalningsmottagareIUGROUP>
          <agd:BetalningsmottagareIDChoice>
            ${iu.betalningsmottagareId ? `<agd:BetalningsmottagarId faltkod="215">${iu.betalningsmottagareId}</agd:BetalningsmottagarId>` : ""}
            ${iu.fodelsetid ? `<agd:Fodelsetid faltkod="222">${iu.fodelsetid}</agd:Fodelsetid>` : ""}
            ${iu.annatId ? `<agd:AnnatId faltkod="224">${iu.annatId}</agd:AnnatId>` : ""}
          </agd:BetalningsmottagareIDChoice>
          ${iu.fornamn ? `<agd:Fornamn faltkod="216">${iu.fornamn}</agd:Fornamn>` : ""}
          ${iu.efternamn ? `<agd:Efternamn faltkod="217">${iu.efternamn}</agd:Efternamn>` : ""}
          ${iu.gatuadress ? `<agd:Gatuadress faltkod="218">${iu.gatuadress}</agd:Gatuadress>` : ""}
          ${iu.postnummer ? `<agd:Postnummer faltkod="219">${iu.postnummer}</agd:Postnummer>` : ""}
          ${iu.postort ? `<agd:Postort faltkod="220">${iu.postort}</agd:Postort>` : ""}
        </agd:BetalningsmottagareIUGROUP>

        <agd:ErsattningarIUGROUP>
          ${iu.kontantErsattningUlagAG ? `<agd:KontantErsattningUlagAG faltkod="011">${iu.kontantErsattningUlagAG}</agd:KontantErsattningUlagAG>` : ""}
          ${iu.kontantErsattningEjUlagSA ? `<agd:KontantErsattningEjUlagSA faltkod="012">${iu.kontantErsattningEjUlagSA}</agd:KontantErsattningEjUlagSA>` : ""}
          ${iu.skatteplBilformanUlagAG ? `<agd:SkatteplBilformanUlagAG faltkod="031">${iu.skatteplBilformanUlagAG}</agd:SkatteplBilformanUlagAG>` : ""}
          ${iu.skatteplOvrigaFormanerUlagAG ? `<agd:SkatteplOvrigaFormanerUlagAG faltkod="081">${iu.skatteplOvrigaFormanerUlagAG}</agd:SkatteplOvrigaFormanerUlagAG>` : ""}
          ${iu.avrakningAvgiftsfriErs ? `<agd:AvrakningAvgiftsfriErs faltkod="091">${iu.avrakningAvgiftsfriErs}</agd:AvrakningAvgiftsfriErs>` : ""}
        </agd:ErsattningarIUGROUP>

        <agd:SpecifikationsnummerIU faltkod="570">${iu.specifikationsnummer}</agd:SpecifikationsnummerIU>
      </agd:IU>
    </agd:Blankettinnehall>
  </agd:Blankett>`
    )
    .join("");

  // Fullständig XML-struktur
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<agd:ArbetsgivardeklarationDataFeed 
  xmlns:agd="http://www.skatteverket.se/xmlschemas/agd/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.skatteverket.se/xmlschemas/agd/1 arbetsgivardeklaration_v1.xsd"
  version="1.0">
  
  <agd:SkapadTidpunkt>${timestamp}</agd:SkapadTidpunkt>
  
  <agd:Organisationsnummer>${agiData.organisationsnummer}</agd:Organisationsnummer>
  
  <agd:TekniskKontakt>
    <agd:Namn>${agiData.tekniskKontakt.namn}</agd:Namn>
    <agd:Telefonnummer>${agiData.tekniskKontakt.telefon}</agd:Telefonnummer>
    <agd:EpostAdress>${agiData.tekniskKontakt.epost}</agd:EpostAdress>
  </agd:TekniskKontakt>

  <agd:Blanketter>
    ${individuppgifterXML}
  </agd:Blanketter>

  ${franvaroXML ? `<agd:Franvarouppgifter>${franvaroXML}</agd:Franvarouppgifter>` : ""}

</agd:ArbetsgivardeklarationDataFeed>`;

  return xml;
}

/**
 * Konverterar lönespec-data till AGI-format
 */
export function convertLonespecToAGI(
  valdaSpecar: any[],
  anstallda: any[],
  företagsdata: any,
  period: string
): AGIData {
  // Generera redovisningsperiod (YYYYMM format)
  const redovisningsperiod = period.replace("-", "");

  // Konvertera lönespecar till individuppgifter
  const individuppgifter = valdaSpecar.map((spec, index) => {
    const anställd = anstallda.find((a) => a.id === spec.anställd_id);

    return {
      specifikationsnummer: index + 1,
      betalningsmottagareId: anställd?.personnummer || anställd?.id?.toString(),
      fornamn: anställd?.förnamn || anställd?.namn?.split(" ")[0] || "",
      efternamn: anställd?.efternamn || anställd?.namn?.split(" ").slice(1).join(" ") || "",
      gatuadress: anställd?.adress || "",
      postnummer: anställd?.postnummer || "",
      postort: anställd?.postort || "",
      kontantErsattningUlagAG: parseFloat(spec.bruttolön || 0),
      kontantErsattningEjUlagSA: 0, // Kan anpassas baserat på data
      skatteplBilformanUlagAG: 0, // Kan anpassas baserat på förmåner
      skatteplOvrigaFormanerUlagAG: 0, // Kan anpassas baserat på förmåner
      avrakningAvgiftsfriErs: 0, // Kan anpassas baserat på data
    };
  });

  return {
    agRegistreradId: företagsdata?.organisationsnummer || "000000-0000",
    redovisningsperiod: redovisningsperiod,
    organisationsnummer: företagsdata?.organisationsnummer || "000000-0000",
    tekniskKontakt: {
      namn: företagsdata?.kontaktperson || "Teknisk kontakt",
      telefon: företagsdata?.telefonnummer || "000-000000",
      epost: företagsdata?.epost || "contact@company.se",
    },
    individuppgifter: individuppgifter,
    franvarouppgifter: [], // Tom för nu, kan utökas senare
  };
}

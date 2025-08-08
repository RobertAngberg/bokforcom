// HUS-fil generator för ROT/RUT-ansökningar till Skatteverket

interface HUSFilData {
  fakturanummer: string;
  kundPersonnummer: string;
  betalningsdatum: string;
  prisForArbete: number;
  betaltBelopp: number;
  begartBelopp: number;
  rotRutTyp: "ROT" | "RUT";
  rotRutKategori: string;
  fastighetsbeteckning?: string;
  lägenhetsNummer?: string;
  brfOrgNummer?: string;
  antalTimmar?: number; // Lägg till faktiska timmar
}

export function genereraHUSFil(data: HUSFilData): string {
  const idag = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const ärendeId = `${data.rotRutTyp}${idag}${data.fakturanummer.padStart(8, "0")}`;

  // ROT arbetstyper enligt Skatteverkets schema
  const rotArbetstyper = {
    "Bygg – reparera och underhålla": "Bygg",
    "Bygg – bygga om och bygga till": "Bygg",
    El: "El",
    "Glas och plåt": "GlasPlatarbete",
    "Gräv- och markarbete": "MarkDraneringarbete",
    "Murning och sotning": "Murning",
    "Målning och tapetsering": "MalningTapetsering",
    Rengöring: "MalningTapetsering", // Ingen specifik kategori för rengöring i ROT
    VVS: "Vvs",
  };

  // RUT arbetstyper enligt Skatteverkets schema
  const rutArbetstyper = {
    Städa: "Stadning",
    "Tvätta, laga och sy": "KladOchTextilvard",
    "Passa barn": "Barnpassning",
    "Ta hand om en person och ge omsorg": "Personligomsorg",
    "Flytta och packa": "Flyttjanster",
    "Fiber- och it-tjänster": "ItTjanster",
    "Reparera vitvaror": "ReparationAvVitvaror",
    "Skotta snö": "Snoskottning",
    "Trädgårdsarbete – fälla och beskära träd": "Tradgardsarbete",
    "Trädgårdsarbete – underhålla, klippa och gräva": "Tradgardsarbete",
    Möblering: "Moblering",
    Tillsyn: "TillsynAvBostad",
    "Transport till försäljning för återanvändning": "TransportTillForsaljning",
    "Tvätt vid tvättinrättning": "TvattVidTvattinrattning",
  };

  // Använd faktiska timmar från artikeldata, annars gissa baserat på pris
  const antalTimmar = data.antalTimmar || Math.max(1, Math.round(data.prisForArbete / 500));

  if (data.rotRutTyp === "ROT") {
    const valdRotArbetstyp =
      rotArbetstyper[data.rotRutKategori as keyof typeof rotArbetstyper] || "MalningTapetsering";

    // Skapa unika XML-element för ROT enligt Skatteverkets schema
    const rotXMLElementOrder = [
      "Bygg",
      "El",
      "GlasPlatarbete",
      "MarkDraneringarbete",
      "Murning",
      "MalningTapetsering",
      "Vvs",
    ];

    const xml = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<ns1:Begaran xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns1="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0" xmlns:ns2="http://xmls.skatteverket.se/se/skatteverket/ht/komponent/begaran/6.0">
  <ns2:NamnPaBegaran>${ärendeId}</ns2:NamnPaBegaran>
  <ns2:RotBegaran>
    <ns2:Arenden>
      <ns2:Kopare>${data.kundPersonnummer}</ns2:Kopare>
      <ns2:BetalningsDatum>${data.betalningsdatum}</ns2:BetalningsDatum>
      <ns2:PrisForArbete>${data.prisForArbete}</ns2:PrisForArbete>
      <ns2:BetaltBelopp>${data.betaltBelopp}</ns2:BetaltBelopp>
      <ns2:BegartBelopp>${data.begartBelopp}</ns2:BegartBelopp>
      <ns2:FakturaNr>${data.fakturanummer}</ns2:FakturaNr>
      <ns2:Ovrigkostnad>0</ns2:Ovrigkostnad>
      ${data.fastighetsbeteckning ? `<ns2:Fastighetsbeteckning>${data.fastighetsbeteckning}</ns2:Fastighetsbeteckning>` : ""}
      ${data.lägenhetsNummer ? `<ns2:LagenhetsNr>${data.lägenhetsNummer}</ns2:LagenhetsNr>` : '<ns2:LagenhetsNr xsi:nil="true" />'}
      ${data.brfOrgNummer ? `<ns2:BrfOrgNr>${data.brfOrgNummer}</ns2:BrfOrgNr>` : '<ns2:BrfOrgNr xsi:nil="true" />'}
      <ns2:UtfortArbete>
        ${rotXMLElementOrder
          .map((xmlTag) => {
            const ärVald = xmlTag === valdRotArbetstyp;
            return `<ns2:${xmlTag}>
          <ns2:AntalTimmar>${ärVald ? antalTimmar : 0}</ns2:AntalTimmar>
          <ns2:Materialkostnad>0</ns2:Materialkostnad>
        </ns2:${xmlTag}>`;
          })
          .join("\n        ")}
      </ns2:UtfortArbete>
    </ns2:Arenden>
  </ns2:RotBegaran>
</ns1:Begaran>`;

    return xml;
  } else {
    // RUT (HushallBegaran)
    const valdRutArbetstyp =
      rutArbetstyper[data.rotRutKategori as keyof typeof rutArbetstyper] || "Stadning";

    // Skapa unika XML-element för RUT enligt Skatteverkets schema
    const rutXMLElementOrder = [
      "Stadning",
      "KladOchTextilvard",
      "Snoskottning",
      "Tradgardsarbete",
      "Barnpassning",
      "Personligomsorg",
      "Flyttjanster",
      "ItTjanster",
      "ReparationAvVitvaror",
      "Moblering",
      "TillsynAvBostad",
      "TransportTillForsaljning",
      "TvattVidTvattinrattning",
    ];

    const xml = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<ns1:Begaran xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns1="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0" xmlns:ns2="http://xmls.skatteverket.se/se/skatteverket/ht/komponent/begaran/6.0">
  <ns2:NamnPaBegaran>${ärendeId}</ns2:NamnPaBegaran>
  <ns2:HushallBegaran>
    <ns2:Arenden>
      <ns2:Kopare>${data.kundPersonnummer}</ns2:Kopare>
      <ns2:BetalningsDatum>${data.betalningsdatum}</ns2:BetalningsDatum>
      <ns2:PrisForArbete>${data.prisForArbete}</ns2:PrisForArbete>
      <ns2:BetaltBelopp>${data.betaltBelopp}</ns2:BetaltBelopp>
      <ns2:BegartBelopp>${data.begartBelopp}</ns2:BegartBelopp>
      <ns2:FakturaNr>${data.fakturanummer}</ns2:FakturaNr>
      <ns2:Ovrigkostnad>0</ns2:Ovrigkostnad>
      <ns2:UtfortArbete>
        ${rutXMLElementOrder
          .map((xmlTag) => {
            const ärVald = xmlTag === valdRutArbetstyp;

            // Schablonarbeten (transport och tvätt vid tvättinrättning) har annan struktur
            if (xmlTag === "TransportTillForsaljning" || xmlTag === "TvattVidTvattinrattning") {
              return `<ns2:${xmlTag}>
          <ns2:Utfort>${ärVald}</ns2:Utfort>
        </ns2:${xmlTag}>`;
            } else {
              return `<ns2:${xmlTag}>
          <ns2:AntalTimmar>${ärVald ? antalTimmar : 0}</ns2:AntalTimmar>
          <ns2:Materialkostnad>0</ns2:Materialkostnad>
        </ns2:${xmlTag}>`;
            }
          })
          .join("\n        ")}
      </ns2:UtfortArbete>
    </ns2:Arenden>
  </ns2:HushallBegaran>
</ns1:Begaran>`;

    return xml;
  }
}

export function laddaNerHUSFil(data: HUSFilData) {
  const xml = genereraHUSFil(data);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.rotRutTyp}_faktura_${data.fakturanummer}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

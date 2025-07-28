"use client";

import AnimeradFlik from "../../_components/AnimeradFlik";

interface AGIKod {
  kod: string;
  titel: string;
  beskrivning: string;
  detaljer?: string;
}

const AGI_KODER_DATA = {
  identitet: [
    {
      kod: "215",
      titel: "Person-, samordnings- eller organisationsnummer",
      beskrivning:
        "Betalningsmottagarens rätta och fullständiga person-, samordnings- eller organisationsnummer med tio siffror.",
      detaljer:
        "Om betalningsmottagaren är 100 år eller äldre ska du skriva personnumret med tolv siffror i en följd, utan mellanslag.",
    },
    {
      kod: "570",
      titel: "Specifikationsnummer",
      beskrivning:
        "Specifikationsnummer som du bestämmer själv. Måste alltid fyllas i även om du bara lämnar en individuppgift per betalningsmottagare.",
      detaljer:
        "Får inte innehålla fler än 10 siffror. Använd inte noll (0). Det får inte finnas flera individuppgifter med samma specifikationsnummer för samma betalningsmottagare.",
    },
    {
      kod: "222",
      titel: "Födelsetid",
      beskrivning: "Födelsetid i formen ÅÅÅÅMMDDnnn om du saknar person- eller samordningsnummer.",
      detaljer:
        "Du ska skriva tre valfria siffror efter år, månad och dag. Flera personer födda samma dag ska ha olika tre siffror.",
    },
    {
      kod: "224",
      titel: "Annan identitet",
      beskrivning: "Valfritt nummer om du saknar både personnummer och födelsetid.",
      detaljer:
        "Får innehålla högst 50 tecken. Varje person ska ha ett unikt nummer. För juridiska personer kan du använda utländskt organisationsnummer.",
    },
  ],
  adressinfo: [
    {
      kod: "216",
      titel: "Förnamn",
      beskrivning: "Betalningsmottagarens förnamn om du inte har fullständigt personnummer.",
    },
    {
      kod: "217",
      titel: "Efternamn",
      beskrivning: "Betalningsmottagarens efternamn om du inte har fullständigt personnummer.",
    },
    {
      kod: "218",
      titel: "Gatuadress",
      beskrivning: "Gatuadress om du inte har betalningsmottagarens fullständiga personnummer.",
    },
    {
      kod: "228",
      titel: "Gatuadress 2",
      beskrivning: "Används vid behov av mer utrymme, till exempel för en c/o-adress.",
    },
    {
      kod: "230",
      titel: "Fri adress",
      beskrivning: "Utländska adresser som inte kan indelas i gatuadress, postnummer och postort.",
      detaljer: "Måste alltid kombineras med ruta 221 – Landskod postort.",
    },
    {
      kod: "219",
      titel: "Postnummer",
      beskrivning: "Postnummer om du inte har betalningsmottagarens fullständiga personnummer.",
    },
    {
      kod: "220",
      titel: "Postort",
      beskrivning: "Postort om du inte har betalningsmottagarens fullständiga personnummer.",
    },
    {
      kod: "221",
      titel: "Landskod postort",
      beskrivning:
        "Landskod för postorten. Används för utländska adresser och måste alltid användas med fri adress.",
      detaljer: "Landskod innehåller två bokstäver.",
    },
    {
      kod: "226",
      titel: "Organisationsnamn",
      beskrivning:
        "Företagets eller organisationens namn för utländska juridiska personer som saknar svenskt organisationsnummer.",
    },
  ],
  arbetsplats: [
    {
      kod: "060",
      titel: "Arbetsställenummer",
      beskrivning: "Arbetsställenummer om du bedriver verksamhet vid fler än ett arbetsställe.",
      detaljer:
        "Numret består av en till högst fem siffror och framgår av förteckningen från Statistikmyndigheten (SCB).",
    },
    {
      kod: "245",
      titel: "Arbetsplatsens adress",
      beskrivning:
        "Gatuadressen till arbetsplatsen där betalningsmottagaren haft sitt tjänsteställe under redovisningsperioden.",
      detaljer:
        "Om betalningsmottagaren haft flera tjänsteställen under perioden ska fältet lämnas tomt.",
    },
    {
      kod: "246",
      titel: "Arbetsplatsens ort",
      beskrivning: "Namnet på arbetsplatsens ort där betalningsmottagaren haft sitt tjänsteställe.",
      detaljer:
        "Ligger inte arbetsplatsen i en specifik ort ska du fylla i närmaste tätort eller kommunens namn.",
    },
  ],
  skatt: [
    {
      kod: "001",
      titel: "Avdragen preliminärskatt",
      beskrivning: "Avdragen preliminärskatt på lön, pension och annan ersättning.",
      detaljer:
        "Fyller du i noll (0) om du inte gjort skatteavdrag på grund av att ersättningen är under 1 000 kr per kalenderår eller andra specifika undantag.",
    },
    {
      kod: "274",
      titel: "Avdragen skatt, SINK",
      beskrivning:
        "Avdragen särskild inkomstskatt för utomlands bosatta om du fått beslut från Skatteverket.",
      detaljer: "SINK – särskild inkomstskatt för utomlands bosatta.",
    },
    {
      kod: "275",
      titel: "Avdragen skatt, A-SINK",
      beskrivning: "Avdragen särskild inkomstskatt för utomlands bosatta artister med flera.",
      detaljer: "Om du redovisat här ska du också fylla i ruta 112 – Verksamhetens art.",
    },
    {
      kod: "114",
      titel: "Skattebefriad enligt skatteavtal",
      beskrivning:
        "Kryss när du inte gjort skatteavdrag då skatteavtalet säger att beskattning inte ska ske i Sverige.",
    },
    {
      kod: "253",
      titel: "Lokalanställd",
      beskrivning:
        "Kryss om du är svensk arbetsgivare och betalat ersättning till anställd bosatt och arbetande i annat land.",
      detaljer:
        "En lokalanställd är en person som är bosatt och anställd i det land där din verksamhet ska bedrivas.",
    },
    {
      kod: "094",
      titel: "Anställd på utländsk beskickning",
      beskrivning:
        "Kryss om betalningsmottagaren är anställd på utländsk beskickning i Sverige och ska betala skatt i beskickningslandet.",
      detaljer:
        "Till exempel ambassadpersonal som inte ska betala skatt i Sverige utan i ambassadlandet.",
    },
    {
      kod: "276",
      titel: "Beslut ej skatteavdrag",
      beskrivning:
        "Kryss om du har beslut från Skatteverket att skatteavdrag inte ska göras på grund av utlandsarbete.",
      detaljer:
        "Till exempel då sexmånadsregeln är tillämplig eller om arbetet utförs för svensk arbetsgivare i annat nordiskt land.",
    },
  ],
  ersattningUnderlagArbetsgivaravgifter: [
    {
      kod: "011",
      titel: "Kontant bruttolön med mera",
      beskrivning:
        "Kontant ersättning för arbete som är underlag för arbetsgivaravgifter, till exempel bruttolön.",
      detaljer: "Du ska inte fylla i förmåner i denna ruta.",
    },
    {
      kod: "013",
      titel: "Skattepliktig bilförmån",
      beskrivning:
        "Värdet av bilförmånen (utom drivmedel) som är underlag för arbetsgivaravgifter.",
      detaljer: "När du värderar en bilförmån räknar du del av en månad som en hel månad.",
    },
    {
      kod: "018",
      titel: "Drivmedel vid bilförmån",
      beskrivning:
        "Förmån av fritt drivmedel vid bilförmån som är underlag för arbetsgivaravgifter.",
      detaljer: "Du beräknar förmånens värde genom att multiplicera marknadsvärdet med 1,2.",
    },
    {
      kod: "098",
      titel: "Betalt för drivmedel vid bilförmån",
      beskrivning:
        "Det belopp som betalningsmottagaren betalat för drivmedel vid bilförmån genom nettolöneavdrag.",
    },
    {
      kod: "012",
      titel: "Övriga skattepliktiga förmåner",
      beskrivning:
        "Sammanlagda värdet av andra förmåner än bilförmån och drivmedel som är underlag för arbetsgivaravgifter.",
      detaljer:
        "Till exempel fri kost, bostad, telefon, rot- och rutarbete, fria tidningar, fri parkering eller ränteförmån.",
    },
    {
      kod: "041",
      titel: "Bostadsförmån, småhus",
      beskrivning:
        "Kryss om betalningsmottagaren fått bostadsförmån för bostad i småhusfastighet (inte semesterbostad).",
      detaljer: "Värdet redovisas i ruta 012 – Övriga skattepliktiga förmåner.",
    },
    {
      kod: "043",
      titel: "Bostadsförmån, ej småhus",
      beskrivning:
        "Kryss om betalningsmottagaren fått bostadsförmån för bostad som inte finns i småhusfastighet.",
      detaljer: "Värdet redovisas i ruta 012 – Övriga skattepliktiga förmåner.",
    },
    {
      kod: "019",
      titel: "Avdrag för utgifter i arbetet",
      beskrivning:
        "Den del av bruttolönen som motsvarar ersättning för utgifter i arbetet enligt Skatteverkets beslut.",
      detaljer: "Beloppet ska ingå i ruta 011 – Kontant bruttolön med mera.",
    },
    {
      kod: "010",
      titel: "Avräkning från avgiftsfri ersättning",
      beskrivning:
        "Ersättning som du redovisat i tidigare redovisningsperioder och som nu är avgiftspliktig.",
    },
  ],
  vaxaStod: [
    {
      kod: "062",
      titel: "Växa-stöd – anställd före 1 maj 2024",
      beskrivning: "Kryss om du uppfyller reglerna för växa-stöd för anställd före 1 maj 2024.",
      detaljer:
        "Växa-stöd på ersättning upp till 25 000 kronor under anställningens första 24 kalendermånader enligt gamla reglerna.",
    },
    {
      kod: "063",
      titel: "Växa-stöd – anställd efter 30 april 2024",
      beskrivning: "Kryss om du uppfyller reglerna för växa-stöd för anställd efter 30 april 2024.",
      detaljer:
        "Från 1 januari 2025: bara ålderspensionsavgift (10,21%) på ersättning upp till 35 000 kronor per månad i högst 24 månader för max två anställningar.",
    },
  ],
  kostnadsersattningar: [
    {
      kod: "050",
      titel: "Bilersättning",
      beskrivning:
        "Kryss om du betalat ut ersättning för resor med privat bil inklusive förmånsbil där den anställda själv betalar drivmedel.",
      detaljer: "Högre bilersättning än schablonbeloppet ska redovisas som lön.",
    },
    {
      kod: "051",
      titel: "Traktamente",
      beskrivning: "Kryss om du betalat ut traktamentsersättning för resor i tjänsten.",
      detaljer: "Högre traktamentesersättning än schablonbeloppet ska redovisas som lön.",
    },
    {
      kod: "020",
      titel: "Övriga kostnadsersättningar",
      beskrivning: "Beloppet för andra kostnadsersättningar än bilersättning eller traktamente.",
    },
  ],
  ersattningEjSocialavgifter: [
    {
      kod: "131",
      titel: "Kontant ersättning",
      beskrivning: "Kontant ersättning för arbete som inte är underlag för socialavgifter.",
      detaljer:
        "Till exempel lön till anställd som tillhör annat lands socialförsäkring eller ersättning under 1 000 kronor per person och kalenderår.",
    },
    {
      kod: "133",
      titel: "Skattepliktig bilförmån",
      beskrivning:
        "Värdet av skattepliktig bilförmån (utom drivmedel) som inte är underlag för socialavgifter.",
    },
    {
      kod: "134",
      titel: "Drivmedel vid bilförmån",
      beskrivning:
        "Värdet av fritt drivmedel vid bilförmån för personer som inte omfattas av svensk socialförsäkring.",
      detaljer: "Beräknas genom att multiplicera marknadsvärdet med 1,2.",
    },
    {
      kod: "132",
      titel: "Övriga skattepliktiga förmåner",
      beskrivning:
        "Värdet av andra skattepliktiga förmåner än bilförmån som inte är underlag för socialavgifter.",
    },
    {
      kod: "137",
      titel: "Bostadsförmån, småhus",
      beskrivning:
        "Kryss om betalningsmottagaren fått bostadsförmån för bostad i småhusfastighet som inte är underlag för socialavgifter.",
      detaljer: "Värdet redovisas i ruta 132 – Övriga skattepliktiga förmåner.",
    },
    {
      kod: "138",
      titel: "Bostadsförmån, ej småhus",
      beskrivning:
        "Kryss om betalningsmottagaren fått bostadsförmån för bostad som inte finns i småhusfastighet och inte är underlag för socialavgifter.",
      detaljer: "Värdet redovisas i ruta 132 – Övriga skattepliktiga förmåner.",
    },
    {
      kod: "136",
      titel: "Förmån som pension",
      beskrivning:
        "Kryss om du har före detta anställd som gått i pension och får del av sin pension i form av förmån.",
    },
    {
      kod: "032",
      titel: "Ersättningar utan jobbskatteavdrag",
      beskrivning:
        "Skattepliktiga ersättningar som inte är underlag för socialavgifter och inte ger rätt till jobbskatteavdrag.",
      detaljer:
        "Vissa livräntor, ärvd royalty, utbetalningar från vinstandelsstiftelse och periodiskt understöd.",
    },
  ],
  utland: [
    {
      kod: "252",
      titel: "Utländskt skatteregistreringsnummer TIN",
      beskrivning:
        "Betalningsmottagarens utländska skatteregistreringsnummer (Tax Identification Number).",
      detaljer:
        "För obegränsat skattskyldiga bosatta i annat land och begränsat skattskyldiga i Sverige.",
    },
    {
      kod: "076",
      titel: "Landskod TIN",
      beskrivning: "Landskoden för det land som utfärdat det utländska skatteregistreringsnummer.",
      detaljer: "Landskod anges med två bokstäver.",
    },
    {
      kod: "305",
      titel: "Socialförsäkringskonvention med",
      beskrivning: "Om konvention om social trygghet ska tillämpas för betalningsmottagaren.",
      detaljer:
        "Gäller konventioner med Indien, USA, Kanada, Québec, Filippinerna, Sydkorea eller Japan.",
    },
    {
      kod: "091",
      titel: "Betalningsmottagaren utsänd under tid",
      beskrivning: "Markera A, B eller C för utsändningstiden enligt utsändningsavtal.",
      detaljer: "A: Kortare tid än 6 månader, B: 6–12 månader, C: Längre tid än 1 år.",
    },
    {
      kod: "077",
      titel: "Födelseort",
      beskrivning:
        "Den ort där betalningsmottagaren är född. Ska alltid fyllas i om du fyllt i födelsetid.",
    },
    {
      kod: "078",
      titel: "Landskod födelseort",
      beskrivning: "Landskoden för betalningsmottagarens födelseort.",
    },
    {
      kod: "081",
      titel: "Landskod medborgarskap ej svenskt",
      beskrivning:
        "Vilket medborgarskap betalningsmottagaren har om personen är begränsat skattskyldig i Sverige.",
    },
    {
      kod: "090",
      titel: "Landskod arbetsland",
      beskrivning:
        "Landskod på arbetslandet om betalningsmottagaren arbetat i annat land än Sverige.",
      detaljer:
        "Om arbete i flera länder under perioden ska en individuppgift lämnas för varje land.",
    },
    {
      kod: "303",
      titel: "Ej fast driftställe i Sverige",
      beskrivning:
        "Kryss som utländsk arbetsgivare om ersättningen inte belastar ditt fasta driftställe i Sverige.",
    },
  ],
  pension: [
    {
      kod: "030",
      titel: "Tjänstepension",
      beskrivning:
        "Tjänstepension som betalats ut till före detta anställda eller deras efterlevande.",
      detaljer:
        "Som tjänstepension räknas till exempel direktpension. Avgångsvederlag är inte pension utan räknas som lön.",
    },
  ],
  andra: [
    {
      kod: "035",
      titel: "Inte skattepliktiga ersättningar till utländska experter",
      beskrivning:
        "Skattefria förmåner och ersättningar till utländska experter enligt beslut från Forskarskattenämnden.",
    },
    {
      kod: "037",
      titel: "Vissa avdrag",
      beskrivning:
        "Belopp som den anställda betalar för speciella avgifter som får dras av i inkomstdeklarationen.",
      detaljer:
        "Till exempel avgifter för egen eller efterlevandes pension. Beloppet ska ingå i ruta 011.",
    },
    {
      kod: "036",
      titel: "Ersättning/förmån bostad och resa (SINK, A-SINK)",
      beskrivning:
        "Ersättningar och förmåner som inte är skattepliktiga för SINK/A-SINK beskattade.",
      detaljer: "Fri resa till/från Sverige, ersättning för logi vid tillfällig anställning, etc.",
    },
  ],
  sjo: [
    {
      kod: "026",
      titel: "Fartygssignal",
      beskrivning: "Fartygets fartygssignal i fyra tecken för sjöinkomst.",
      detaljer:
        "Internationell identitet på fartyget från Skatteverkets meddelande om fartygsklassificering.",
    },
    {
      kod: "027",
      titel: "Antal dagar med sjöinkomst",
      beskrivning: "Antal dagar med sjöinkomst i närfart eller fjärrfart.",
      detaljer:
        "Alla dagar som berättigar till ersättning från arbetsgivaren för anställning ombord på fartyg.",
    },
    {
      kod: "028",
      titel: "Närfart/Fjärrfart",
      beskrivning:
        "Om fartyget går i närfart eller fjärrfart enligt Skatteverkets meddelande om fartygsklassificering.",
    },
    {
      kod: "223",
      titel: "Fartygets namn",
      beskrivning:
        "Fartygets namn för att säkerställa rätt sjöinkomstavdrag. Kompletterar fartygssignal.",
    },
  ],
  rot: [
    {
      kod: "021",
      titel: "Underlag skattereduktion för rutarbete",
      beskrivning:
        "Underlag för skattereduktion för rutarbete, till exempel arbetskostnad för städning, trädgårdsarbete, flytt.",
    },
    {
      kod: "022",
      titel: "Underlag skattereduktion för rotarbete",
      beskrivning:
        "Underlag för skattereduktion för rotarbete, till exempel arbetskostnad för reparation, underhåll, om- och tillbyggnad.",
    },
  ],
  kapital: [
    {
      kod: "039",
      titel: "Hyresersättning",
      beskrivning:
        "Marknadsmässig hyresersättning som betalats till anställd som ska deklareras som inkomst av kapital.",
      detaljer: "Till exempel ersättning för hyra av garage eller lagerlokal i bostaden.",
    },
  ],
  verksamhet: [
    {
      kod: "112",
      titel: "Verksamhetens art (A-SINK)",
      beskrivning:
        "Vilken typ av verksamhet ersättningen avser för begränsat skattskyldiga enligt A-SINK-lagen.",
    },
  ],
  styrelse: [
    {
      kod: "023",
      titel: "Varav ersättning som är styrelsearvode",
      beskrivning: "Hur stort belopp av ersättningen eller förmånen som avser styrelsearvode.",
      detaljer: "Styrelsearvodet ska även ingå i beloppet för kontant ersättning eller förmån.",
    },
  ],
  andra2: [
    {
      kod: "048",
      titel: "Förmån har justerats",
      beskrivning:
        "Kryss om du fått beslut från Skatteverket om att förmånsvärdet ska justeras för betalningsmottagaren.",
    },
    {
      kod: "059",
      titel: "Personaloption",
      beskrivning:
        "Kryss om kvalificerad personaloption som inte ska förmånsbeskattas har utnyttjats för förvärv av andel.",
    },
  ],
  egenavgifter: [
    {
      kod: "125",
      titel: "Kontant ersättning",
      beskrivning: "Kontant ersättning som är underlag för egenavgifter.",
      detaljer:
        "Till exempel inkomst av tjänst för mottagare med F-skatt och ersättning under 10 000 kronor från privatperson.",
    },
    {
      kod: "127",
      titel: "Skattepliktig bilförmån",
      beskrivning:
        "Värdet av skattepliktig bilförmån (utom drivmedel) som är underlag för egenavgifter.",
    },
    {
      kod: "128",
      titel: "Drivmedel vid bilförmån",
      beskrivning: "Förmån av fritt drivmedel vid bilförmån som är underlag för egenavgifter.",
      detaljer: "Beräknas genom att multiplicera marknadsvärdet med 1,2.",
    },
    {
      kod: "126",
      titel: "Övriga skattepliktiga förmåner",
      beskrivning:
        "Sammanlagda värdet av andra skattepliktiga förmåner än bilförmån som är underlag för egenavgifter.",
    },
    {
      kod: "123",
      titel: "Bostadsförmån, småhus",
      beskrivning:
        "Kryss om anställd har bostadsförmån som är underlag för egenavgifter för bostad i småhusfastighet.",
      detaljer: "Förmånsvärdet redovisas i ruta 126 – Övriga skattepliktiga förmåner.",
    },
    {
      kod: "124",
      titel: "Bostadsförmån, ej småhus",
      beskrivning:
        "Kryss om anställd har bostadsförmån som är underlag för egenavgifter för bostad som inte finns i småhusfastighet.",
      detaljer: "Förmånsvärdet redovisas i ruta 126 – Övriga skattepliktiga förmåner.",
    },
  ],
};

export default function AGI_KodReferens() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">📋 AGI Kodreferens</h1>
        <p className="text-gray-300 text-lg">
          Fullständig referens för alla tresiffriga koder i Arbetsgivardeklarationen
        </p>
        <p className="text-gray-400 text-sm mt-2">Baserat på Skatteverkets officiella vägledning</p>
      </div>

      <div className="space-y-4">
        <AnimeradFlik title="Identitet och personnummer" icon="🆔">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                📋 Allmän information om identitet
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Person-, samordnings- eller organisationsnummer</strong> är den primära
                  identiteten för betalningsmottagare. Det är viktigt att du fyller i korrekta
                  uppgifter, eftersom uppgifterna på individnivå ligger till grund för det som
                  betalningsmottagaren får förifyllt i sin inkomstdeklaration.
                </p>
                <p>
                  <strong>Om du saknar fullständigt personnummer:</strong> Du kan använda födelsetid
                  eller annan identitet kombinerat med namn och adressuppgifter.
                </p>
                <p>
                  <strong>Personnummerbyte under perioden:</strong> Om en person med
                  samordningsnummer får ett personnummer eller byter personnummer under
                  redovisningsperioden ska redovisning ske enbart på det nya numret oavsett när
                  under perioden det nya personnumret tilldelats.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.identitet.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Adress och kontaktuppgifter" icon="🏠">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🏠 Adressuppgifter för betalningsmottagare
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>När ska adressuppgifter lämnas:</strong> Du ska fylla i namn och adress om
                  du inte har betalningsmottagarens fullständiga person-, samordnings- eller
                  organisationsnummer.
                </p>
                <p>
                  <strong>Utländska adresser:</strong> För utländska adresser som inte kan indelas i
                  gatuadress, postnummer och postort använder du "Fri adress" kombinerat med
                  landskod.
                </p>
                <p>
                  <strong>Anställda med utländsk adress:</strong> Om en anställd har en utländsk
                  adress i bosättningslandet ska du också fylla i uppgifter om den utländska
                  adressen och den anställdas namn.
                </p>
                <p>
                  <strong>Juridiska personer:</strong> För utländska juridiska personer som saknar
                  svenskt organisationsnummer ska du ange företagets eller organisationens namn.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.adressinfo.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Arbetsplats och tjänsteställe" icon="🏢">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🏢 Vad är tjänsteställe?
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Tjänsteställe:</strong> Du som arbetsgivare ska från och med
                  redovisningsperiod januari 2023 lämna uppgift om arbetsplatsens adress och ort om
                  den anställda bara haft ett tjänsteställe under redovisningsperioden.
                </p>
                <p>
                  <strong>Flera tjänsteställen:</strong> Om betalningsmottagaren haft flera
                  tjänsteställen hos er under redovisningsperioden ska fälten för arbetsplatsens
                  adress och ort lämnas tomma.
                </p>
                <p>
                  <strong>Arbetsställenummer:</strong> Du ska fylla i arbetsställenummer om du
                  bedriver verksamhet vid fler än ett arbetsställe. Numret framgår av förteckningen
                  från Statistikmyndigheten (SCB) och används för statistik om sysselsättning och
                  lönesummor.
                </p>
                <p>
                  <strong>Kontakt SCB:</strong> Bedriver du verksamhet vid fler än ett arbetsställe
                  och inte har någon förteckning över arbetsställen ska du kontakta
                  Statistikmyndigheten (SCB).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.arbetsplats.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Skatt och skatteavdrag" icon="💰">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                💰 Regler för skatteavdrag
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Obligatoriskt att fylla i:</strong> För att kunna skicka in en
                  arbetsgivardeklaration med individuppgifter måste du ha fyllt i en ruta för skatt
                  på respektive individuppgift, men du får inte fylla i fler än en ruta.
                </p>
                <p>
                  <strong>Om du inte gjort skatteavdrag:</strong> Om du inte har gjort något
                  skatteavdrag för utgiven ersättning måste du fylla i noll (0) i en av rutorna för
                  skatteavdrag, eller sätta ett kryss i någon av de rutor som förklarar varför
                  skatteavdrag inte ska göras.
                </p>
                <p>
                  <strong>Olika regler under samma period:</strong> Har du betalat ut ersättning
                  till en betalningsmottagare som omfattas av olika regler för skatteavdrag under en
                  och samma redovisningsperiod ska du lämna en individuppgift per skattefält.
                </p>
                <p>
                  <strong>Utländska arbetsgivare:</strong> Utländska arbetsgivare utan fast
                  driftsställe i Sverige är skyldiga att göra skatteavdrag på ersättning för arbete
                  som utförs i Sverige.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.skatt.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Ersättning underlag för arbetsgivaravgifter" icon="💼">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                💼 Ersättningar som är underlag för arbetsgivaravgifter
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Kontant ersättning:</strong> I kontant bruttolön fyller du i kontant
                  ersättning för arbete, till exempel bruttolön. Du ska inte fylla i förmåner i
                  denna ruta.
                </p>
                <p>
                  <strong>Förmåner - huvudregel:</strong> En förmån ska redovisas på den period som
                  förmånstagaren har kunnat förfoga över den. Om den anställda fått en förmån i
                  januari ska den redovisas på arbetsgivardeklarationen som avser januari.
                </p>
                <p>
                  <strong>Förskjuten redovisning:</strong> För vissa förmåner där du inte vet
                  förmånens värde vid löneutbetalning kan redovisning förskjutas en eller högst två
                  månader. Detta ska inte tillämpas generellt.
                </p>
                <p>
                  <strong>Nettolöneavdrag:</strong> Om den anställda har betalat för förmånen genom
                  nettolöneavdrag ska du minska förmånens värde med den anställdas betalning innan
                  du fyller i rutan.
                </p>
                <p>
                  <strong>Tillfällig skattefrihet:</strong> Från 1 juli 2023 till och med 30 juni
                  2026 gäller tillfällig skattefrihet för laddel på arbetsplatsen vid laddpunkt som
                  arbetsgivaren tillhandahåller.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.ersattningUnderlagArbetsgivaravgifter.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Växa-stöd" icon="🌱">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🌱 Utvidgat växa-stöd från 1 januari 2025
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Nya regler från 2025:</strong> Från och med 1 januari 2025 utvidgas
                  reglerna om växa-stöd till att som mest omfatta två anställningar som påbörjats
                  efter 30 april 2024. Med stödet betalar du som är ett växa-företag bara
                  ålderspensionsavgift (10,21 procent) på ersättning upp till 35 000 kronor per
                  kalendermånad.
                </p>
                <p>
                  <strong>Gamla regler för tidiga anställningar:</strong> Du som har anställt din
                  första anställda före 1 maj 2024, kan inte ta del av de nya utvidgade reglerna för
                  den personen. Du kan fortsätta få växa-stöd på ersättning upp till 25 000 kronor
                  under anställningens första 24 kalendermånader enligt de gamla reglerna.
                </p>
                <p>
                  <strong>Viktiga kriterier:</strong> Det är viktigt att du kontrollerar att
                  företaget har rätt till växa-stöd då det finns kriterier som både företaget och
                  anställningen måste uppfylla.
                </p>
                <p>
                  <strong>Stöd av mindre betydelse:</strong> Du som fått stöd av mindre betydelse
                  ska även fylla i ruta 462 - Mottagna stöd av mindre betydelse.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.vaxaStod.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Kostnadsersättningar" icon="🧾">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🧾 Vad är kostnadsersättning?
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Definition:</strong> Kostnadsersättning är en ersättning som ska täcka den
                  anställdes avdragsgilla kostnader i tjänsten.
                </p>
                <p>
                  <strong>Schablonbelopp:</strong> Har du betalat ut högre bilersättning eller
                  traktamentesersättning än schablonbeloppet ska du redovisa den överskjutande delen
                  som lön.
                </p>
                <p>
                  <strong>Vad som inte ska redovisas:</strong> Ersättning för utlägg som den
                  anställda gjort i samband med resor i tjänsten, för resa med allmänt
                  kommunikationsmedel, hyrbil eller taxi, trängselskatt i samband med tjänsteresa
                  med egen bil och logi, ska inte alls redovisas på individuppgiften.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.kostnadsersattningar.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Ersättning ej underlag för socialavgifter" icon="🚫">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🚫 Ersättning som inte är underlag för socialavgifter
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Vad som ingår:</strong> Här fyller du i ersättning som inte är underlag
                  för socialavgifter. Det kan till exempel handla om lön till anställd som tillhör
                  ett annat lands socialförsäkring, ersättning till en juridisk person som har
                  A-skatt, vissa ersättningar till idrottsutövare, samt ersättning under 1 000
                  kronor per person och kalenderår.
                </p>
                <p>
                  <strong>Förmåner som pension:</strong> Om du har före detta anställd som har gått
                  i pension och får en del av sin pension i form av en förmån ska du kryssa i ruta
                  136.
                </p>
                <p>
                  <strong>Jobbskatteavdrag:</strong> Vissa ersättningar ger inte rätt till
                  skattereduktion för arbetsinkomst (jobbskatteavdrag). Det är vissa livräntor, ärvd
                  royalty, utbetalningar från vinstandelsstiftelse och periodiskt understöd.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.ersattningEjSocialavgifter.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Ersättning underlag för egenavgifter" icon="👤">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                👤 Vad är egenavgifter?
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Definition:</strong> Ersättningar som är underlag för egenavgifter är till
                  exempel inkomst av tjänst för mottagare med F-skatt och ersättning under 10 000
                  kronor från privatperson.
                </p>
                <p>
                  <strong>Samma regler för förmåner:</strong> Samma huvudregler gäller för
                  redovisning av förmåner som för arbetsgivaravgifter - en förmån ska redovisas på
                  den period som förmånstagaren har kunnat förfoga över den.
                </p>
                <p>
                  <strong>Skattefrihet för laddel:</strong> Från 1 juli 2023 till och med 30 juni
                  2026 gäller en tillfällig skattefrihet för laddel på arbetsplatsen vid laddpunkt
                  som arbetsgivaren tillhandahåller.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.egenavgifter.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Utlandsuppgifter" icon="🌍">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🌍 Utlandsrelaterade uppgifter
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>TIN (Tax Identification Number):</strong> Du ska fylla i
                  betalningsmottagarens utländska skatteregistreringsnummer för någon som är
                  obegränsat skattskyldig i Sverige och bor i ett annat land, och för personer som
                  är begränsat skattskyldiga i Sverige.
                </p>
                <p>
                  <strong>Socialförsäkringskonventioner:</strong> Enligt konventioner om social
                  trygghet ska arbetsgivare i Sverige som sänder en anställd för arbete i vissa
                  länder i vissa fall inte betala alla arbetsgivaravgifter. Samma sak gäller för
                  utländska arbetsgivare som sänder anställda till Sverige.
                </p>
                <p>
                  <strong>Medborgarskap vid flera nationaliteter:</strong> Är ett av medborgarskapen
                  svenskt anges Sverige. Är inget av medborgarskapen svenskt men ett av dem är
                  Danmark, Finland, Island eller Norge anges detta. I övriga fall är det valfritt
                  vilket av medborgarskapen som anges.
                </p>
                <p>
                  <strong>Arbete i flera länder:</strong> Om betalningsmottagaren har arbetat i
                  flera olika länder under redovisningsperioden ska du lämna en individuppgift för
                  varje land med olika specifikationsnummer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.utland.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Pension" icon="👴">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                👴 Pensionsutbetalningar
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Vem ska redovisa:</strong> Du som är pensionärens tidigare arbetsgivare
                  ska redovisa pensionen på individnivå. Det beror på att du är utgivare av
                  pensionen och den som står för kostnaden för den. Du har även pensionsansvaret mot
                  pensionären.
                </p>
                <p>
                  <strong>Pensionsadministratör:</strong> Detta gäller även om du som arbetsgivare
                  har anlitat en pensionsadministratör som betalar ut pensionen åt dig.
                </p>
                <p>
                  <strong>Undantag för pensionsförsäkring:</strong> När pension betalas ut på grund
                  av en pensionsförsäkring är det försäkringsgivaren som ska redovisa
                  pensionsutbetalningen i sin arbetsgivardeklaration.
                </p>
                <p>
                  <strong>Avgångsvederlag:</strong> Observera att avgångsvederlag inte är pension
                  utan räknas som lön och ska redovisas i ruta 011 – Kontant bruttolön med mera.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.pension.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Sjöuppgifter" icon="⚓">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                ⚓ När ska sjöuppgifter lämnas?
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Tillämpning:</strong> Du fyller i rutorna om sjöuppgifter om du har
                  betalat ut ersättning till en sjöman för arbete ombord på ett svenskt fartyg som
                  Skatteverket klassificerat till närfart eller fjärrfart, eller ett handelsfartyg
                  registrerat i en annan EES-stat.
                </p>
                <p>
                  <strong>Skattelättnader:</strong> Sjöinkomst ger rätt till skattelättnaderna
                  sjöinkomstavdrag och skattereduktion för sjöinkomst. Du måste fylla i samtliga
                  rutor om sjöuppgifter.
                </p>
                <p>
                  <strong>Fartygssignal:</strong> Fartygssignalen är en internationell identitet på
                  fartyget som du hittar i meddelandet om fartygsklassificering som Skatteverket
                  utfärdar i början av varje år.
                </p>
                <p>
                  <strong>Dagar med sjöinkomst:</strong> Alla dagar som berättigar till någon form
                  av ersättning från arbetsgivaren för anställning ombord på fartyg räknas in i
                  antal dagar med sjöinkomst.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.sjo.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="ROT och RUT-arbete" icon="🔨">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🔨 Skattereduktion för rot- och rutarbete
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>När ska det redovisas:</strong> Om du har en anställd som haft förmån av
                  rot- eller rutarbete, och det finns förutsättningar för skattereduktion, ska du
                  som arbetsgivare redovisa underlaget för skattereduktionen.
                </p>
                <p>
                  <strong>Viktigt om underlaget:</strong> Underlaget för skattereduktion motsvarar
                  inte alltid värdet av förmånen. I underlaget får du bara ta med kostnader för
                  arbete. Du får inte ta med kostnader för material, utrustning och resor.
                </p>
                <p>
                  <strong>Nettolöneavdrag:</strong> Om den anställda har betalat hela eller del av
                  förmånens värde med sin nettolön ska du dra av detta belopp när du beräknar
                  förmånens värde. När du anger underlaget för skattereduktion ska du däremot alltid
                  ange värdet utan avdrag.
                </p>
                <p>
                  <strong>Rutarbete:</strong> Arbetskostnad för städning, trädgårdsarbete, flytt med
                  mera.
                </p>
                <p>
                  <strong>Rotarbete:</strong> Arbetskostnad för reparation, underhåll, om- och
                  tillbyggnad.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.rot.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Kapital" icon="🏦">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🏦 Inkomst av kapital
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Vad som ska redovisas:</strong> Hyresersättning är den enda inkomst av
                  kapital som du ska redovisa på individnivå i arbetsgivardeklarationen.
                </p>
                <p>
                  <strong>Skatteavdrag från utdelning och ränta:</strong> De skatteavdrag från
                  utdelning och inkomstränta som du har gjort redovisar du i klumpsumma på
                  arbetsgivarnivå och i kontrolluppgift för den anställda.
                </p>
                <p>
                  <strong>Marknadsmässig hyra:</strong> Du ska redovisa den marknadsmässiga
                  hyresersättning som du har betalat till den anställda. Om hyresersättningen är
                  högre än marknadsmässigt ska du redovisa den marknadsmässiga delen här och den
                  överskjutande delen som lön.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.kapital.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Verksamhet" icon="🏭">
          <div className="space-y-4">
            {AGI_KODER_DATA.verksamhet.map((kod) => (
              <KodKort key={kod.kod} kod={kod} />
            ))}
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Styrelsearvode" icon="👔">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                👔 Styrelsearvode och förmåner
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>Ny regel från 2024:</strong> Från och med redovisningsperioden januari
                  2024 ska det styrelsearvode som du redovisar som kontant ersättning och/eller
                  förmån även redovisas separat.
                </p>
                <p>
                  <strong>Dubbel redovisning:</strong> Styrelsearvodet ska även ingå i beloppet du
                  redovisar som kontant ersättning eller förmån i de ordinarie rutorna.
                </p>
                <p>
                  <strong>Exempel:</strong> Du betalar ut kontant ersättning med 2 500 kronor. 500
                  kronor avser styrelsearvode och 2 000 kronor avser annat arbete. Du redovisar 2
                  500 kr i ruta 011 och 500 kr i ruta 023.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGI_KODER_DATA.styrelse.map((kod) => (
                <KodKort key={kod.kod} kod={kod} />
              ))}
            </div>
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="Övriga uppgifter" icon="📝">
          <div className="space-y-4">
            {AGI_KODER_DATA.andra.concat(AGI_KODER_DATA.andra2).map((kod) => (
              <KodKort key={kod.kod} kod={kod} />
            ))}
          </div>
        </AnimeradFlik>

        <AnimeradFlik title="📚 Allmän vägledning för arbetsgivardeklaration" icon="📚">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  ⏰ Viktiga frister
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Månatlig inlämning:</strong> Arbetsgivardeklaration ska lämnas senast
                    den 12:e varje månad för föregående månads löner.
                  </p>
                  <p>
                    <strong>Deklarera noll:</strong> Du som inte har något att deklarera för en
                    redovisningsperiod ska ändå lämna en arbetsgivardeklaration så länge du är
                    registrerad som arbetsgivare.
                  </p>
                  <p>
                    <strong>Frånvarouppgifter:</strong> Från januari 2025 ska du lämna uppgifter om
                    anställdas frånvaro som kan ge rätt till tillfällig föräldrapenning eller
                    föräldrapenning.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  👥 Betalningsmottagare
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Lägga till betalningsmottagare:</strong> Du kan lägga till
                    betalningsmottagare via personnummer/organisationsnummer, födelsetid eller annan
                    identitet.
                  </p>
                  <p>
                    <strong>Mallar:</strong> När du lägger till en betalningsmottagare kan du välja
                    en mall med förvalda rutor, till exempel "Ersättning som är underlag för
                    arbetsgivaravgifter".
                  </p>
                  <p>
                    <strong>Kopiera från tidigare period:</strong> Du kan kopiera en
                    betalningsmottagare från en tidigare period.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  💼 Ersättningar och avgifter
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Arbetsgivaravgifter:</strong> Betalas på ersättningar som är underlag
                    för arbetsgivaravgifter. Standardsats är 31,42% (2025).
                  </p>
                  <p>
                    <strong>Egenavgifter:</strong> Betalas av mottagaren själv, till exempel för
                    F-skattsedlar.
                  </p>
                  <p>
                    <strong>Särskild löneskatt (SLF):</strong> 24,26% på vissa pensionsutbetalningar
                    och andra förmåner.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  📋 Kontrolluppgifter
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Automatisk generering:</strong> Kontrolluppgifter genereras automatiskt
                    baserat på individuppgifterna i arbetsgivardeklarationen.
                  </p>
                  <p>
                    <strong>Till mottagaren:</strong> Uppgifterna skickas till betalningsmottagaren
                    och används för förifyllning av inkomstdeklarationen.
                  </p>
                  <p>
                    <strong>Rättelse:</strong> Du kan rätta en arbetsgivardeklaration som redan
                    skickats in om du upptäcker fel.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  🔍 Vanliga misstag att undvika
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Fel personnummer:</strong> Kontrollera att personnummer är korrekt - det
                    påverkar betalningsmottagarens inkomstdeklaration.
                  </p>
                  <p>
                    <strong>Dubbel redovisning:</strong> Samma ersättning ska inte redovisas i flera
                    rutor för samma betalningsmottagare.
                  </p>
                  <p>
                    <strong>Förmåner utan nettolöneavdrag:</strong> Glöm inte att dra av vad den
                    anställde betalat genom nettolöneavdrag.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  📞 Support och hjälp
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong>Skatteverket:</strong> 0771-567 567 för frågor om
                    arbetsgivardeklaration.
                  </p>
                  <p>
                    <strong>E-tjänster:</strong> Använd "Lämna arbetsgivardeklaration" på Mina sidor
                    för att lämna deklarationen.
                  </p>
                  <p>
                    <strong>Bilförmånsberäkning:</strong> Använd Skatteverkets e-tjänst för att
                    beräkna bilförmånsvärden.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4 mt-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🏛️ Teknisk beskrivning och XML-format
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>
                  <strong>XML-struktur:</strong> Arbetsgivardeklarationen kan även lämnas i
                  XML-format för större organisationer som har egna system.
                </p>
                <p>
                  <strong>Testtjänst:</strong> Skatteverket erbjuder en testtjänst för att validera
                  XML-filer innan de skickas in.
                </p>
                <p>
                  <strong>Fältkoder:</strong> Alla fält i deklarationen har tresiffriga koder som
                  används i XML-formatet.
                </p>
                <p>
                  <strong>Validering:</strong> XML-filer valideras mot Skatteverkets schema för att
                  säkerställa korrekt format.
                </p>
              </div>
            </div>
          </div>
        </AnimeradFlik>
      </div>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">💡 Information</h3>
        <p className="text-gray-300 text-sm">
          Denna referens baseras på Skatteverkets officiella vägledning för arbetsgivardeklaration
          på individnivå. För den senaste informationen, kontrollera alltid{" "}
          <a
            href="https://skatteverket.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            skatteverket.se
          </a>
        </p>
      </div>
    </div>
  );
}

function KodKort({ kod }: { kod: AGIKod }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
      <div className="flex items-start gap-3">
        <div className="bg-cyan-600 text-white text-sm font-bold px-3 py-1 rounded-md min-w-[50px] text-center">
          {kod.kod}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-2">{kod.titel}</h4>
          <p className="text-gray-300 text-sm mb-2">{kod.beskrivning}</p>
          {kod.detaljer && (
            <div className="bg-slate-900 rounded p-3 mt-2">
              <p className="text-gray-400 text-xs font-medium mb-1">DETALJER:</p>
              <p className="text-gray-300 text-sm">{kod.detaljer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

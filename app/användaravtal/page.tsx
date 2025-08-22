import MainLayout from "../_components/MainLayout";

export default function AnvändaravtalPage() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 text-white">
        <h1 className="text-3xl font-bold text-center mb-8">📋 Användaravtal</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Definitioner och tillämpningsområde
            </h2>
            <p className="mb-3">
              Detta användaravtal ("Avtalet") utgör en juridiskt bindande överenskommelse mellan dig
              som användare ("Kund", "Du", "Användare") och Bokför.com ("Vi", "Tjänsteleverantör",
              "Bolaget") avseende användning av den webbaserade bokföringstjänsten Bokför.com
              ("Tjänsten", "Plattformen").
            </p>
            <p className="mb-3">
              <strong>Definitioner:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Konto:</strong> Användarens personliga tillgång till Tjänsten
              </li>
              <li>
                <strong>Innehåll:</strong> All data, information, dokument och material som
                Användaren lagrar i Tjänsten
              </li>
              <li>
                <strong>Bokföringsdata:</strong> All ekonomisk information, transaktioner, rapporter
                och relaterad data
              </li>
              <li>
                <strong>Tredje part:</strong> Externa leverantörer, partners eller andra aktörer
              </li>
              <li>
                <strong>Personuppgifter:</strong> All information som kan identifiera en fysisk
                person enligt GDPR
              </li>
            </ul>
            <p className="mt-3">
              Genom att registrera ett konto, ladda ner, installera, komma åt eller på annat sätt
              använda Tjänsten bekräftar Du att Du har läst, förstått och godkänner att vara bunden
              av detta Avtal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Behörighet och registrering
            </h2>
            <p className="mb-3">För att använda Tjänsten måste Du:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vara minst 18 år gammal eller ha vårdnadshavares samtycke</li>
              <li>Ha rättslig behörighet att ingå bindande avtal</li>
              <li>Vara registrerad som företagare eller företag i Sverige</li>
              <li>Ange korrekta, fullständiga och aktuella registreringsuppgifter</li>
              <li>Acceptera att endast skapa ett (1) konto per juridisk enhet</li>
            </ul>
            <p className="mt-3">
              Du förbinder dig att omedelbart uppdatera registreringsuppgifterna om de ändras. Vi
              förbehåller oss rätten att avsluta konton med felaktiga eller vilseledande uppgifter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. Tjänstebeskrivning och funktionalitet
            </h2>
            <p className="mb-3">
              Bokför.com är en Software-as-a-Service (SaaS) lösning som tillhandahåller:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Webbaserad bokföring enligt svensk redovisningsstandard (K-regelverket)</li>
              <li>Transaktionsregistrering och kontoplanshantering</li>
              <li>Fakturahantering för kund- och leverantörsfakturor</li>
              <li>Personaladministration och lönehantering</li>
              <li>Rapportgenerering (resultaträkning, balansräkning, huvudbok)</li>
              <li>Momsrapportering och periodisk sammanställning</li>
              <li>SIE-export för revisor och Skatteverket</li>
              <li>Bokslut och årsbokslut</li>
              <li>Säkerhetskopiering och datalagring</li>
            </ul>
            <p className="mt-3">
              Tjänsten är utformad för att underlätta redovisningsprocesser men ersätter inte
              professionell redovisningskompetens eller juridisk rådgivning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Användaråtaganden och förbjuden användning
            </h2>
            <p className="mb-3">Du åtar dig att:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Använda Tjänsten i enlighet med gällande lag och förordningar</li>
              <li>Säkerställa riktigheten och fullständigheten av all inmatad data</li>
              <li>Hålla inloggningsuppgifter konfidentiella och säkra</li>
              <li>Omedelbart rapportera misstänkt obehörig användning</li>
              <li>Inte kringgå eller försöka kringgå säkerhetsåtgärder</li>
              <li>Inte använda automatiserade system utan skriftligt tillstånd</li>
              <li>Respektera tredje parts immateriella rättigheter</li>
            </ul>
            <p className="mb-3 mt-4">
              <strong>Förbjuden användning inkluderar men är inte begränsat till:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Överföring av skadlig kod, virus eller malware</li>
              <li>Försök att få obehörig åtkomst till andra användares data</li>
              <li>Reverse engineering eller dekompilering av Tjänsten</li>
              <li>Användning för bedrägliga eller olagliga aktiviteter</li>
              <li>Överbelastning av servrar eller infrastruktur</li>
              <li>Vidareförsäljning eller uthyrning av Tjänsten utan tillstånd</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Abonnemang, prissättning och betalningsvillkor
            </h2>
            <p className="mb-3">
              <strong>5.1 Abonnemangstyper:</strong> Tjänsten erbjuds via månads- eller
              årsabonnemang enligt aktuell prislista på webbplatsen.
            </p>
            <p className="mb-3">
              <strong>5.2 Betalning:</strong> Alla avgifter ska betalas i förskott via godkända
              betalningsmetoder. Automatisk förnyelse sker om inte uppsägning gjorts enligt punkt 8.
            </p>
            <p className="mb-3">
              <strong>5.3 Prisändringar:</strong> Vi förbehåller oss rätten att ändra priser med 30
              dagars skriftligt meddelande. Prisändringar träder i kraft vid nästa förnyelseperiod.
            </p>
            <p className="mb-3">
              <strong>5.4 Utebliven betalning:</strong> Vid utebliven betalning kan kontot
              suspenderas efter 7 dagars varsel. Dröjsmålsränta enligt räntelagen kan tillkomma.
            </p>
            <p className="mb-3">
              <strong>5.5 Återbetalning:</strong> Förbetald avgift återbetalas inte vid frivillig
              uppsägning. Vid väsentligt avtalsbrott från vår sida proportionell återbetalning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Immaterialrätt och ägandeförhållanden
            </h2>
            <p className="mb-3">
              <strong>6.1 Vår äganderätt:</strong> All programvara, kod, design, text, grafik och
              annat material som utgör Tjänsten ägs av oss eller våra licensgivare och skyddas av
              upphovsrätt, varumärkesrätt och andra immaterialrättsliga lagar.
            </p>
            <p className="mb-3">
              <strong>6.2 Licens till Dig:</strong> Vi beviljar Dig en begränsad, icke-exklusiv,
              icke-överlåtbar licens att använda Tjänsten enligt detta Avtal under
              abonnemangsperioden.
            </p>
            <p className="mb-3">
              <strong>6.3 Ditt innehåll:</strong> Du behåller äganderätten till all bokföringsdata
              och annat innehåll Du överför till Tjänsten. Du beviljar oss nödvändiga rättigheter
              att lagra, bearbeta och presentera detta innehåll för att tillhandahålla Tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Behandling av personuppgifter (GDPR)
            </h2>
            <p className="mb-3">
              <strong>7.1 Personuppgiftsansvar:</strong> Vi är personuppgiftsansvarig för behandling
              av Dina kontaktuppgifter. För bokföringsdata där personuppgifter förekommer är Du
              personuppgiftsansvarig och vi är personuppgiftsbiträde.
            </p>
            <p className="mb-3">
              <strong>7.2 Rättslig grund:</strong> Behandling sker med stöd av:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fullgörande av avtal (artikel 6.1(b) GDPR)</li>
              <li>Berättigat intresse för tjänsteutveckling (artikel 6.1(f) GDPR)</li>
              <li>Rättslig förpliktelse avseende bokföringslagen (artikel 6.1(c) GDPR)</li>
            </ul>
            <p className="mb-3">
              <strong>7.3 Dina rättigheter:</strong> Du har rätt till tillgång, rättelse, radering,
              begränsning, dataportabilitet och invändning enligt GDPR artiklar 15-21.
            </p>
            <p className="mb-3">
              <strong>7.4 Dataöverföring:</strong> Personuppgifter lagras inom EU/EES. Överföring
              till tredje land sker endast med adekvata skyddsåtgärder.
            </p>
            <p className="mb-3">
              <strong>7.5 Lagringsperiod:</strong> Personuppgifter lagras under abonnemangsperioden
              plus 90 dagar. Bokföringsdata lagras enligt bokföringslagen (7 år).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Uppsägning och avtalets upphörande
            </h2>
            <p className="mb-3">
              <strong>8.1 Uppsägning av Kund:</strong> Du kan säga upp abonnemanget när som helst
              med omedelbar verkan via kontoinställningar. Uppsägning gäller från nästa
              faktureringsperiod.
            </p>
            <p className="mb-3">
              <strong>8.2 Uppsägning av oss:</strong> Vi kan säga upp Avtalet med 30 dagars
              skriftligt varsel eller omedelbart vid:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Väsentligt avtalsbrott som inte rättas inom 14 dagar efter påpekande</li>
              <li>Utebliven betalning längre än 30 dagar</li>
              <li>Misstanke om bedrägeri eller olaglig aktivitet</li>
              <li>Teknisk omöjlighet att fortsätta leverera Tjänsten</li>
            </ul>
            <p className="mb-3">
              <strong>8.3 Konsekvenser vid upphörande:</strong> Vid avtalets upphörande upphör Din
              rätt att använda Tjänsten. Du ansvarar för att exportera viktig data innan kontot
              stängs. Vi raderar all data 90 dagar efter upphörande, såvida inte lagstiftning kräver
              längre lagring.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Ansvarsbegränsning och garantier
            </h2>
            <p className="mb-3">
              <strong>9.1 Ingen garanti:</strong> Tjänsten tillhandahålls "i befintligt skick" utan
              garantier av något slag. Vi garanterar inte att Tjänsten är felfri, säker eller
              tillgänglig utan avbrott.
            </p>
            <p className="mb-3">
              <strong>9.2 Ansvarsbegränsning:</strong> Vårt sammanlagda ansvar begränsas till det
              belopp Du betalat för Tjänsten under de senaste 12 månaderna, dock högst 50 000 SEK.
            </p>
            <p className="mb-3">
              <strong>9.3 Uteslutna skador:</strong> Vi ansvarar inte för:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Indirekta skador, utebliven vinst eller följdskador</li>
              <li>Förlust av data som inte beror på vårt uppsåt eller grov vårdslöshet</li>
              <li>Skador orsakade av tredje part eller force majeure</li>
              <li>Skattekonsekvenser eller redovisningsfel</li>
              <li>Beslut baserade på rapporter från Tjänsten</li>
            </ul>
            <p className="mb-3">
              <strong>9.4 Ditt ansvar:</strong> Du ansvarar för att granska och validera all output
              från Tjänsten. Vi rekommenderar starkt att Du använder kvalificerad
              redovisningskompetens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Force majeure</h2>
            <p>
              Vi ansvarar inte för dröjsmål eller underlåtenhet att fullgöra våra förpliktelser på
              grund av omständigheter utanför vår rimliga kontroll, inklusive men inte begränsat
              till naturkatastrofer, krig, terrorism, cyberattacker, myndighetsbeslut, strejker,
              leverantörsavbrott eller tekniska fel hos tredje part.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Ändringar av avtalet</h2>
            <p className="mb-3">Vi kan ändra detta Avtal genom att:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Skicka meddelande till Din registrerade e-postadress minst 30 dagar i förväg</li>
              <li>Publicera ändringar på vår webbplats med tydlig datum för ikraftträdande</li>
              <li>Visa meddelande i Tjänsten vid nästa inloggning</li>
            </ul>
            <p className="mt-3">
              Fortsatt användning efter ikraftträdandet innebär godkännande av ändringarna. Om Du
              inte godkänner ändringarna kan Du säga upp Avtalet innan de träder i kraft.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              12. Tvistelösning och tillämplig lag
            </h2>
            <p className="mb-3">
              <strong>12.1 Tillämplig lag:</strong> Detta Avtal regleras av svensk lag utan
              tillämpning av dess konfliktlagar.
            </p>
            <p className="mb-3">
              <strong>12.2 Domstol:</strong> Tvist rörande detta Avtal ska avgöras av svensk allmän
              domstol, med Stockholms tingsrätt som första instans.
            </p>
            <p className="mb-3">
              <strong>12.3 Medling:</strong> Parterna åtar sig att först försöka lösa tvister genom
              direkta förhandlingar. Om detta misslyckas kan medling genom Stockholms Handelskammare
              övervägas innan domstolsprocess inleds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Övrigt</h2>
            <p className="mb-3">
              <strong>13.1 Fullständighet:</strong> Detta Avtal utgör den fullständiga
              överenskommelsen mellan parterna och ersätter alla tidigare avtal eller utfästelser.
            </p>
            <p className="mb-3">
              <strong>13.2 Severabilitet:</strong> Om någon bestämmelse i detta Avtal är ogiltig
              eller omöjlig att verkställa, påverkar detta inte giltigheten av övriga bestämmelser.
            </p>
            <p className="mb-3">
              <strong>13.3 Överlåtelse:</strong> Du får inte överlåta Dina rättigheter eller
              skyldigheter enligt detta Avtal utan vårt skriftliga samtycke. Vi kan överlåta Avtalet
              till koncernbolag eller vid verksamhetsöverlåtelse.
            </p>
            <p className="mb-3">
              <strong>13.4 Språk:</strong> Vid skillnader mellan språkversioner gäller den svenska
              versionen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Kontaktinformation</h2>
            <p className="mb-3">
              <strong>Bokför.com</strong>
              <br />
              Organisationsnummer: [Ska fyllas i]
              <br />
              Adress: [Ska fyllas i]
              <br />
              E-post: legal@bokför.com
              <br />
              Kundtjänst: support@bokför.com
            </p>
            <p className="mb-3">
              <strong>Dataskyddsombud:</strong> privacy@bokför.com
            </p>
            <p>
              <strong>Klagomål avseende personuppgiftsbehandling</strong> kan riktas till
              Integritetsskyddsmyndigheten (IMY).
            </p>
          </section>

          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-semibold text-red-400 mb-3">⚠️ Viktigt att notera</h3>
            <p className="text-red-200">
              Detta användaravtal är juridiskt bindande. Läs det noggrant innan Du börjar använda
              tjänsten. Vi rekommenderar att Du sparar en kopia för Dina arkiv. Vid frågor om
              avtalet, kontakta vår juridiska avdelning.
            </p>
          </div>

          <div className="text-center pt-8 border-t border-gray-700">
            <p className="text-gray-400">
              <strong>Version:</strong> 2.1
              <br />
              <strong>Senast uppdaterat:</strong> 22 augusti 2025
              <br />
              <strong>Ikraftträder:</strong> Vid registrering eller fortsatt användning efter detta
              datum
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

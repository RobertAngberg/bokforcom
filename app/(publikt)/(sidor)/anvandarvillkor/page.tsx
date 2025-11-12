import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Användarvillkor - BokförCom",
  description: "Användarvillkor och avtalsvillkor för BokförCom",
};

export default function AnvandarvillkorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Användaravtal</h1>

          <div className="space-y-6 text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                1. Definitioner och tillämpningsområde
              </h3>
              <p className="mb-3">
                Detta användaravtal (&ldquo;Avtalet&rdquo;) utgör en juridiskt bindande
                överenskommelse mellan dig som användare (&ldquo;Kund&rdquo;, &ldquo;Du&rdquo;,
                &ldquo;Användare&rdquo;) och BokförCom (&ldquo;Vi&rdquo;,
                &ldquo;Tjänsteleverantör&rdquo;, &ldquo;Bolaget&rdquo;) avseende användning av den
                webbaserade bokföringstjänsten BokförCom.
              </p>
              <p className="mb-2">
                <strong>Definitioner:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>
                  <strong>Konto:</strong> Användarens personliga tillgång till Tjänsten
                </li>
                <li>
                  <strong>Innehåll:</strong> All data, information, dokument och material som
                  Användaren lagrar i Tjänsten
                </li>
                <li>
                  <strong>Bokföringsdata:</strong> All ekonomisk information, transaktioner,
                  rapporter och relaterad data
                </li>
                <li>
                  <strong>Personuppgifter:</strong> All information som kan identifiera en fysisk
                  person enligt GDPR
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                2. Behörighet och registrering
              </h3>
              <p className="mb-2">För att använda Tjänsten måste Du:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Vara minst 18 år gammal eller ha vårdnadshavares samtycke</li>
                <li>Ha rättslig behörighet att ingå bindande avtal</li>
                <li>Vara registrerad som företagare eller företag i Sverige</li>
                <li>Ange korrekta, fullständiga och aktuella registreringsuppgifter</li>
                <li>Acceptera att endast skapa ett (1) konto per juridisk enhet</li>
              </ul>
              <p className="mt-3 text-sm">
                Du förbinder dig att omedelbart uppdatera registreringsuppgifterna om de ändras. Vi
                förbehåller oss rätten att avsluta konton med felaktiga eller vilseledande
                uppgifter.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                3. Tjänstebeskrivning och funktionalitet
              </h3>
              <p className="mb-2">
                BokförCom är en Software-as-a-Service (SaaS) lösning som tillhandahåller:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
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
              <p className="mt-3 text-sm">
                Tjänsten är utformad för att underlätta redovisningsprocesser men ersätter inte
                professionell redovisningskompetens eller juridisk rådgivning.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                4. Användaråtaganden och förbjuden användning
              </h3>
              <p className="mb-2">Du åtar dig att:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Använda Tjänsten i enlighet med gällande lag och förordningar</li>
                <li>Säkerställa riktigheten och fullständigheten av all inmatad data</li>
                <li>Hålla inloggningsuppgifter konfidentiella och säkra</li>
                <li>Omedelbart rapportera misstänkt obehörig användning</li>
                <li>Inte kringgå eller försöka kringgå säkerhetsåtgärder</li>
                <li>Inte använda automatiserade system utan skriftligt tillstånd</li>
                <li>Respektera tredje parts immateriella rättigheter</li>
              </ul>
              <p className="mb-2 mt-3">
                <strong>Förbjuden användning inkluderar:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Överföring av skadlig kod, virus eller malware</li>
                <li>Försök att få obehörig åtkomst till andra användares data</li>
                <li>Reverse engineering eller dekompilering av Tjänsten</li>
                <li>Användning för bedrägliga eller olagliga aktiviteter</li>
                <li>Överbelastning av servrar eller infrastruktur</li>
                <li>Vidareförsäljning eller uthyrning av Tjänsten utan tillstånd</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                5. Abonnemang, prissättning och betalningsvillkor
              </h3>
              <p className="mb-2 text-sm">
                <strong>5.1 Abonnemangstyper:</strong> Tjänsten erbjuds via månads- eller
                årsabonnemang enligt aktuell prislista på webbplatsen.
              </p>
              <p className="mb-2 text-sm">
                <strong>5.2 Betalning:</strong> Alla avgifter ska betalas i förskott via godkända
                betalningsmetoder. Automatisk förnyelse sker om inte uppsägning gjorts enligt punkt
                8.
              </p>
              <p className="mb-2 text-sm">
                <strong>5.3 Prisändringar:</strong> Vi förbehåller oss rätten att ändra priser med
                30 dagars skriftligt meddelande.
              </p>
              <p className="mb-2 text-sm">
                <strong>5.4 Utebliven betalning:</strong> Vid utebliven betalning kan kontot
                suspenderas efter 7 dagars varsel. Dröjsmålsränta enligt räntelagen kan tillkomma.
              </p>
              <p className="mb-2 text-sm">
                <strong>5.5 Stripe-betalningar:</strong> Betalningar hanteras av vår
                betalningstjänstleverantör Stripe Inc. Genom att använda tjänsten accepterar du även
                Stripes användarvillkor och integritetspolicy. Vi lagrar inga kreditkortsuppgifter -
                all känslig betalningsinformation hanteras säkert av Stripe enligt PCI
                DSS-standarder.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                6. Behandling av personuppgifter (GDPR)
              </h3>
              <p className="mb-2 text-sm">
                <strong>6.1 Personuppgiftsansvar:</strong> Vi är personuppgiftsansvarig för
                behandling av Dina kontaktuppgifter. För bokföringsdata där personuppgifter
                förekommer är Du personuppgiftsansvarig och vi är personuppgiftsbiträde.
              </p>
              <p className="mb-2 text-sm">
                <strong>6.2 Rättslig grund:</strong> Behandling sker med stöd av:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Fullgörande av avtal (artikel 6.1(b) GDPR)</li>
                <li>Berättigat intresse för tjänsteutveckling (artikel 6.1(f) GDPR)</li>
                <li>Rättslig förpliktelse avseende bokföringslagen (artikel 6.1(c) GDPR)</li>
              </ul>
              <p className="mb-2 text-sm">
                <strong>6.3 Dina rättigheter:</strong> Du har rätt till tillgång, rättelse,
                radering, begränsning, dataportabilitet och invändning enligt GDPR artiklar 15-21.
              </p>
              <p className="mb-2 text-sm">
                <strong>6.4 Lagringsperiod:</strong> Personuppgifter lagras under
                abonnemangsperioden plus 90 dagar. Bokföringsdata lagras enligt bokföringslagen (7
                år).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                7. Uppsägning och kontostängning
              </h3>
              <p className="mb-2 text-sm">
                <strong>7.1 Uppsägning av Användare:</strong> Du kan när som helst säga upp ditt
                abonnemang via kontoinställningar eller genom att kontakta oss. Uppsägning träder i
                kraft vid nästa faktureringsperiods slut.
              </p>
              <p className="mb-2 text-sm">
                <strong>7.2 Uppsägning av BokförCom:</strong> Vi kan säga upp Avtalet med 30 dagars
                varsel eller omedelbart vid:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Brott mot Avtalsvillkoren</li>
                <li>Utebliven betalning trots påminnelse</li>
                <li>Misstänkt bedräglig aktivitet</li>
                <li>Nedläggning av tjänsten</li>
              </ul>
              <p className="mb-2 text-sm">
                <strong>7.3 Dataexport:</strong> Vid uppsägning får Du 90 dagar att exportera Din
                data. Därefter raderas all data permanent.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                8. Ansvarsbegränsning och garantier
              </h3>
              <p className="mb-2 text-sm">
                <strong>8.1 Ingen garanti:</strong> Tjänsten tillhandahålls &ldquo;i befintligt
                skick&rdquo; utan garantier av något slag. Vi garanterar inte att Tjänsten är
                felfri, säker eller tillgänglig utan avbrott.
              </p>
              <p className="mb-2 text-sm">
                <strong>8.2 Ansvarsbegränsning:</strong> Vårt sammanlagda ansvar begränsas till det
                belopp Du betalat för Tjänsten under de senaste 12 månaderna, dock högst 50 000 SEK.
              </p>
              <p className="mb-2 text-sm">
                <strong>8.3 Uteslutna skador:</strong> Vi ansvarar inte för:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Indirekta skador, utebliven vinst eller följdskador</li>
                <li>Förlust av data som inte beror på vårt uppsåt eller grov vårdslöshet</li>
                <li>Skador orsakade av tredje part eller force majeure</li>
                <li>Skattekonsekvenser eller redovisningsfel</li>
                <li>Beslut baserade på rapporter från Tjänsten</li>
              </ul>
              <p className="mb-2 text-sm">
                <strong>8.4 Ditt ansvar:</strong> Du ansvarar för att granska och validera all
                output från Tjänsten. Vi rekommenderar starkt att Du använder kvalificerad
                redovisningskompetens.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">9. Ändringar av Avtalet</h3>
              <p className="mb-2 text-sm">
                Vi förbehåller oss rätten att ändra detta Avtal. Väsentliga ändringar meddelas minst
                30 dagar i förväg via e-post eller meddelande i tjänsten. Fortsatt användning efter
                ikraftträdandet innebär acceptans av de ändrade villkoren. Om du inte accepterar
                ändringarna kan du säga upp din prenumeration enligt punkt 7.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                10. Tvistelösning och tillämplig lag
              </h3>
              <p className="mb-2 text-sm">
                <strong>10.1 Tillämplig lag:</strong> Detta Avtal regleras av svensk lag utan
                tillämpning av dess konfliktlagar.
              </p>
              <p className="mb-2 text-sm">
                <strong>10.2 Domstol:</strong> Tvist rörande detta Avtal ska avgöras av svensk
                allmän domstol, med Stockholms tingsrätt som första instans.
              </p>
              <p className="mb-2 text-sm">
                <strong>10.3 Kontaktinformation:</strong> För frågor rörande detta Avtal, kontakta
                oss på: support@bokforcom.se
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                <strong>Senast uppdaterad:</strong> 12 november 2025
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Detta dokument utgör det fullständiga avtalet mellan parterna och ersätter alla
                tidigare överenskommelser avseende användning av BokförCom.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

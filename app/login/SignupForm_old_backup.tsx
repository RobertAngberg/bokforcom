"use client";

import { useState } from "react";
import Modal from "../_components/Modal";

interface SignupFormProps {
  onSuccess: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Du måste godkänna användaravtalet för att fortsätta");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Konto skapat! Du kan nu logga in.");
        onSuccess();
      } else {
        setError(data.error || "Något gick fel");
      }
    } catch (error) {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Företagsnamn"
          autoComplete="organization"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-postadress"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord (minst 6 tecken)"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Bekräfta lösenord"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Användaravtal checkbox */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="acceptTerms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          className="mt-1 w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label htmlFor="acceptTerms" className="text-sm text-slate-300">
          Jag godkänner{" "}
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            användaravtalet
          </button>{" "}
          och bekräftar att jag har läst och förstått villkoren
        </label>
      </div>

      {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || !acceptedTerms}
        className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Skapar konto..." : "Skapa konto"}
      </button>

      {/* Användaravtal Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="📋 Användaravtal"
        maxWidth="6xl"
        containerClassName="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] sm:!w-[90vw] lg:!max-w-[85vw] lg:!w-[85vw] xl:!max-w-[80vw] xl:!w-[80vw]"
      >
        <div className="space-y-8 text-gray-300 leading-relaxed text-sm max-h-[70vh] overflow-y-auto">
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
                <strong>SaaS-tjänst:</strong> Software-as-a-Service molnbaserad programvarulösning
              </li>
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
              <li>Endast använda Tjänsten för lagliga affärsändamål</li>
              <li>Respektera andra användares rättigheter och integritet</li>
              <li>Inte försöka få obehörig åtkomst till systemet eller andra konten</li>
            </ul>
            <p className="mb-3">Förbjuden användning inkluderar:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Användning för illegal verksamhet eller penningtvätt</li>
              <li>Distribution av malware, virus eller skadlig kod</li>
              <li>Försök att störa eller skada Tjänstens funktionalitet</li>
              <li>Obehörig åtkomst till eller manipulation av andras data</li>
              <li>Användning som överskrider rimliga resursgränser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Prissättning och betalningsvillkor
            </h2>
            <p className="mb-3">
              Prissättning för Tjänsten fastställs enligt aktuell prislista på vår webbplats.
              Prisändringar meddelas minst 30 dagar i förväg via e-post eller på plattformen.
            </p>
            <p className="mb-3">Betalningsvillkor:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Månadsabonnemang debiteras i förskott varje månad</li>
              <li>Årsabonnemang debiteras i förskott för hela året</li>
              <li>Betalning sker via kreditkort, betalkort eller faktura</li>
              <li>Moms tillkommer enligt gällande svensk lagstiftning</li>
              <li>Dröjsmålsränta enligt räntelagen vid försenad betalning</li>
            </ul>
            <p className="mt-3">
              Vid utebliven betalning förbehåller vi oss rätten att begränsa eller avsluta Tjänsten
              efter skriftlig varning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Immateriella rättigheter</h2>
            <p className="mb-3">
              Alla immateriella rättigheter till Tjänsten, inklusive men inte begränsat till
              källkod, design, logotyper, varumärken och dokumentation, tillhör Bokför.com eller
              våra licensgivare.
            </p>
            <p className="mb-3">Du beviljas en begränsad, icke-exklusiv licens att:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Använda Tjänsten för dina legitima affärsändamål</li>
              <li>Ladda ner och använda mobilapplikationer på dina enheter</li>
              <li>Skapa säkerhetskopior av dina data</li>
            </ul>
            <p className="mt-3">
              Du behåller ägande- och kontrollrätterna till dina bokföringsdata och
              affärsinformation. Vi använder endast denna data för att tillhandahålla Tjänsten
              enligt detta Avtal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Personuppgiftsbehandling och GDPR-efterlevnad
            </h2>
            <p className="mb-3">
              Vi behandlar personuppgifter i enlighet med Dataskyddsförordningen (GDPR) och svensk
              personuppgiftslagstiftning. Som personuppgiftsansvarig säkerställer vi:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Transparent information om personuppgiftsbehandling</li>
              <li>Laglig grund för all databehandling</li>
              <li>Tekniska och organisatoriska säkerhetsåtgärder</li>
              <li>Rätt till åtkomst, rättelse, radering och dataportabilitet</li>
              <li>Begränsad datalagring enligt fastställda lagringsperioder</li>
              <li>Incidenthantering och anmälningsrutiner</li>
            </ul>
            <p className="mt-3">
              Detaljerad information om personuppgiftsbehandling finns i vår Integritetspolicy. Du
              kan kontakta vårt dataskyddsombud för frågor om personuppgiftsbehandling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Uppsägning och avslutande av tjänsten
            </h2>
            <p className="mb-3">Du kan när som helst uppsäga din prenumeration genom att:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Logga in på ditt konto och avsluta prenumerationen</li>
              <li>Kontakta vår kundtjänst via e-post eller telefon</li>
              <li>Sända skriftlig uppsägning till vår postadress</li>
            </ul>
            <p className="mb-3">Vi kan avsluta ditt konto om:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Du bryter mot villkoren i detta Avtal</li>
              <li>Betalning uteblir efter påminnelse</li>
              <li>Du använder Tjänsten för illegal verksamhet</li>
              <li>Vi beslutar att upphöra med Tjänsten (minst 90 dagars varsel)</li>
            </ul>
            <p className="mt-3">
              Vid uppsägning har du 30 dagar att exportera dina data. Efter denna period raderas all
              data permanent och kan inte återställas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Ansvarsbegränsning och garantier
            </h2>
            <p className="mb-3">
              <strong>FULLSTÄNDIG ANSVARSBEGRÄNSNING:</strong> Tjänsten tillhandahålls "som den är"
              utan några garantier överhuvudtaget. Vi fråntar oss uttryckligen allt ansvar för:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Alla direkta, indirekta, speciella, tillfälliga eller följdskador</strong>
              </li>
              <li>
                <strong>Förlorad vinst, intäkter, data, goodwill eller affärsmöjligheter</strong>
              </li>
              <li>
                <strong>Affärsavbrott, driftstopp eller produktionsbortfall</strong>
              </li>
              <li>
                <strong>Skatteproblem, bokföringsfel eller juridiska konsekvenser</strong>
              </li>
              <li>
                <strong>Dataintrång, säkerhetsbrott eller sekretessbrott</strong>
              </li>
              <li>
                <strong>Tekniska fel, systemkrascher eller dataförlust</strong>
              </li>
              <li>
                <strong>
                  Felaktig rådgivning, missvisande information eller utelämnade uppgifter
                </strong>
              </li>
              <li>
                <strong>Tredje parts handlingar eller underlåtenheter</strong>
              </li>
              <li>
                <strong>Force majeure, naturkatastrofer eller myndighetsåtgärder</strong>
              </li>
              <li>
                <strong>
                  Internetproblem, avbrott, fördröjningar som ligger utanför vår kontroll
                </strong>
              </li>
              <li>
                <strong>Fel i kundens bokföring eller bristande bokföringsskyldighet</strong>
              </li>
            </ul>

            <p className="mb-3 mt-4">
              <strong>VIKTIG PRINCIP:</strong> Vi har under inga omständigheter något ansvar för hur
              du har bokfört eller att din bokföring uppfyller bokföringsskyldigheten enligt
              gällande lagstiftning. Problem med internet, avbrott och fördröjningar som ligger
              utanför vår kontroll ska inte räknas som fel i tjänsten.
            </p>

            <p className="mb-3 mt-4">
              <strong>Ansvarsbegränsning:</strong> Såvida inte annat föreskrivs i tvingande lag, är
              vårt ekonomiska ansvar begränsat enligt följande:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vi ansvarar inte för direkta eller indirekta skador av något slag</li>
              <li>Vårt totala ekonomiska ansvar är exkluderat i maximal utsträckning enligt lag</li>
              <li>Som enda reparation kan återbetalning av innevarande månads avgift ske</li>
              <li>
                Detta gäller oavsett skadeorsak, inklusive fel, vårdslöshet eller driftstörning
              </li>
            </ul>

            <p className="mb-3 mt-4">
              <strong>TJÄNSTEN I "BEFINTLIGT SKICK":</strong> Tjänsten tillhandahålls i "befintligt
              skick" och med "befintlig tillgänglighet" utan garantier av något slag. Vi garanterar
              uttryckligen inte att tjänsten:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kommer att vara tillgänglig, säker, felfri eller fungera utan avbrott</li>
              <li>Uppfyller dina specifika affärsbehov eller förväntningar</li>
              <li>Kommer att vara kompatibel med din verksamhet eller andra system</li>
              <li>Följer alla tillämpliga lagar, regleringar eller branschstandarder</li>
              <li>Skyddar mot alla cyberhot, säkerhetsrisker eller dataintrång</li>
              <li>Är fri från virus, trojaner eller andra skadliga komponenter</li>
            </ul>

            <p className="mt-4">
              <strong>Viktig information:</strong> Du använder SaaS-tjänsten på egen risk och eget
              ansvar. Vi rekommenderar starkt att du använder professionell redovisnings- och
              juridisk rådgivning samt säkerhetskopierar all viktig data externt. Denna
              ansvarsbegränsning gäller i maximal utsträckning som tillåts enligt svensk lag.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Force Majeure</h2>
            <p className="mb-3">
              Vi ansvarar inte för dröjsmål eller underlåtenhet att fullgöra våra åtaganden som
              beror på omständigheter utanför vår rimliga kontroll, inklusive:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Naturkatastrofer, krig eller terroristattacker</li>
              <li>Myndighetsbeslut eller lagändringar</li>
              <li>Omfattande internetavbrott eller cyberattacker</li>
              <li>Strejk eller andra arbetsmarknadskonflikter</li>
              <li>Fel hos tredjepartsleverantörer av kritiska tjänster</li>
            </ul>
            <p className="mt-3">
              Vi kommer att informera dig om sådana omständigheter och vidta rimliga åtgärder för
              att minimera störningar i Tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Ändringar av avtalet</h2>
            <p className="mb-3">
              Vi förbehåller oss rätten att ändra detta Avtal. Väsentliga ändringar meddelas minst
              30 dagar i förväg via:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>E-post till din registrerade e-postadress</li>
              <li>Meddelande på plattformen vid inloggning</li>
              <li>Uppdatering på vår webbplats</li>
            </ul>
            <p className="mt-3">
              Genom att fortsätta använda Tjänsten efter ikraftträdandedatumet accepterar du de
              ändrade villkoren. Om du inte accepterar ändringarna kan du säga upp din prenumeration
              innan ändringarna träder i kraft.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              12. Tillämplig lag och tvistlösning
            </h2>
            <p className="mb-3">
              Detta Avtal lyder under svensk lag. Tvister som uppstår i anslutning till detta Avtal
              ska i första hand lösas genom förhandling mellan parterna.
            </p>
            <p className="mb-3">
              Om förhandling inte leder till lösning ska tvisten avgöras av svensk domstol, med
              Stockholms tingsrätt som första instans för tvister som inte kan prövas av Allmänna
              reklamationsnämnden.
            </p>
            <p className="mt-3">
              Som konsument har du rätt att vända dig till Allmänna reklamationsnämnden eller EU:s
              plattform för onlinetvistlösning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Övrigt</h2>
            <p className="mb-3">
              <strong>Hela avtalet:</strong> Detta Avtal tillsammans med vår Integritetspolicy utgör
              hela överenskommelsen mellan parterna och ersätter alla tidigare avtal.
            </p>
            <p className="mb-3">
              <strong>Delbarhet:</strong> Om någon del av detta Avtal skulle bedömas ogiltig eller
              omöjlig att verkställa, förblir övriga delar i kraft.
            </p>
            <p className="mb-3">
              <strong>Överlåtelse:</strong> Du får inte överlåta dina rättigheter eller skyldigheter
              enligt detta Avtal utan vårt skriftliga samtycke.
            </p>
            <p className="mt-3">
              <strong>Språk:</strong> Detta Avtal är upprättat på svenska. Vid översättning till
              andra språk gäller den svenska versionen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Kontaktinformation</h2>
            <p className="mb-3">För frågor om detta Avtal eller Tjänsten, kontakta oss:</p>
            <div className="bg-slate-700 p-4 rounded-lg">
              <p>
                <strong>Bokför.com</strong>
              </p>
              <p>E-post: support@bokför.com</p>
              <p>Telefon: 08-123 456 78</p>
              <p>Kundtjänst: Måndag-Fredag 09:00-17:00</p>
              <p>Dataskyddsombud: dpo@bokför.com</p>
              <p>Postadress: Bokför.com AB, Box 12345, 111 23 Stockholm</p>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Detta avtal träder i kraft 2025-08-22 och ersätter alla tidigare versioner.
            </p>
          </section>
        </div>
      </Modal>
    </form>
  );
}

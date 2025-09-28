"use client";

import { useActionState, useState } from "react";
import Modal from "../_components/Modal";
import TextFalt from "../_components/TextFalt";
import { createAccount } from "./actions";

interface EmailSignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function EpostRegistrering({ onSwitchToLogin }: EmailSignupFormProps) {
  // React 19 useActionState - all form state in one hook! 🚀
  const [state, formAction, isPending] = useActionState(createAccount, null);

  // Form state for TextFalt components
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Only keep modal state (not form-related)
  const [showTermsModal, setShowTermsModal] = useState(false);

  if (state?.success) {
    return (
      <div>
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
            <h3 className="text-green-300 font-semibold mb-2">✅ Registrering lyckades!</h3>
            <p className="text-green-200 text-sm">
              Ett verifieringsmail har skickats till <strong>{state?.user?.email}</strong>.
              <br />
              Kontrollera din inkorg och klicka på länken för att verifiera ditt konto.
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Efter verifiering kan du logga in med dina uppgifter.
          </p>
          {onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Gå till login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div>
          <TextFalt
            label="Ditt namn"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <TextFalt
            label="E-postadress"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-postadress"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <TextFalt
            label="Lösenord"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord (minst 8 tecken)"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {state?.error && <div className="text-center text-sm text-red-400 mt-2">{state.error}</div>}

        <div className="flex items-start space-x-2 mb-6">
          <input
            name="acceptTerms"
            type="checkbox"
            id="acceptTerms"
            required
            className="mt-0.5 h-4 w-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600"
          />
          <label htmlFor="acceptTerms" className="text-slate-400 text-xs">
            Jag godkänner{" "}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-blue-400 hover:text-blue-300 underline bg-transparent border-none p-0 cursor-pointer"
            >
              användarvillkoren
            </button>
          </label>
        </div>

        {/* Hidden inputs för server action */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Registrerar..." : "Registrera konto"}
        </button>
      </form>

      {/* Användarvillkor Modal */}
      {showTermsModal && (
        <Modal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          title="Användaravtal"
          maxWidth="6xl"
          containerClassName="!-mt-40"
        >
          <div className="space-y-6 text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                1. Definitioner och tillämpningsområde asdf
              </h3>
              <p className="mb-3">
                Detta användaravtal (&ldquo;Avtalet&rdquo;) utgör en juridiskt bindande
                överenskommelse mellan dig som användare (&ldquo;Kund&rdquo;, &ldquo;Du&rdquo;,
                &ldquo;Användare&rdquo;) och Bokföringsapp (&ldquo;Vi&rdquo;,
                &ldquo;Tjänsteleverantör&rdquo;, &ldquo;Bolaget&rdquo;) avseende användning av den
                webbaserade bokföringstjänsten Bokföringsapp.
              </p>
              <p className="mb-2">
                <strong>Definitioner:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
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
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Vara minst 18 år gammal eller ha vårdnadshavares samtycke</li>
                <li>Ha rättslig behörighet att ingå bindande avtal</li>
                <li>Vara registrerad som företagare eller företag i Sverige</li>
                <li>Ange korrekta, fullständiga och aktuella registreringsuppgifter</li>
                <li>Acceptera att endast skapa ett (1) konto per juridisk enhet</li>
              </ul>
              <p className="mt-3 text-xs">
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
                Bokföringsapp är en Software-as-a-Service (SaaS) lösning som tillhandahåller:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
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
              <p className="mt-3 text-xs">
                Tjänsten är utformad för att underlätta redovisningsprocesser men ersätter inte
                professionell redovisningskompetens eller juridisk rådgivning.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                4. Användaråtaganden och förbjuden användning
              </h3>
              <p className="mb-2">Du åtar dig att:</p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
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
              <ul className="list-disc pl-6 space-y-1 text-xs">
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
              <p className="mb-2 text-xs">
                <strong>5.1 Abonnemangstyper:</strong> Tjänsten erbjuds via månads- eller
                årsabonnemang enligt aktuell prislista på webbplatsen.
              </p>
              <p className="mb-2 text-xs">
                <strong>5.2 Betalning:</strong> Alla avgifter ska betalas i förskott via godkända
                betalningsmetoder. Automatisk förnyelse sker om inte uppsägning gjorts enligt punkt
                8.
              </p>
              <p className="mb-2 text-xs">
                <strong>5.3 Prisändringar:</strong> Vi förbehåller oss rätten att ändra priser med
                30 dagars skriftligt meddelande.
              </p>
              <p className="mb-2 text-xs">
                <strong>5.4 Utebliven betalning:</strong> Vid utebliven betalning kan kontot
                suspenderas efter 7 dagars varsel. Dröjsmålsränta enligt räntelagen kan tillkomma.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                6. Behandling av personuppgifter (GDPR)
              </h3>
              <p className="mb-2 text-xs">
                <strong>6.1 Personuppgiftsansvar:</strong> Vi är personuppgiftsansvarig för
                behandling av Dina kontaktuppgifter. För bokföringsdata där personuppgifter
                förekommer är Du personuppgiftsansvarig och vi är personuppgiftsbiträde.
              </p>
              <p className="mb-2 text-xs">
                <strong>6.2 Rättslig grund:</strong> Behandling sker med stöd av:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Fullgörande av avtal (artikel 6.1(b) GDPR)</li>
                <li>Berättigat intresse för tjänsteutveckling (artikel 6.1(f) GDPR)</li>
                <li>Rättslig förpliktelse avseende bokföringslagen (artikel 6.1(c) GDPR)</li>
              </ul>
              <p className="mb-2 text-xs">
                <strong>6.3 Dina rättigheter:</strong> Du har rätt till tillgång, rättelse,
                radering, begränsning, dataportabilitet och invändning enligt GDPR artiklar 15-21.
              </p>
              <p className="mb-2 text-xs">
                <strong>6.4 Lagringsperiod:</strong> Personuppgifter lagras under
                abonnemangsperioden plus 90 dagar. Bokföringsdata lagras enligt bokföringslagen (7
                år).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                7. Ansvarsbegränsning och garantier
              </h3>
              <p className="mb-2 text-xs">
                <strong>7.1 Ingen garanti:</strong> Tjänsten tillhandahålls &ldquo;i befintligt
                skick&rdquo; utan garantier av något slag. Vi garanterar inte att Tjänsten är
                felfri, säker eller tillgänglig utan avbrott.
              </p>
              <p className="mb-2 text-xs">
                <strong>7.2 Ansvarsbegränsning:</strong> Vårt sammanlagda ansvar begränsas till det
                belopp Du betalat för Tjänsten under de senaste 12 månaderna, dock högst 50 000 SEK.
              </p>
              <p className="mb-2 text-xs">
                <strong>7.3 Uteslutna skador:</strong> Vi ansvarar inte för:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Indirekta skador, utebliven vinst eller följdskador</li>
                <li>Förlust av data som inte beror på vårt uppsåt eller grov vårdslöshet</li>
                <li>Skador orsakade av tredje part eller force majeure</li>
                <li>Skattekonsekvenser eller redovisningsfel</li>
                <li>Beslut baserade på rapporter från Tjänsten</li>
              </ul>
              <p className="mb-2 text-xs">
                <strong>7.4 Ditt ansvar:</strong> Du ansvarar för att granska och validera all
                output från Tjänsten. Vi rekommenderar starkt att Du använder kvalificerad
                redovisningskompetens.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                8. Tvistelösning och tillämplig lag
              </h3>
              <p className="mb-2 text-xs">
                <strong>8.1 Tillämplig lag:</strong> Detta Avtal regleras av svensk lag utan
                tillämpning av dess konfliktlagar.
              </p>
              <p className="mb-2 text-xs">
                <strong>8.2 Domstol:</strong> Tvist rörande detta Avtal ska avgöras av svensk allmän
                domstol, med Stockholms tingsrätt som första instans.
              </p>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

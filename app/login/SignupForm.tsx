"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import Knapp from "../_components/Knapp";
import TextFalt from "../_components/TextFalt";
import Modal from "../_components/Modal";
import Toast from "../_components/Toast";
import { saveSignupData, checkUserSignupStatus } from "./actions";

registerLocale("sv", sv);

// Frontend validation functions
const validateOrganisationsnummer = (orgnr: string): { valid: boolean; error?: string } => {
  if (!orgnr) return { valid: false, error: "Organisationsnummer krävs" };

  const cleanOrgNr = orgnr.replace(/\D/g, "");

  if (cleanOrgNr.length !== 10 && cleanOrgNr.length !== 12) {
    return { valid: false, error: "Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)" };
  }

  const orgNrToValidate = cleanOrgNr.length === 12 ? cleanOrgNr.slice(2) : cleanOrgNr;

  if (!/^\d{10}$/.test(orgNrToValidate)) {
    return { valid: false, error: "Organisationsnummer har ogiltigt format" };
  }

  return { valid: true };
};

const validateCompanyName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Företagsnamn krävs" };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: "Företagsnamn måste vara minst 2 tecken" };
  }

  if (name.trim().length > 100) {
    return { valid: false, error: "Företagsnamn får vara max 100 tecken" };
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      return { valid: false, error: "Företagsnamn innehåller otillåtna tecken" };
    }
  }

  return { valid: true };
};

const formatOrganisationsnummer = (value: string): string => {
  const clean = value.replace(/\D/g, "");

  if (clean.length >= 6) {
    return clean.slice(0, 6) + "-" + clean.slice(6, 10);
  }

  return clean;
};

interface SignupFormProps {
  onSuccess: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [userStatus, setUserStatus] = useState<{
    loggedIn?: boolean;
    hasCompanyInfo?: boolean;
    companyName?: string;
    loading: boolean;
  }>({ loading: true });

  const [formData, setFormData] = useState({
    organisationsnummer: "",
    företagsnamn: "",
    momsperiod: "",
    redovisningsmetod: "",
    första_bokslut: "",
    startdatum: null as Date | null,
    slutdatum: null as Date | null,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isAnvändaravtalOpen, setIsAnvändaravtalOpen] = useState(false);

  useEffect(() => {
    checkUserSignupStatus().then((status: any) => {
      setUserStatus({ ...status, loading: false });
    });
  }, []);

  // Validation effect
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (formData.organisationsnummer) {
      const orgValidation = validateOrganisationsnummer(formData.organisationsnummer);
      if (!orgValidation.valid) {
        errors.organisationsnummer = orgValidation.error || "Ogiltigt organisationsnummer";
      }
    }

    if (formData.företagsnamn) {
      const nameValidation = validateCompanyName(formData.företagsnamn);
      if (!nameValidation.valid) {
        errors.företagsnamn = nameValidation.error || "Ogiltigt företagsnamn";
      }
    }

    const requiredFields = [
      "organisationsnummer",
      "företagsnamn",
      "momsperiod",
      "redovisningsmetod",
      "första_bokslut",
    ];
    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = "Detta fält krävs";
      }
    });

    if (formData.första_bokslut === "nej") {
      if (!formData.startdatum) {
        errors.startdatum = "Startdatum krävs";
      }
      if (!formData.slutdatum) {
        errors.slutdatum = "Slutdatum krävs";
      }
      if (formData.startdatum && formData.slutdatum && formData.startdatum >= formData.slutdatum) {
        errors.slutdatum = "Slutdatum måste vara efter startdatum";
      }
    }

    setValidationErrors(errors);
    setIsFormValid(
      Object.keys(errors).length === 0 &&
        requiredFields.every((field) => formData[field as keyof typeof formData])
    );
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === "organisationsnummer") {
      processedValue = formatOrganisationsnummer(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userStatus.loggedIn) {
      setLoading(false);
      window.location.href = "/api/auth/signin?callbackUrl=/login";
      return;
    }

    if (!isFormValid || Object.keys(validationErrors).length > 0) {
      setError("Vänligen rätta till alla fel i formuläret");
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.set("organisationsnummer", formData.organisationsnummer);
      submitData.set("företagsnamn", formData.företagsnamn);
      submitData.set("momsperiod", formData.momsperiod);
      submitData.set("redovisningsmetod", formData.redovisningsmetod);
      submitData.set("första_bokslut", formData.första_bokslut);

      if (formData.startdatum) {
        submitData.set("startdatum", formData.startdatum.toISOString().split("T")[0]);
      }
      if (formData.slutdatum) {
        submitData.set("slutdatum", formData.slutdatum.toISOString().split("T")[0]);
      }

      const result = await saveSignupData(submitData);

      if (result.success) {
        setToast({
          type: "success",
          message: `${result.message} Välkommen ${result.user?.företagsnamn}!`,
        });
        onSuccess();
      } else {
        setError(result.error || "Ett fel uppstod vid registreringen");
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod vid registreringen");
    } finally {
      setLoading(false);
    }
  };

  if (userStatus.loading) {
    return (
      <div className="text-center">
        <div className="text-white">Laddar...</div>
      </div>
    );
  }

  if (userStatus.loggedIn && userStatus.hasCompanyInfo) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-4">Företag redan registrerat</h2>
        <p className="text-gray-300 mb-4">
          Ditt företag <strong>{userStatus.companyName}</strong> är redan registrerat.
        </p>
        <p className="text-gray-300">
          Gå till{" "}
          <a href="/" className="text-blue-400 hover:underline">
            startsidan
          </a>{" "}
          för att börja bokföra.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!userStatus.loggedIn && (
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
          <h3 className="text-blue-300 font-semibold mb-2">
            Logga in för att slutföra registreringen
          </h3>
          <p className="text-blue-200 text-sm mb-4">
            Du kan fylla i formuläret nedan, men du behöver logga in med Google för att spara dina
            uppgifter.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/api/auth/signin?callbackUrl=/login")}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Logga in med Google
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organisationsnummer */}
        <div>
          <TextFalt
            label="Organisationsnummer *"
            name="organisationsnummer"
            value={formData.organisationsnummer}
            onChange={handleInputChange}
            placeholder="XXXXXX-XXXX"
            maxLength={11}
            pattern="[0-9]{6}-[0-9]{4}"
            required
            className={validationErrors.organisationsnummer ? "border-red-500" : ""}
          />
          {validationErrors.organisationsnummer && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.organisationsnummer}</p>
          )}
        </div>

        {/* Företagsnamn */}
        <div>
          <TextFalt
            label="Företagsnamn *"
            name="företagsnamn"
            value={formData.företagsnamn}
            onChange={handleInputChange}
            placeholder="Ditt företagsnamn"
            maxLength={100}
            required
            className={validationErrors.företagsnamn ? "border-red-500" : ""}
          />
          {validationErrors.företagsnamn && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.företagsnamn}</p>
          )}
          <p className="text-gray-400 text-sm mt-1">{formData.företagsnamn.length}/100 tecken</p>
        </div>

        {/* Momsredovisningsperiod */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Momsredovisningsperiod *
          </label>
          <select
            name="momsperiod"
            value={formData.momsperiod}
            onChange={handleInputChange}
            required
            className={`bg-slate-900 text-white px-4 py-3 rounded-lg w-full border focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 ${
              validationErrors.momsperiod ? "border-red-500" : "border-slate-600"
            }`}
          >
            <option value="">Välj period...</option>
            <option value="årsvis">Helt år</option>
            <option value="kvartalsvis">Varje kvartal</option>
            <option value="månadsvis">Varje månad</option>
          </select>
          {validationErrors.momsperiod && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.momsperiod}</p>
          )}
        </div>

        {/* Bokföringsmetod */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Bokföringsmetod *</label>
          <select
            name="redovisningsmetod"
            value={formData.redovisningsmetod}
            onChange={handleInputChange}
            required
            className={`bg-slate-900 text-white px-4 py-3 rounded-lg w-full border focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 ${
              validationErrors.redovisningsmetod ? "border-red-500" : "border-slate-600"
            }`}
          >
            <option value="">Välj metod...</option>
            <option value="fakturaredovisning">Fakturaredovisning (normalt)</option>
            <option value="kassaredovisning">Kassaredovisning</option>
          </select>
          {validationErrors.redovisningsmetod && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.redovisningsmetod}</p>
          )}
        </div>

        {/* Första bokslut */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Har ditt företag gjort sitt första bokslut? *
          </label>
          <select
            name="första_bokslut"
            value={formData.första_bokslut}
            onChange={handleInputChange}
            required
            className={`bg-slate-900 text-white px-4 py-3 rounded-lg w-full border focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 ${
              validationErrors.första_bokslut ? "border-red-500" : "border-slate-600"
            }`}
          >
            <option value="">Välj...</option>
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
          {validationErrors.första_bokslut && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.första_bokslut}</p>
          )}
        </div>

        {/* Datum för första bokslut */}
        {formData.första_bokslut === "nej" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Startdatum för verksamheten *
              </label>
              <DatePicker
                selected={formData.startdatum}
                onChange={(date) => handleDateChange("startdatum", date)}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj startdatum"
                className={`bg-slate-900 text-white px-4 py-3 rounded-lg w-full border focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 ${
                  validationErrors.startdatum ? "border-red-500" : "border-slate-600"
                }`}
                required={formData.första_bokslut === "nej"}
              />
              {validationErrors.startdatum && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.startdatum}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Slutdatum för första räkenskapsår *
              </label>
              <DatePicker
                selected={formData.slutdatum}
                onChange={(date) => handleDateChange("slutdatum", date)}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                placeholderText="Välj slutdatum"
                className={`bg-slate-900 text-white px-4 py-3 rounded-lg w-full border focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700 ${
                  validationErrors.slutdatum ? "border-red-500" : "border-slate-600"
                }`}
                required={formData.första_bokslut === "nej"}
              />
              {validationErrors.slutdatum && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.slutdatum}</p>
              )}
            </div>
          </div>
        )}

        {/* Checkbox för användaravtal */}
        <div className="pt-4 pb-2">
          <div className="flex items-start space-x-3 text-sm text-gray-300">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
            />
            <span>
              Jag godkänner{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAnvändaravtalOpen(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                användaravtalet
              </button>{" "}
              och bekräftar att jag har läst och förstått villkoren
            </span>
          </div>
        </div>

        <div className="pt-4">
          <Knapp
            text={
              loading
                ? "Skapar konto..."
                : !isFormValid
                  ? "Fyll i alla fält korrekt"
                  : "Skapa företagskonto"
            }
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full ${!isFormValid ? "opacity-50" : ""}`}
          />
          {!isFormValid && Object.keys(validationErrors).length > 0 && (
            <p className="text-yellow-400 text-sm mt-2 text-center">
              Kontrollera formuläret - {Object.keys(validationErrors).length} fel kvar
            </p>
          )}
        </div>
      </form>

      {/* Användaravtal Modal */}
      <Modal
        isOpen={isAnvändaravtalOpen}
        onClose={() => setIsAnvändaravtalOpen(false)}
        title="📋 Användaravtal"
      >
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
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

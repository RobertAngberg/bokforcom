"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import TextFalt from "../_components/TextFalt";
import { saveSignupData, checkUserSignupStatus } from "./actions";

registerLocale("sv", sv);

// Frontend validation functions - flyttade från actions.ts
const validateOrganisationsnummer = (orgnr: string): { valid: boolean; error?: string } => {
  if (!orgnr) return { valid: false, error: "Organisationsnummer krävs" };

  // Ta bort alla icke-siffror
  const cleanOrgNr = orgnr.replace(/\D/g, "");

  // Kontrollera längd (10 siffror för organisationsnummer, 12 för personnummer)
  if (cleanOrgNr.length !== 10 && cleanOrgNr.length !== 12) {
    return { valid: false, error: "Organisationsnummer måste vara 10 siffror (YYYYMMDDXX)" };
  }

  // För personnummer (12 siffror), ta bara de sista 10
  const orgNrToValidate = cleanOrgNr.length === 12 ? cleanOrgNr.slice(2) : cleanOrgNr;

  // Grundläggande format-kontroll
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

  // Kontrollera för misstänkta mönster
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
  // Ta bort alla icke-siffror
  const clean = value.replace(/\D/g, "");

  // Formatera som XXXXXX-XXXX för 10 siffror
  if (clean.length >= 6) {
    return clean.slice(0, 6) + "-" + clean.slice(6, 10);
  }

  return clean;
};

const allowedMomsperiods = ["månadsvis", "kvartalsvis", "årsvis"];
const allowedMethods = ["kassaredovisning", "fakturaredovisning"];

export default function SignupPage() {
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

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserSignupStatus().then((status: any) => {
      setUserStatus({ ...status, loading: false });
    });
  }, []);

  // Validation effect - kör validering när form data ändras
  useEffect(() => {
    const errors: Record<string, string> = {};

    // Validera organisationsnummer
    if (formData.organisationsnummer) {
      const orgValidation = validateOrganisationsnummer(formData.organisationsnummer);
      if (!orgValidation.valid) {
        errors.organisationsnummer = orgValidation.error || "Ogiltigt organisationsnummer";
      }
    }

    // Validera företagsnamn
    if (formData.företagsnamn) {
      const nameValidation = validateCompanyName(formData.företagsnamn);
      if (!nameValidation.valid) {
        errors.företagsnamn = nameValidation.error || "Ogiltigt företagsnamn";
      }
    }

    // Validera required fields
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

    // Validera startdatum och slutdatum om första_bokslut är "nej"
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

    // Auto-format organisationsnummer
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

    // Kontrollera om användaren är inloggad
    if (!userStatus.loggedIn) {
      setLoading(false);
      // Dirigera till Google-login med callback till signup
      window.location.href = "/api/auth/signin?callbackUrl=/signup";
      return;
    }

    // Frontend validation check
    if (!isFormValid || Object.keys(validationErrors).length > 0) {
      setError("Vänligen rätta till alla fel i formuläret");
      setLoading(false);
      return;
    }

    try {
      // Skapa FormData för backend - data är redan validerat frontend
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
        alert(`${result.message} Välkommen ${result.user?.företagsnamn}!`);
        // TODO: Redirect till dashboard
      } else {
        setError(result.error || "Ett fel uppstod vid registreringen");
      }
    } catch (err) {
      setError("Ett oväntat fel uppstod vid registreringen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        {userStatus.loading ? (
          <div className="text-center">
            <div className="text-white">Laddar...</div>
          </div>
        ) : userStatus.loggedIn && userStatus.hasCompanyInfo ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Företag redan registrerat</h1>
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
        ) : (
          <>
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-white mb-4">Skapa ditt företagskonto</h1>
              <p className="text-gray-300">
                {userStatus.loggedIn
                  ? "Fyll i dina företagsuppgifter för att komma igång med bokföringen"
                  : "Logga in med Google och fyll sedan i företagsuppgifterna för att komma igång"}
              </p>
            </div>

            <div className="rounded-lg p-8">
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
                    Du kan fylla i formuläret nedan, men du behöver logga in med Google för att
                    spara dina uppgifter.
                  </p>
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/api/auth/signin?callbackUrl=/signup")}
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
                    <p className="text-red-400 text-sm mt-1">
                      {validationErrors.organisationsnummer}
                    </p>
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
                  <p className="text-gray-400 text-sm mt-1">
                    {formData.företagsnamn.length}/100 tecken
                  </p>
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Bokföringsmetod *
                  </label>
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
                    <p className="text-red-400 text-sm mt-1">
                      {validationErrors.redovisningsmetod}
                    </p>
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

              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Har du redan ett konto?{" "}
                  <a href="/login" className="text-cyan-400 hover:text-cyan-300">
                    Logga in här
                  </a>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

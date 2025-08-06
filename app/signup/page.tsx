"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import { saveSignupData, checkUserSignupStatus } from "./actions";

registerLocale("sv", sv);

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserSignupStatus().then((status: any) => {
      setUserStatus({ ...status, loading: false });
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    try {
      // Skapa FormData för backend
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
        ) : !userStatus.loggedIn ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Logga in först</h1>
            <p className="text-gray-300">Du måste vara inloggad för att skapa ett företagskonto.</p>
          </div>
        ) : userStatus.hasCompanyInfo ? (
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
                Fyll i dina företagsuppgifter för att komma igång med bokföringen
              </p>
            </div>

            <div className="rounded-lg p-8">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organisationsnummer */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Organisationsnummer *
                  </label>
                  <input
                    type="text"
                    name="organisationsnummer"
                    value={formData.organisationsnummer}
                    onChange={handleInputChange}
                    placeholder="XXXXXX-XXXX"
                    required
                    className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                  />
                </div>

                {/* Företagsnamn */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Företagsnamn *
                  </label>
                  <input
                    type="text"
                    name="företagsnamn"
                    value={formData.företagsnamn}
                    onChange={handleInputChange}
                    placeholder="Ditt företagsnamn"
                    required
                    className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                  />
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
                    className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                  >
                    <option value="">Välj period...</option>
                    <option value="helt_ar">Helt år</option>
                    <option value="kvartal">Varje kvartal</option>
                    <option value="manad">Varje månad</option>
                  </select>
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
                    className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                  >
                    <option value="">Välj metod...</option>
                    <option value="fakturametoden">Fakturametoden</option>
                    <option value="kontantmetoden">Kontantmetoden</option>
                  </select>
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
                    className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                  >
                    <option value="">Välj...</option>
                    <option value="nej">Nej</option>
                    <option value="ja">Ja</option>
                  </select>
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
                        className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                        required={formData.första_bokslut === "nej"}
                      />
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
                        className="bg-slate-900 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:border-cyan-700"
                        required={formData.första_bokslut === "nej"}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Knapp
                    text={loading ? "Skapar konto..." : "Skapa företagskonto"}
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  />
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

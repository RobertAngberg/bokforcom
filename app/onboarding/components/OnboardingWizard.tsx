"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import Dropdown from "../../_components/Dropdown";
import { completeOnboarding } from "../actions/onboardingActions";
import { BokföringsmetodType, MomsperiodType, OnboardingData } from "../types/types";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [bokföringsmetod, setBokföringsmetod] = useState<BokföringsmetodType>("Kontantmetoden");
  const [momsperiod, setMomsperiod] = useState<MomsperiodType>("Årsvis");

  const totalSteps = 2;

  const handleNext = () => {
    setError(null);

    // Validera steg 1
    if (step === 1) {
      const orgNrCleaned = organisationsnummer.replace(/\D/g, "");
      if (orgNrCleaned.length !== 10) {
        setError("Organisationsnummer måste vara 10 siffror");
        return;
      }
      if (!företagsnamn || företagsnamn.trim().length < 2) {
        setError("Ange ett giltigt företagsnamn");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const data: OnboardingData = {
      organisationsnummer,
      företagsnamn,
      bokföringsmetod,
      momsperiod,
    };

    const result = await completeOnboarding(data);

    if (result.success) {
      router.push("/start");
    } else {
      setError(result.error || "Något gick fel");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">
            Steg {step} av {totalSteps}
          </span>
          <span className="text-sm font-medium text-cyan-400">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          {step === 1 ? "🏢 Välkommen!" : "⚙️ Bokföringsinställningar"}
        </h1>
        <p className="text-slate-300">
          {step === 1
            ? "Låt oss börja med att registrera ditt företag"
            : "Nu behöver vi veta hur du vill hantera din bokföring"}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Step 1: Företagsinformation */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Organisationsnummer <span className="text-red-400">*</span>
            </label>
            <TextFalt
              label=""
              name="organisationsnummer"
              value={organisationsnummer}
              onChange={(e) => setOrganisationsnummer(e.target.value)}
              placeholder="XXXXXX-XXXX"
              maxLength={11}
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">Format: 10 siffror (t.ex. 5566778899)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Företagsnamn <span className="text-red-400">*</span>
            </label>
            <TextFalt
              label=""
              name="företagsnamn"
              value={företagsnamn}
              onChange={(e) => setFöretagsnamn(e.target.value)}
              placeholder="Ditt Företag AB"
              maxLength={255}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Step 2: Bokföringsinställningar */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Bokföringsmetod <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 border-cyan-800 rounded-lg cursor-pointer hover:bg-cyan-950 transition-colors">
                <input
                  type="radio"
                  name="bokföringsmetod"
                  value="Kontantmetoden"
                  checked={bokföringsmetod === "Kontantmetoden"}
                  onChange={(e) => setBokföringsmetod(e.target.value as BokföringsmetodType)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-slate-100">Kontantmetoden</div>
                  <div className="text-sm text-slate-300">
                    Bokför när pengarna faktiskt betalas in eller ut. Enklare för mindre företag.
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 border-cyan-800 rounded-lg cursor-pointer hover:bg-cyan-950 transition-colors">
                <input
                  type="radio"
                  name="bokföringsmetod"
                  value="Fakturametoden"
                  checked={bokföringsmetod === "Fakturametoden"}
                  onChange={(e) => setBokföringsmetod(e.target.value as BokföringsmetodType)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-slate-100">Fakturametoden</div>
                  <div className="text-sm text-slate-300">
                    Bokför när fakturor skickas/tas emot. Obligatorisk för vissa företag.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Momsredovisningsperiod <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={momsperiod}
              onChange={(value) => setMomsperiod(value as MomsperiodType)}
              options={[
                { label: "Årsvis", value: "Årsvis" },
                { label: "Kvartalsvis", value: "Kvartalsvis" },
                { label: "Månadsvis", value: "Månadsvis" },
              ]}
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">
              Hur ofta du ska redovisa moms till Skatteverket
            </p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t border-cyan-800">
        {step > 1 ? <Knapp text="← Tillbaka" onClick={handleBack} disabled={loading} /> : <div />}

        {step < totalSteps ? (
          <Knapp text="Nästa →" onClick={handleNext} disabled={loading} />
        ) : (
          <Knapp
            text={loading ? "Sparar..." : "Slutför ✓"}
            onClick={handleSubmit}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import type { ForetagsprofilComponentProps } from "../_types/types";
import { useForetagsprofil } from "../_hooks/useForetagsprofil";

export default function Foretagsprofil({ initialForetag }: ForetagsprofilComponentProps) {
  const {
    foretagsProfil,
    isEditingCompany,
    isSavingCompany,
    companyMessage,
    onEditCompany,
    onCancelCompany,
    onSaveCompany,
    onChangeCompany,
  } = useForetagsprofil(initialForetag);
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">🏢 Företagsprofil</h2>
        {!isEditingCompany && (
          <Knapp
            text="✏️ Redigera"
            onClick={onEditCompany}
            className="bg-blue-600 hover:bg-blue-700"
          />
        )}
      </div>

      {companyMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            companyMessage.type === "success"
              ? "bg-green-600/20 text-green-400"
              : "bg-red-600/20 text-red-400"
          }`}
        >
          {companyMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isEditingCompany ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Företagsnamn"
                name="foretagsnamn"
                type="text"
                value={foretagsProfil.foretagsnamn}
                onChange={(e) => onChangeCompany("foretagsnamn", e.target.value)}
                placeholder="Företagsnamn AB"
                maxLength={100}
              />
              <TextFalt
                label="Organisationsnummer"
                name="organisationsnummer"
                type="text"
                value={foretagsProfil.organisationsnummer}
                onChange={(e) => onChangeCompany("organisationsnummer", e.target.value)}
                placeholder="556789-1234"
                pattern="[0-9]{6}-[0-9]{4}"
                maxLength={11}
              />
            </div>

            <TextFalt
              label="Adress"
              name="adress"
              type="text"
              value={foretagsProfil.adress}
              onChange={(e) => onChangeCompany("adress", e.target.value)}
              placeholder="Företagsgatan 123"
              maxLength={200}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Postnummer"
                name="postnummer"
                type="text"
                value={foretagsProfil.postnummer}
                onChange={(e) => onChangeCompany("postnummer", e.target.value)}
                placeholder="123 45"
                pattern="[0-9]{3} [0-9]{2}"
                maxLength={6}
              />
              <TextFalt
                label="Stad"
                name="stad"
                type="text"
                value={foretagsProfil.stad}
                onChange={(e) => onChangeCompany("stad", e.target.value)}
                placeholder="Stockholm"
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Telefonnummer"
                name="telefonnummer"
                type="tel"
                value={foretagsProfil.telefonnummer}
                onChange={(e) => onChangeCompany("telefonnummer", e.target.value)}
                placeholder="08-123 45 67"
                maxLength={20}
              />
              <TextFalt
                label="Email"
                name="epost"
                type="email"
                value={foretagsProfil.epost}
                onChange={(e) => onChangeCompany("epost", e.target.value)}
                placeholder="info@företag.se"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Momsregistreringsnummer"
                name="momsregistreringsnummer"
                type="text"
                value={foretagsProfil.momsregistreringsnummer}
                onChange={(e) => onChangeCompany("momsregistreringsnummer", e.target.value)}
                placeholder="SE556789123401"
                pattern="SE[0-9]{12}"
                maxLength={14}
              />
              <TextFalt
                label="Webbplats"
                name="webbplats"
                type="url"
                value={foretagsProfil.webbplats}
                onChange={(e) => onChangeCompany("webbplats", e.target.value)}
                placeholder="https://www.företag.se"
                maxLength={200}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Knapp
                text="💾 Spara"
                onClick={onSaveCompany}
                disabled={isSavingCompany}
                loading={isSavingCompany}
                loadingText="Sparar..."
              />
              <Knapp
                text="❌ Avbryt"
                onClick={onCancelCompany}
                disabled={isSavingCompany}
                className="bg-gray-600 hover:bg-gray-700"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Företagsnamn:</span>
                <span className="text-white ml-2">
                  {foretagsProfil.foretagsnamn || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Organisationsnummer:</span>
                <span className="text-white ml-2">
                  {foretagsProfil.organisationsnummer || "Ej angett"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Adress:</span>
              <span className="text-white ml-2">{foretagsProfil.adress || "Ej angett"}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Postnummer:</span>
                <span className="text-white ml-2">{foretagsProfil.postnummer || "Ej angett"}</span>
              </div>
              <div>
                <span className="text-gray-400">Stad:</span>
                <span className="text-white ml-2">{foretagsProfil.stad || "Ej angett"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Telefonnummer:</span>
                <span className="text-white ml-2">
                  {foretagsProfil.telefonnummer || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="text-white ml-2">{foretagsProfil.epost || "Ej angett"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Momsregistreringsnummer:</span>
                <span className="text-white ml-2">
                  {foretagsProfil.momsregistreringsnummer || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Webbplats:</span>
                <span className="text-white ml-2">{foretagsProfil.webbplats || "Ej angett"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

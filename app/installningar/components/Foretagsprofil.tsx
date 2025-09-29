"use client";

import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import type { ForetagsprofilProps } from "../types/types";

export default function Foretagsprofil({ company }: ForetagsprofilProps) {
  const { state, handlers } = company;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">🏢 Företagsprofil</h2>
        {!state.isEditingCompany && (
          <Knapp
            text="✏️ Redigera"
            onClick={handlers.onEditCompany}
            className="bg-blue-600 hover:bg-blue-700"
          />
        )}
      </div>

      {state.companyMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            state.companyMessage.type === "success"
              ? "bg-green-600/20 text-green-400"
              : "bg-red-600/20 text-red-400"
          }`}
        >
          {state.companyMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {state.isEditingCompany ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Företagsnamn"
                name="foretagsnamn"
                type="text"
                value={state.foretagsProfil.foretagsnamn}
                onChange={(e) => handlers.onChangeCompany("foretagsnamn", e.target.value)}
                placeholder="Företagsnamn AB"
                maxLength={100}
              />
              <TextFalt
                label="Organisationsnummer"
                name="organisationsnummer"
                type="text"
                value={state.foretagsProfil.organisationsnummer}
                onChange={(e) => handlers.onChangeCompany("organisationsnummer", e.target.value)}
                placeholder="556789-1234"
                pattern="[0-9]{6}-[0-9]{4}"
                maxLength={11}
              />
            </div>

            <TextFalt
              label="Adress"
              name="adress"
              type="text"
              value={state.foretagsProfil.adress}
              onChange={(e) => handlers.onChangeCompany("adress", e.target.value)}
              placeholder="Företagsgatan 123"
              maxLength={200}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Postnummer"
                name="postnummer"
                type="text"
                value={state.foretagsProfil.postnummer}
                onChange={(e) => handlers.onChangeCompany("postnummer", e.target.value)}
                placeholder="123 45"
                pattern="[0-9]{3} [0-9]{2}"
                maxLength={6}
              />
              <TextFalt
                label="Stad"
                name="stad"
                type="text"
                value={state.foretagsProfil.stad}
                onChange={(e) => handlers.onChangeCompany("stad", e.target.value)}
                placeholder="Stockholm"
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Telefonnummer"
                name="telefonnummer"
                type="tel"
                value={state.foretagsProfil.telefonnummer}
                onChange={(e) => handlers.onChangeCompany("telefonnummer", e.target.value)}
                placeholder="08-123 45 67"
                maxLength={20}
              />
              <TextFalt
                label="Email"
                name="epost"
                type="email"
                value={state.foretagsProfil.epost}
                onChange={(e) => handlers.onChangeCompany("epost", e.target.value)}
                placeholder="info@företag.se"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFalt
                label="Momsregistreringsnummer"
                name="momsregistreringsnummer"
                type="text"
                value={state.foretagsProfil.momsregistreringsnummer}
                onChange={(e) =>
                  handlers.onChangeCompany("momsregistreringsnummer", e.target.value)
                }
                placeholder="SE556789123401"
                pattern="SE[0-9]{12}"
                maxLength={14}
              />
              <TextFalt
                label="Webbplats"
                name="webbplats"
                type="url"
                value={state.foretagsProfil.webbplats}
                onChange={(e) => handlers.onChangeCompany("webbplats", e.target.value)}
                placeholder="https://www.företag.se"
                maxLength={200}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Knapp
                text="💾 Spara"
                onClick={handlers.onSaveCompany}
                disabled={state.isSavingCompany}
                loading={state.isSavingCompany}
                loadingText="Sparar..."
              />
              <Knapp
                text="❌ Avbryt"
                onClick={handlers.onCancelCompany}
                disabled={state.isSavingCompany}
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
                  {state.foretagsProfil.foretagsnamn || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Organisationsnummer:</span>
                <span className="text-white ml-2">
                  {state.foretagsProfil.organisationsnummer || "Ej angett"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Adress:</span>
              <span className="text-white ml-2">{state.foretagsProfil.adress || "Ej angett"}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Postnummer:</span>
                <span className="text-white ml-2">
                  {state.foretagsProfil.postnummer || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Stad:</span>
                <span className="text-white ml-2">{state.foretagsProfil.stad || "Ej angett"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Telefonnummer:</span>
                <span className="text-white ml-2">
                  {state.foretagsProfil.telefonnummer || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="text-white ml-2">{state.foretagsProfil.epost || "Ej angett"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Momsregistreringsnummer:</span>
                <span className="text-white ml-2">
                  {state.foretagsProfil.momsregistreringsnummer || "Ej angett"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Webbplats:</span>
                <span className="text-white ml-2">
                  {state.foretagsProfil.webbplats || "Ej angett"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

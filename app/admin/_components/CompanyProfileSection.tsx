"use client";

import Knapp from "../../_components/Knapp";
import type { ForetagsProfil } from "../_types/types";

interface MessageState {
  type: "success" | "error";
  text: string;
}

interface CompanyProfileSectionProps {
  foretagsProfil: ForetagsProfil;
  isEditingCompany: boolean;
  isSavingCompany: boolean;
  companyMessage: MessageState | null;
  handleEditCompany: () => void;
  handleCancelCompany: () => void;
  handleSaveCompany: () => void;
  handleCompanyInputChange: (field: keyof ForetagsProfil, value: string) => void;
}

export default function CompanyProfileSection({
  foretagsProfil,
  isEditingCompany,
  isSavingCompany,
  companyMessage,
  handleEditCompany,
  handleCancelCompany,
  handleSaveCompany,
  handleCompanyInputChange,
}: CompanyProfileSectionProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">🏢 Företagsprofil</h2>
        {!isEditingCompany && (
          <Knapp
            text="✏️ Redigera"
            onClick={handleEditCompany}
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
              <div>
                <label className="block text-gray-400 mb-2">Företagsnamn:</label>
                <input
                  type="text"
                  value={foretagsProfil.foretagsnamn}
                  onChange={(e) => handleCompanyInputChange("foretagsnamn", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Företagsnamn AB"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Organisationsnummer:</label>
                <input
                  type="text"
                  value={foretagsProfil.organisationsnummer}
                  onChange={(e) => handleCompanyInputChange("organisationsnummer", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="556789-1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Adress:</label>
              <input
                type="text"
                value={foretagsProfil.adress}
                onChange={(e) => handleCompanyInputChange("adress", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Företagsgatan 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Postnummer:</label>
                <input
                  type="text"
                  value={foretagsProfil.postnummer}
                  onChange={(e) => handleCompanyInputChange("postnummer", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="123 45"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Stad:</label>
                <input
                  type="text"
                  value={foretagsProfil.stad}
                  onChange={(e) => handleCompanyInputChange("stad", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Stockholm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Telefonnummer:</label>
                <input
                  type="text"
                  value={foretagsProfil.telefonnummer}
                  onChange={(e) => handleCompanyInputChange("telefonnummer", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="08-123 45 67"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Email:</label>
                <input
                  type="email"
                  value={foretagsProfil.epost}
                  onChange={(e) => handleCompanyInputChange("epost", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="info@företag.se"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Momsregistreringsnummer:</label>
                <input
                  type="text"
                  value={foretagsProfil.momsregistreringsnummer}
                  onChange={(e) =>
                    handleCompanyInputChange("momsregistreringsnummer", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="SE556789123401"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Webbplats:</label>
                <input
                  type="text"
                  value={foretagsProfil.webbplats}
                  onChange={(e) => handleCompanyInputChange("webbplats", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="https://www.företag.se"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Knapp
                text="💾 Spara"
                onClick={handleSaveCompany}
                disabled={isSavingCompany}
                loading={isSavingCompany}
                loadingText="Sparar..."
              />
              <Knapp
                text="❌ Avbryt"
                onClick={handleCancelCompany}
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

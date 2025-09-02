// 🎯 EXEMPEL: Admin Company Section Component
// Visar hur den nya hook-strukturen kan anvandas for foretagshantering

"use client";

import { useEffect } from "react";
import { useAdminForetagshantering } from "../_hooks/useAdminForetagshantering";

export default function AdminCompanySection() {
  const {
    foretagsProfil,
    isEditingCompany,
    isSavingCompany,
    isDeleting,
    showDeleteConfirm,
    companyMessage,
    handleEditCompany,
    handleCancelCompany,
    handleSaveCompany,
    handleDeleteCompany,
    updateCompanyField,
    setShowDeleteConfirm,
    clearCompanyMessage,
    fetchCompanyProfile,
  } = useAdminForetagshantering();

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">🏢 Foretagsprofil</h2>
        {!isEditingCompany && (
          <div className="flex gap-2">
            <button
              onClick={handleEditCompany}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            >
              ✏️ Redigera
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              🗑️ Radera
            </button>
          </div>
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
          <button onClick={clearCompanyMessage} className="ml-2 text-sm underline">
            Stang
          </button>
        </div>
      )}

      {isEditingCompany ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Foretagsnamn:</label>
              <input
                type="text"
                value={foretagsProfil.foretagsnamn}
                onChange={(e) => updateCompanyField("foretagsnamn", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Organisationsnummer:</label>
              <input
                type="text"
                value={foretagsProfil.organisationsnummer}
                onChange={(e) => updateCompanyField("organisationsnummer", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Adress:</label>
              <input
                type="text"
                value={foretagsProfil.adress}
                onChange={(e) => updateCompanyField("adress", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Telefonnummer:</label>
              <input
                type="text"
                value={foretagsProfil.telefonnummer}
                onChange={(e) => updateCompanyField("telefonnummer", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveCompany}
              disabled={isSavingCompany}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors"
            >
              {isSavingCompany ? "Sparar..." : "💾 Spara"}
            </button>
            <button
              onClick={handleCancelCompany}
              disabled={isSavingCompany}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
            >
              ❌ Avbryt
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-gray-400">Foretagsnamn:</span>
            <span className="text-white ml-2">{foretagsProfil.foretagsnamn || "Ej angivet"}</span>
          </div>
          <div>
            <span className="text-gray-400">Organisationsnummer:</span>
            <span className="text-white ml-2">
              {foretagsProfil.organisationsnummer || "Ej angivet"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Adress:</span>
            <span className="text-white ml-2">{foretagsProfil.adress || "Ej angivet"}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">⚠️ Bekrafta radering</h3>
            <p className="text-gray-300 mb-6">
              Detta kommer att radera ALLT foretags-data permanent. Denna atgard kan inte angras.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                disabled={isDeleting}
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteCompany}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "Raderar..." : "Ja, radera allt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

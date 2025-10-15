"use client";

import AnimeradFlik from "../../../../_components/AnimeradFlik";
import Knapp from "../../../../_components/Knapp";
import NyLeverantorModal from "./NyLeverantorModal";
import BekraftaBorttagnngModal from "./BekraftaBorttagnngModal";
import { LeverantorFlikProps } from "../../../types/types";
import { useLeverantorFlik, useLeverantorNavigation } from "../../../hooks/useLeverantorer";

export default function LeverantörFlik({ onLeverantörUpdated }: LeverantorFlikProps) {
  const {
    leverantörer,
    loading,
    showModal,
    editLeverantör,
    deleteModal,
    deleteLoading,
    handleLeverantörAdded,
    handleEditLeverantör,
    handleDeleteLeverantör,
    confirmDelete,
    handleModalClose,
    setShowModal,
    setDeleteModal,
  } = useLeverantorFlik({ onLeverantörUpdated });
  const { navigateToBokforing } = useLeverantorNavigation();

  return (
    <>
      <AnimeradFlik
        title="Leverantörer"
        icon="🏢"
        visaSummaDirekt={`${leverantörer.length} st`}
        forcedOpen={true}
      >
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <Knapp text="+ Lägg till leverantör" onClick={() => setShowModal(true)} />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Laddar leverantörer...</p>
            </div>
          ) : leverantörer.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-lg text-white mb-2">Inga leverantörer ännu</h3>
              <p className="text-gray-400 text-sm">
                Lägg till dina leverantörer för att enklare hantera inkommande fakturor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leverantörer.map((leverantör) => (
                <div
                  key={leverantör.id}
                  className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg">{leverantör.namn}</h4>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {leverantör.organisationsnummer && (
                          <div className="text-gray-300">
                            <span className="text-gray-400">Org-nr:</span>{" "}
                            {leverantör.organisationsnummer}
                          </div>
                        )}
                        {leverantör.email && (
                          <div className="text-gray-300">
                            <span className="text-gray-400">E-post:</span> {leverantör.email}
                          </div>
                        )}
                        {leverantör.telefon && (
                          <div className="text-gray-300">
                            <span className="text-gray-400">Telefon:</span> {leverantör.telefon}
                          </div>
                        )}
                        {leverantör.ort && (
                          <div className="text-gray-300">
                            <span className="text-gray-400">Ort:</span> {leverantör.ort}
                          </div>
                        )}
                      </div>

                      {leverantör.adress && (
                        <div className="mt-3 text-sm text-gray-300">
                          <span className="text-gray-400">Adress:</span> {leverantör.adress}
                          {leverantör.postnummer && `, ${leverantör.postnummer}`}
                          {leverantör.ort && ` ${leverantör.ort}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 ml-4 mt-4 sm:mt-0">
                      <Knapp
                        text="📄 Registrera faktura"
                        onClick={() =>
                          leverantör.id &&
                          navigateToBokforing({ leverantorId: leverantör.id, levfakt: true })
                        }
                        className="bg-emerald-800 hover:bg-emerald-700 text-sm px-2 py-1"
                      />
                      <Knapp
                        text="✏️ Redigera"
                        onClick={() => handleEditLeverantör(leverantör)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-sm px-2 py-1"
                      />
                      <Knapp
                        text="🗑️ Ta bort"
                        onClick={() => handleDeleteLeverantör(leverantör)}
                        className="bg-red-600 hover:bg-red-700 text-sm px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimeradFlik>

      <NyLeverantorModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSaved={handleLeverantörAdded}
        editLeverantör={editLeverantör}
      />

      <BekraftaBorttagnngModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false })}
        onConfirm={confirmDelete}
        leverantorNamn={deleteModal.leverantör?.namn || ""}
        loading={deleteLoading}
      />
    </>
  );
}

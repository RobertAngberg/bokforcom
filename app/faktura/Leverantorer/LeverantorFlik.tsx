"use client";

import { useState, useEffect } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import NyLeverantorModal from "./NyLeverantorModal";
import BekraftaBorttagnngModal from "./BekraftaBorttagnngModal";
import { getLeverantörer, deleteLeverantör, type Leverantör } from "../actions";

export default function LeverantörFlik() {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLeverantör, setEditLeverantör] = useState<Leverantör | undefined>();
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bokförModal, setBokförModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });

  const loadLeverantörer = async () => {
    setLoading(true);
    const result = await getLeverantörer();
    if (result.success) {
      setLeverantörer(result.leverantörer || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeverantörer();
  }, []);

  const handleLeverantörAdded = () => {
    loadLeverantörer();
  };

  const handleEditLeverantör = (leverantör: Leverantör) => {
    setEditLeverantör(leverantör);
    setShowModal(true);
  };

  const handleDeleteLeverantör = (leverantör: Leverantör) => {
    setDeleteModal({ show: true, leverantör });
  };

  const handleBokförLeverantör = (leverantör: Leverantör) => {
    setBokförModal({ show: true, leverantör });
  };

  const confirmDelete = async () => {
    if (!deleteModal.leverantör) return;

    setDeleteLoading(true);
    const result = await deleteLeverantör(deleteModal.leverantör.id!);

    if (result.success) {
      setDeleteModal({ show: false });
      loadLeverantörer();
    }
    setDeleteLoading(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditLeverantör(undefined);
  };

  return (
    <>
      <AnimeradFlik
        title="Leverantörer"
        icon="🏢"
        visaSummaDirekt={`${leverantörer.length} st`}
        forcedOpen={true}
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <Knapp text="+ Lägg till leverantör" onClick={() => setShowModal(true)} />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">⏳</div>
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
            <div className="space-y-2">
              {leverantörer.map((leverantör) => (
                <div
                  key={leverantör.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg">{leverantör.namn}</h4>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
                        <div className="mt-2 text-sm text-gray-300">
                          <span className="text-gray-400">Adress:</span> {leverantör.adress}
                          {leverantör.postnummer && `, ${leverantör.postnummer}`}
                          {leverantör.ort && ` ${leverantör.ort}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 ml-4">
                      <button
                        onClick={() => handleBokförLeverantör(leverantör)}
                        className="text-green-400 hover:text-green-300 text-sm px-2 py-1 rounded bg-green-900/20 hover:bg-green-900/30 transition-colors"
                      >
                        Bokför
                      </button>
                      <button
                        onClick={() => handleEditLeverantör(leverantör)}
                        className="text-cyan-400 hover:text-cyan-300 text-sm px-2 py-1 rounded"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDeleteLeverantör(leverantör)}
                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded"
                      >
                        Ta bort
                      </button>
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

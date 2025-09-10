"use client";

import React, { useState, useEffect } from "react";
import { formatSEK } from "../_utils/format";
import { stringTillDate } from "../_utils/datum";
import {
  hamtaBokfordaFakturor,
  hamtaTransaktionsposter,
  betalaOchBokförLeverantörsfaktura,
} from "./actions";
import VerifikatModal from "./VerifikatModal";
import Knapp from "../_components/Knapp";
import Toast from "../_components/Toast";
import Modal from "../_components/Modal";
import Tabell, { ColumnDefinition } from "../_components/Tabell";

type BokfordFaktura = {
  id: number; // leverantörsfaktura.id
  transaktionId?: number; // transaktion.id för verifikat
  datum: string | Date;
  belopp: number;
  kommentar: string;
  leverantör?: string;
  fakturanummer?: string;
  fakturadatum?: string;
  förfallodatum?: string;
  betaldatum?: string;
  status_betalning?: string;
  status_bokförd?: string;
};

export default function BokfordaFakturor() {
  // Hjälpfunktion för att säkert formatera datum
  const formateraDatum = (datum: string | Date): string => {
    if (typeof datum === "string") {
      const dateObj = stringTillDate(datum);
      return dateObj ? dateObj.toLocaleDateString("sv-SE") : datum;
    }
    return datum.toLocaleDateString("sv-SE");
  };

  // Kolumndefinitioner för transaktionsposter tabellen
  const transaktionskolumner: ColumnDefinition<any>[] = [
    {
      key: "konto",
      label: "Konto",
      render: (_, post) => (
        <div>
          <div className="font-medium text-white">{post.kontonummer}</div>
          <div className="text-sm text-gray-400">{post.kontobeskrivning}</div>
        </div>
      ),
    },
    {
      key: "debet",
      label: "Debet",
      render: (_, post) => (
        <div className="text-right text-white">{post.debet > 0 ? formatSEK(post.debet) : "—"}</div>
      ),
      className: "text-right",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (_, post) => (
        <div className="text-right text-white">
          {post.kredit > 0 ? formatSEK(post.kredit) : "—"}
        </div>
      ),
      className: "text-right",
    },
  ];

  const [fakturor, setFakturor] = useState<BokfordFaktura[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifikatModal, setVerifikatModal] = useState<{
    isOpen: boolean;
    transaktionId: number;
    fakturanummer?: string;
    leverantör?: string;
  }>({
    isOpen: false,
    transaktionId: 0,
  });
  const [toast, setToast] = useState({
    message: "",
    type: "error" as "success" | "error" | "info",
    isVisible: false,
  });
  const [bekraftelseModal, setBekraftelseModal] = useState<{
    isOpen: boolean;
    faktura: BokfordFaktura | null;
    transaktionsposter: any[];
    loadingPoster: boolean;
  }>({
    isOpen: false,
    faktura: null,
    transaktionsposter: [],
    loadingPoster: false,
  });

  useEffect(() => {
    async function hamtaFakturor() {
      try {
        const result = await hamtaBokfordaFakturor();
        if (result.success && result.fakturor) {
          setFakturor(result.fakturor);
        }
      } catch (error) {
        console.error("Fel vid hämtning av bokförda fakturor:", error);
      } finally {
        setLoading(false);
      }
    }

    hamtaFakturor();
  }, []);

  const öppnaVerifikat = (faktura: BokfordFaktura) => {
    setVerifikatModal({
      isOpen: true,
      transaktionId: faktura.transaktionId || faktura.id,
      fakturanummer: faktura.fakturanummer,
      leverantör: faktura.leverantör,
    });
  };

  const stängVerifikat = () => {
    setVerifikatModal({
      isOpen: false,
      transaktionId: 0,
    });
  };

  const handleBetalaOchBokför = async (faktura: BokfordFaktura) => {
    setBekraftelseModal({
      isOpen: true,
      faktura: faktura,
      transaktionsposter: [],
      loadingPoster: true,
    });

    // Hämta transaktionsposter för att visa debet/kredit
    if (faktura.transaktionId) {
      try {
        const result = await hamtaTransaktionsposter(faktura.transaktionId);
        if (result.success && result.poster) {
          setBekraftelseModal((prev) => ({
            ...prev,
            transaktionsposter: result.poster,
            loadingPoster: false,
          }));
        } else {
          setBekraftelseModal((prev) => ({
            ...prev,
            loadingPoster: false,
          }));
        }
      } catch (error) {
        console.error("Fel vid hämtning av transaktionsposter:", error);
        setBekraftelseModal((prev) => ({
          ...prev,
          loadingPoster: false,
        }));
      }
    } else {
      setBekraftelseModal((prev) => ({
        ...prev,
        loadingPoster: false,
      }));
    }
  };

  const stängBekraftelseModal = () => {
    setBekraftelseModal({
      isOpen: false,
      faktura: null,
      transaktionsposter: [],
      loadingPoster: false,
    });
  };

  const utförBokföring = async (faktura: BokfordFaktura) => {
    try {
      const result = await betalaOchBokförLeverantörsfaktura(faktura.id, faktura.belopp);

      if (result.success) {
        setToast({
          message: "Leverantörsfaktura bokförd!",
          type: "success",
          isVisible: true,
        });
        // Ladda om data för att visa uppdaterad status
        const updatedData = await hamtaBokfordaFakturor();
        if (updatedData.success) {
          setFakturor(updatedData.fakturor || []);
        }
      } else {
        setToast({
          message: `Fel vid bokföring: ${result.error}`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      setToast({
        message: "Ett fel uppstod vid bokföring",
        type: "error",
        isVisible: true,
      });
    }
    // Stäng modalen
    stängBekraftelseModal();
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Leverantörsfakturor</h2>
        <p className="text-gray-400">Laddar...</p>
      </div>
    );
  }

  if (fakturor.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Leverantörsfakturor</h2>
        <p className="text-gray-400">Inga leverantörsfakturor hittades.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <h2 className="text-xl font-semibold text-white mb-4">
        Leverantörsfakturor ({fakturor.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-300 pb-2">Datum</th>
              <th className="text-left text-gray-300 pb-2">Leverantör/Kund</th>
              <th className="text-left text-gray-300 pb-2">Fakturanr</th>
              <th className="text-left text-gray-300 pb-2">Belopp</th>
              <th className="text-left text-gray-300 pb-2">Status</th>
              <th className="text-left text-gray-300 pb-2">Kommentar</th>
              <th className="text-center text-gray-300 pb-2">Verifikat</th>
              <th className="text-center text-gray-300 pb-2">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {fakturor.map((faktura) => (
              <tr key={faktura.id} className="border-b border-gray-800">
                <td className="py-2 text-white">{formateraDatum(faktura.datum)}</td>
                <td className="py-2 text-gray-300">{faktura.leverantör || "-"}</td>
                <td className="py-2 text-gray-300">{faktura.fakturanummer || "-"}</td>
                <td className="py-2 text-white">{formatSEK(faktura.belopp)}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      faktura.status_bokförd === "Bokförd"
                        ? "bg-green-900 text-green-200"
                        : "bg-yellow-900 text-yellow-200"
                    }`}
                  >
                    {faktura.status_bokförd === "Bokförd" ? "Bokförd" : "Ej bokförd"}
                  </span>
                </td>
                <td className="py-2 text-gray-300 max-w-xs truncate">{faktura.kommentar}</td>
                <td className="py-2 text-center">
                  <Knapp
                    text="📄 Verifikat"
                    onClick={() => öppnaVerifikat(faktura)}
                    className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1"
                  />
                </td>
                <td className="py-2 text-center">
                  <div className="flex flex-col gap-1">
                    {faktura.status_bokförd !== "Bokförd" && (
                      <Knapp
                        text="Bokför"
                        onClick={() => handleBetalaOchBokför(faktura)}
                        className="bg-green-700 hover:bg-green-600 text-xs px-3 py-1"
                      />
                    )}
                    {faktura.status_bokförd === "Bokförd" && (
                      <span className="text-gray-500 text-xs">Bokförd</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verifikat Modal */}
      <VerifikatModal
        isOpen={verifikatModal.isOpen}
        onClose={stängVerifikat}
        transaktionId={verifikatModal.transaktionId}
        fakturanummer={verifikatModal.fakturanummer}
        leverantör={verifikatModal.leverantör}
      />

      {/* Bekräftelse Modal för Bokföring */}
      <Modal
        isOpen={bekraftelseModal.isOpen}
        onClose={stängBekraftelseModal}
        title="Bekräfta bokföring"
        maxWidth="lg"
      >
        {bekraftelseModal.faktura && (
          <div className="space-y-4">
            <div className="text-gray-300">
              <p className="mb-4">Du är på väg att bokföra följande leverantörsfaktura:</p>

              {/* Transaktionsposter - Debet/Kredit */}
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Bokföringsposter:</h4>
                {bekraftelseModal.loadingPoster ? (
                  <div className="text-gray-400 text-center py-4">Laddar bokföringsposter...</div>
                ) : bekraftelseModal.transaktionsposter.length > 0 ? (
                  <Tabell
                    data={bekraftelseModal.transaktionsposter}
                    columns={transaktionskolumner}
                    getRowId={(post) => post.id || Math.random()}
                  />
                ) : (
                  <div className="text-gray-400 text-center py-4">
                    Inga bokföringsposter hittades.
                  </div>
                )}
              </div>

              <p className="mt-4 text-yellow-400">
                ⚠️ Denna åtgärd kommer att bokföra fakturan. Är du säker på att du vill fortsätta?
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Knapp
                text="Avbryt"
                onClick={stängBekraftelseModal}
                className="bg-gray-600 hover:bg-gray-500 px-6 py-2"
              />
              <Knapp
                text="Ja, bokför"
                onClick={() => utförBokföring(bekraftelseModal.faktura!)}
                className="bg-green-700 hover:bg-green-600 px-6 py-2"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Toast meddelanden */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

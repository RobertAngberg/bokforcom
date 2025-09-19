"use client";

import React from "react";
import Modal from "../../_components/Modal";
import Tabell from "../../_components/Tabell";
import { formatSEK } from "../../_utils/format";
import { VerifikatModalProps } from "../_types/types";
import { useVerifikatModal } from "../_hooks/useLeverantorer";

export default function VerifikatModal({
  isOpen,
  onClose,
  transaktionId,
  fakturanummer,
  leverantör,
}: VerifikatModalProps) {
  const {
    // State
    poster,
    loading,

    // Computed data
    columns: baseColumns,
    totalDebet,
    totalKredit,
    modalTitle,
    headerTitle,
  } = useVerifikatModal({
    isOpen,
    transaktionId,
    fakturanummer,
    leverantör,
  });

  // Enhanced columns with JSX render functions
  const columns = [
    {
      key: "kontonummer",
      label: "Konto",
      render: (value: any, post: any) => (
        <div>
          <div className="font-medium text-white">{post.kontonummer}</div>
          <div className="text-sm text-gray-400">{post.kontobeskrivning}</div>
        </div>
      ),
    },
    {
      key: "debet",
      label: "Debet",
      render: (value: any, post: any) => (
        <div className="text-right text-white">{post.debet > 0 ? formatSEK(post.debet) : "-"}</div>
      ),
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value: any, post: any) => (
        <div className="text-right text-white">
          {post.kredit > 0 ? formatSEK(post.kredit) : "-"}
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="4xl" isLoading={loading}>
      {/* Egen titel-header */}
      <div className="text-center mb-4">
        <h2 className="text-white text-2xl">{headerTitle}</h2>
      </div>

      <div className="space-y-4">
        {/* Fakturainfo */}
        {poster.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-center">
              <div>
                <span className="text-gray-400">Datum:</span>
                <span className="ml-2 text-white">
                  {new Date(poster[0].transaktionsdatum).toLocaleDateString("sv-SE")}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Kommentar:</span>
                <span className="ml-2 text-white">{poster[0].transaktionskommentar || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transaktionsposter */}
        {poster.length > 0 ? (
          <div>
            <Tabell data={poster} columns={columns} getRowId={(post) => post.id} />

            {/* Summor */}
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">Totaler:</span>
                <div className="flex gap-8">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Debet</div>
                    <div className="font-medium text-white">{formatSEK(totalDebet)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Kredit</div>
                    <div className="font-medium text-white">{formatSEK(totalKredit)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Inga transaktionsposter hittades.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

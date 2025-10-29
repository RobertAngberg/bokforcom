"use client";

import Tabell from "../../_components/Tabell";
import { ColumnDefinition } from "../../_components/TabellRad";
import { HistoryItem, TransactionDetail, HistorikProps } from "../types/types";
import { useHistorik } from "../hooks/useHistorik";
import Dropdown from "../../_components/Dropdown";
import Knapp from "../../_components/Knapp";
import Modal from "../../_components/Modal";
import TextFalt from "../../_components/TextFalt";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);

export default function Historik({ initialData }: HistorikProps) {
  const {
    // State
    year,
    month,
    searchTerm,
    validationError,
    loading,
    activeIds,
    deletingIds,
    showDeleteModal,
    fakturaStatusMap,
    showBetalningModal,
    betalningDatum,
    registeringPayment,

    // Computed values
    filteredData,
    detailsMap,
    columns,

    // Handlers
    handleYearChange,
    handleMonthChange,
    handleSearchChange,
    handleRowClick,
    handleDelete,
    confirmDelete,
    handleRegistreraBetalning,
    confirmBetalning,

    // Setters
    setShowDeleteModal,
    setShowBetalningModal,
    setBetalningDatum,
  } = useHistorik(initialData);

  if (loading) {
    return (
      <div className="text-center">
        <h1 className="text-3xl mb-8">Historik</h1>
        <div>Laddar...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl text-center">Historik</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Dropdown
              className="w-full sm:w-32"
              value={year}
              onChange={handleYearChange}
              placeholder="År"
              options={[
                { label: "2025", value: "2025" },
                { label: "2024", value: "2024" },
                { label: "2023", value: "2023" },
                { label: "2022", value: "2022" },
                { label: "2021", value: "2021" },
                { label: "2020", value: "2020" },
              ]}
            />
            <Dropdown
              className="w-full sm:w-40"
              value={month}
              onChange={handleMonthChange}
              placeholder="Månad"
              options={[
                { label: "Alla", value: "" },
                { label: "Jan", value: "01" },
                { label: "Feb", value: "02" },
                { label: "Mar", value: "03" },
                { label: "Apr", value: "04" },
                { label: "Maj", value: "05" },
                { label: "Jun", value: "06" },
                { label: "Jul", value: "07" },
                { label: "Aug", value: "08" },
                { label: "Sep", value: "09" },
                { label: "Okt", value: "10" },
                { label: "Nov", value: "11" },
                { label: "Dec", value: "12" },
              ]}
            />
          </div>
          <div className="w-full sm:w-48 sm:max-w-xs sm:ml-auto">
            <TextFalt
              label=""
              name="search"
              type="text"
              placeholder="🔍 Sök..."
              value={searchTerm}
              onChange={handleSearchChange}
              required={false}
              className="!mb-0"
            />
          </div>
        </div>

        {validationError && (
          <div className="text-red-500 text-sm text-center mb-4">{validationError}</div>
        )}
      </div>

      <Tabell
        data={filteredData}
        columns={columns}
        getRowId={(item: HistoryItem) => item.transaktions_id}
        activeIds={activeIds}
        handleRowClick={handleRowClick}
        renderExpandedRow={(item: HistoryItem) => {
          const rows = detailsMap[item.transaktions_id] ?? [];
          if (rows.length === 0) return null;

          // Kolumndefinitioner för expanderad tabell
          const detailColumns: ColumnDefinition<TransactionDetail>[] = [
            {
              key: "kontonummer",
              label: "Konto",
              render: (_, detail) => (
                <>
                  <span className="text-sm">{detail.kontonummer}</span> – {detail.beskrivning}
                </>
              ),
            },
            {
              key: "debet",
              label: "Debet",
              render: (value: unknown) =>
                typeof value === "number" && value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
            {
              key: "kredit",
              label: "Kredit",
              render: (value: unknown) =>
                typeof value === "number" && value > 0
                  ? value.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + " kr"
                  : "—",
              className: "text-right",
            },
          ];

          return (
            <tr className="bg-gray-800">
              <td colSpan={5} className="p-0">
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-300">
                    📋 {item.kontobeskrivning.replace("Verifikation ", "")}
                  </h4>

                  <Tabell
                    data={rows}
                    columns={detailColumns}
                    getRowId={(detail) => detail.transaktionspost_id}
                  />

                  <div className="pt-4 flex gap-2">
                    {item.blob_url && (
                      <Knapp
                        text="👁️ Se verifikat"
                        onClick={() => window.open(item.blob_url, "_blank")}
                      />
                    )}
                    {fakturaStatusMap[item.transaktions_id]?.ärFaktura &&
                      !fakturaStatusMap[item.transaktions_id]?.ärBetald && (
                        <Knapp
                          text="💳 Registrera betalning"
                          onClick={() => handleRegistreraBetalning(item.transaktions_id)}
                        />
                      )}
                    <Knapp
                      text={
                        deletingIds.includes(item.transaktions_id) ? "Tar bort..." : "🗑️ Ta bort"
                      }
                      onClick={() => handleDelete(item.transaktions_id)}
                      disabled={deletingIds.includes(item.transaktions_id)}
                    />
                  </div>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="🗑️ Bekräfta borttagning"
        maxWidth="md"
      >
        <div className="text-center space-y-4">
          <p className="text-slate-300">Är du säker på att du vill ta bort denna transaktion?</p>
          <p className="text-red-400 font-medium">Detta kan inte ångras!</p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              🗑️ Ta bort
            </button>
          </div>
        </div>
      </Modal>

      {/* Betalning Modal */}
      <Modal
        isOpen={showBetalningModal}
        onClose={() => setShowBetalningModal(false)}
        title="💳 Registrera betalning"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Välj datum när betalningen kom in. Ett nytt verifikat kommer att skapas som bokför
            betalningen från kund.
          </p>

          <div>
            <label className="block mb-2 text-white">Betaldatum:</label>
            <DatePicker
              className="w-full p-2 rounded text-white bg-slate-900 border border-gray-700"
              selected={betalningDatum}
              onChange={(date) => setBetalningDatum(date || new Date())}
              dateFormat="yyyy-MM-dd"
              locale="sv"
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setShowBetalningModal(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors"
              disabled={registeringPayment}
            >
              Avbryt
            </button>
            <button
              onClick={confirmBetalning}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors disabled:opacity-50"
              disabled={registeringPayment}
            >
              {registeringPayment ? "Registrerar..." : "💳 Registrera betalning"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

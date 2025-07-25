"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Dropdown from "../../../_components/Dropdown";
import { hämtaBetaldaSemesterdagar } from "../../actions";

interface Field {
  label: string;
  name: string;
  type: "text" | "number" | "select";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  hidden?: boolean;
  options?: string[]; // För dropdown
}

interface ExtraraderModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  fields: Field[];
  onSubmit: (e: React.FormEvent) => void;
  anstalldId?: number;
}

export default function ExtraraderModal({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  anstalldId,
}: ExtraraderModalProps) {
  const [betaldaDagar, setBetaldaDagar] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [semesterDagar, setSemesterDagar] = useState<number>(0);

  // Beräkna antal arbetsdagar mellan två datum (exklusive helger) - INKLUSIVT start och slut
  const beräknaArbetsdagar = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Inte söndag (0) eller lördag (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  // Uppdatera antal semesterdagar när datum ändras
  useEffect(() => {
    if (startDate && endDate && title === "Betald semester") {
      const dagar = beräknaArbetsdagar(startDate, endDate);
      console.log("🗓️ Datum ändrat:", {
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
        beräknadeDagar: dagar,
      });
      setSemesterDagar(dagar);

      // Uppdatera det motsvarande fältet automatiskt
      const antalField = fields.find((field) => field.name === "kolumn2");
      if (antalField) {
        console.log("🔄 Uppdaterar kolumn2 fält med:", dagar);
        antalField.onChange({
          target: { value: dagar.toString() },
        } as React.ChangeEvent<HTMLInputElement>);
      } else {
        console.log("❌ Hittade inte kolumn2 fält");
      }
    }
  }, [startDate, endDate, title]); // Ta bort 'fields' från dependencies

  useEffect(() => {
    if (open && title === "Betald semester" && anstalldId) {
      hämtaBetaldaSemesterdagar(anstalldId).then(setBetaldaDagar);
    }

    // Rensa state när modalen stängs
    if (!open) {
      setStartDate(null);
      setEndDate(null);
      setSemesterDagar(0);
    }
  }, [open, title, anstalldId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 cursor-pointer" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>

        {title === "Betald semester" && (
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              Tillgängliga betalda semesterdagar:{" "}
              <span className="text-white font-semibold">{betaldaDagar}</span>
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {title === "Betald semester" ? (
            // Specialhantering för Betald semester med datepicker
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Från datum *
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Välj startdatum"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Till datum *
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Välj slutdatum"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Antal arbetsdagar
                </label>
                <input
                  type="number"
                  value={semesterDagar}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white cursor-not-allowed"
                />
              </div>

              {/* Visa övriga fält förutom "antal"-fältet */}
              {fields
                .filter((field) => !field.hidden && field.name !== "kolumn2")
                .map((field) => (
                  <div key={field.name}>
                    {field.type === "select" ? (
                      <Dropdown
                        label={field.label + (field.required ? " *" : "")}
                        value={field.value}
                        options={
                          field.options?.map((opt) => ({
                            label: opt,
                            value: opt,
                          })) || []
                        }
                        onChange={(value) => {
                          const syntheticEvent = {
                            target: { value },
                          } as React.ChangeEvent<HTMLSelectElement>;
                          field.onChange(syntheticEvent);
                        }}
                      />
                    ) : (
                      <>
                        <label
                          htmlFor={field.name}
                          className="block text-sm font-medium text-slate-200 mb-1"
                        >
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type}
                          id={field.name}
                          name={field.name}
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                          }}
                          required={field.required}
                          placeholder={field.placeholder}
                          step={field.step}
                          min={field.min}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </>
                    )}
                  </div>
                ))}
            </>
          ) : (
            // Vanlig hantering för alla andra extrarader
            fields
              .filter((field) => !field.hidden)
              .map((field) => (
                <div key={field.name}>
                  {field.type === "select" ? (
                    <Dropdown
                      label={field.label + (field.required ? " *" : "")}
                      value={field.value}
                      options={
                        field.options?.map((opt) => ({
                          label: opt,
                          value: opt,
                        })) || []
                      }
                      onChange={(value) => {
                        // Simulera en select change event
                        const syntheticEvent = {
                          target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>;
                        field.onChange(syntheticEvent);
                      }}
                    />
                  ) : (
                    <>
                      <label
                        htmlFor={field.name}
                        className="block text-sm font-medium text-slate-200 mb-1"
                      >
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                        required={field.required}
                        placeholder={field.placeholder}
                        step={field.step}
                        min={field.min}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </>
                  )}
                </div>
              ))
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              Spara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

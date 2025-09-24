"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Dropdown from "../../../../../_components/Dropdown";
import Modal from "../../../../../_components/Modal";
import { useLonespec } from "../../../../hooks/useLonespecar";
import type { ExtraraderModalProps } from "../../../../types/types";

interface FormField {
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hidden?: boolean;
  type?: string;
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  step?: string;
  min?: string;
}

export default function ExtraraderModal({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  anstalldId,
}: ExtraraderModalProps) {
  const {
    betaldaDagar,
    startDate,
    endDate,
    semesterDagar,
    handleStartDateChange,
    handleEndDateChange,
    createSyntheticEvent,
    getFilteredFields,
    isBetaldSemester,
  } = useLonespec({
    enableExtraraderModal: true,
    extraraderModalOpen: open,
    extraraderModalTitle: title,
    extraraderFields: fields,
    anställdId: anstalldId,
  });

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title || ""}
      maxWidth="2xl"
      containerClassName="!max-w-sm w-full"
    >
      {isBetaldSemester && (
        <div className="mb-4">
          <p className="text-sm text-gray-300">
            Tillgängliga betalda semesterdagar:{" "}
            <span className="text-white font-semibold">{betaldaDagar}</span>
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {isBetaldSemester ? (
          // Specialhantering för Betald semester med datepicker
          <>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Från datum *</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => handleStartDateChange?.(date)}
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
              <label className="block text-sm font-medium text-slate-200 mb-1">Till datum *</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => handleEndDateChange?.(date)}
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
            {getFilteredFields?.(false)?.map((field: FormField) => (
              <div key={field.name}>
                {field.type === "select" ? (
                  <Dropdown
                    label={field.label + (field.required ? " *" : "")}
                    value={field.value}
                    options={
                      field.options?.map((opt: string) => ({
                        label: opt,
                        value: opt,
                      })) || []
                    }
                    onChange={(value) => {
                      if (field.onChange && createSyntheticEvent) {
                        field.onChange(createSyntheticEvent(value));
                      }
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
          getFilteredFields?.()?.map((field: FormField) => (
            <div key={field.name}>
              {field.type === "select" ? (
                <Dropdown
                  label={field.label + (field.required ? " *" : "")}
                  value={field.value}
                  options={
                    field.options?.map((opt: string) => ({
                      label: opt,
                      value: opt,
                    })) || []
                  }
                  onChange={(value) => {
                    if (field.onChange && createSyntheticEvent) {
                      field.onChange(createSyntheticEvent(value));
                    }
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
    </Modal>
  );
}

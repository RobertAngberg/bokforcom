"use client";

import Dropdown from "../../../_components/Dropdown";

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
}

export default function ExtraraderModal({
  open,
  onClose,
  title,
  fields,
  onSubmit,
}: ExtraraderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 cursor-pointer" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          {fields
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
            ))}

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

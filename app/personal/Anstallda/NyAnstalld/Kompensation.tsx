"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TextFalt from "../../../_components/TextFalt";
import Dropdown from "../../../_components/Dropdown";
import { useNyAnstalld } from "../../_hooks/useNyAnstalld";

export default function Kompensation() {
  const {
    state: { nyAnställdFormulär },
    actions: { updateNyAnställdFormulär },
  } = useNyAnstalld();

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Kompensation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Startdatum</label>
          <DatePicker
            selected={nyAnställdFormulär.startdatum}
            onChange={(date) => updateNyAnställdFormulär({ startdatum: date || undefined })}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Förnya kontrakt</label>
          <DatePicker
            selected={nyAnställdFormulär.slutdatum}
            onChange={(date) => updateNyAnställdFormulär({ slutdatum: date || undefined })}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <Dropdown
          label="Anställningstyp"
          value={nyAnställdFormulär.anställningstyp}
          onChange={(value) => updateNyAnställdFormulär({ anställningstyp: value })}
          options={[
            { value: "", label: "Välj anställningstyp" },
            { value: "Tillsvidare", label: "Tillsvidare" },
            { value: "Visstid", label: "Visstid" },
            { value: "Provanställning", label: "Provanställning" },
            { value: "Säsongsanställning", label: "Säsongsanställning" },
            { value: "Månadslön", label: "Månadslön" },
          ]}
        />

        <Dropdown
          label="Löneperiod"
          value={nyAnställdFormulär.löneperiod}
          onChange={(value) => updateNyAnställdFormulär({ löneperiod: value })}
          options={[
            { value: "", label: "Välj löneperiod" },
            { value: "Månadsvis", label: "Månadsvis" },
            { value: "Veckovis", label: "Veckovis" },
            { value: "14 dagar", label: "14 dagar" },
          ]}
        />

        <Dropdown
          label="Ersättning per"
          value={nyAnställdFormulär.ersättningPer}
          onChange={(value) => updateNyAnställdFormulär({ ersättningPer: value })}
          options={[
            { value: "", label: "Välj period" },
            { value: "Månad", label: "Månad" },
            { value: "Timme", label: "Timme" },
            { value: "Dag", label: "Dag" },
            { value: "Vecka", label: "Vecka" },
            { value: "År", label: "År" },
          ]}
        />

        <TextFalt
          label="Kompensation (kr)"
          name="kompensation"
          type="number"
          value={nyAnställdFormulär.kompensation}
          onChange={(e) => updateNyAnställdFormulär({ kompensation: e.target.value })}
        />

        <TextFalt
          label="Arbetsvecka (timmar)"
          name="arbetsvecka"
          type="number"
          value={nyAnställdFormulär.arbetsvecka}
          onChange={(e) => updateNyAnställdFormulär({ arbetsvecka: e.target.value })}
        />

        <Dropdown
          label="Arbetsbelastning"
          value={nyAnställdFormulär.arbetsbelastning}
          onChange={(value) => updateNyAnställdFormulär({ arbetsbelastning: value })}
          options={[
            { value: "", label: "Välj arbetsbelastning" },
            { value: "Heltid", label: "Heltid" },
            { value: "Deltid", label: "Deltid" },
          ]}
        />

        {/* Visa Deltid (%) endast om Deltid är valt */}
        {nyAnställdFormulär.arbetsbelastning === "Deltid" && (
          <TextFalt
            label="Deltid (%)"
            name="deltidProcent"
            type="number"
            value={nyAnställdFormulär.deltidProcent}
            onChange={(e) => updateNyAnställdFormulär({ deltidProcent: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

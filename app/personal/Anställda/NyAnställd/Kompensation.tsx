"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TextFält from "../../../_components/TextFält";
import Dropdown from "../../../_components/Dropdown";

interface KompensationProps {
  startdatum: Date;
  setStartdatum: (date: Date) => void;
  slutdatum: Date;
  setSlutdatum: (date: Date) => void;
  anställningstyp: string;
  setAnställningstyp: (value: string) => void;
  löneperiod: string;
  setLöneperiod: (value: string) => void;
  ersättningPer: string;
  setErsättningPer: (value: string) => void;
  kompensation: string;
  setKompensation: (value: string) => void;
  arbetsvecka: string;
  setArbetsvecka: (value: string) => void;
  arbetsbelastning: string;
  setArbetsbelastning: (value: string) => void;
  deltidProcent: string;
  SetDeltidProcent: (value: string) => void;
}

export default function Kompensation({
  startdatum,
  setStartdatum,
  slutdatum,
  setSlutdatum,
  anställningstyp,
  setAnställningstyp,
  löneperiod,
  setLöneperiod,
  ersättningPer,
  setErsättningPer,
  kompensation,
  setKompensation,
  arbetsvecka,
  setArbetsvecka,
  arbetsbelastning,
  setArbetsbelastning,
  deltidProcent,
  SetDeltidProcent,
}: KompensationProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Kompensation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Startdatum</label>
          <DatePicker
            selected={startdatum}
            onChange={(date) => date && setStartdatum(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Förnya kontrakt</label>
          <DatePicker
            selected={slutdatum}
            onChange={(date) => date && setSlutdatum(date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <Dropdown
          label="Anställningstyp"
          value={anställningstyp}
          onChange={setAnställningstyp}
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
          value={löneperiod}
          onChange={setLöneperiod}
          options={[
            { value: "", label: "Välj löneperiod" },
            { value: "Månadsvis", label: "Månadsvis" },
            { value: "Veckovis", label: "Veckovis" },
            { value: "14 dagar", label: "14 dagar" },
          ]}
        />

        <Dropdown
          label="Ersättning per"
          value={ersättningPer}
          onChange={setErsättningPer}
          options={[
            { value: "", label: "Välj period" },
            { value: "Månad", label: "Månad" },
            { value: "Timme", label: "Timme" },
            { value: "Dag", label: "Dag" },
            { value: "Vecka", label: "Vecka" },
            { value: "År", label: "År" },
          ]}
        />

        <TextFält
          label="Kompensation (kr)"
          name="kompensation"
          type="number"
          value={kompensation}
          onChange={(e) => setKompensation(e.target.value)}
        />

        <TextFält
          label="Arbetsvecka (timmar)"
          name="arbetsvecka"
          type="number"
          value={arbetsvecka}
          onChange={(e) => setArbetsvecka(e.target.value)}
        />

        <Dropdown
          label="Arbetsbelastning"
          value={arbetsbelastning}
          onChange={setArbetsbelastning}
          options={[
            { value: "", label: "Välj arbetsbelastning" },
            { value: "Heltid", label: "Heltid" },
            { value: "Deltid", label: "Deltid" },
          ]}
        />

        {/* Visa Deltid (%) endast om Deltid är valt */}
        {arbetsbelastning === "Deltid" && (
          <TextFält
            label="Deltid (%)"
            name="deltidProcent"
            type="number"
            value={deltidProcent}
            onChange={(e) => SetDeltidProcent(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

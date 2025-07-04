"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface LönedatumProps {
  utbetalningsdatum: Date | null;
  setUtbetalningsdatum: (date: Date | null) => void;
}

export default function Lönedatum({ utbetalningsdatum, setUtbetalningsdatum }: LönedatumProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <h2 className="text-white font-medium">Välj utbetalningsdatum:</h2>
      <DatePicker
        selected={utbetalningsdatum}
        onChange={(date) => setUtbetalningsdatum(date)}
        dateFormat="yyyy-MM-dd"
        className="w-full max-w-xs px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-center"
        placeholderText="Välj utbetalningsdatum"
      />
    </div>
  );
}

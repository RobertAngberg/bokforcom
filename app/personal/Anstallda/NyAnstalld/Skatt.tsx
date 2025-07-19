"use client";

import Dropdown from "../../../_components/Dropdown";

interface SkattProps {
  skattetabell: string;
  setSkattetabell: (value: string) => void;
  skattekolumn: string;
  setSkattekolumn: (value: string) => void;
}

export default function Skatt({
  skattetabell,
  setSkattetabell,
  skattekolumn,
  setSkattekolumn,
}: SkattProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Skatt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Dropdown
          label="Skattetabell"
          value={skattetabell}
          onChange={setSkattetabell}
          options={[
            { value: "", label: "Välj skattetabell" },
            ...Array.from({ length: 14 }, (_, i) => {
              const table = (29 + i).toString();
              return { value: table, label: `Tabell ${table}` };
            }),
          ]}
        />

        <Dropdown
          label="Skattekolumn"
          value={skattekolumn}
          onChange={setSkattekolumn}
          options={[
            { value: "", label: "Välj skattekolumn" },
            ...Array.from({ length: 6 }, (_, i) => {
              const column = (1 + i).toString();
              return { value: column, label: `Kolumn ${column}` };
            }),
          ]}
        />
      </div>
    </div>
  );
}

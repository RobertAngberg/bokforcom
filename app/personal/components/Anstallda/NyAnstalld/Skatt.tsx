"use client";

import Dropdown from "../../../../_components/Dropdown";
import { useNyAnstalld } from "../../../hooks/useNyAnstalld";

export default function Skatt() {
  const {
    state: { nyAnställdFormulär },
    actions: { updateNyAnställdFormulär },
  } = useNyAnstalld();

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Skatt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Dropdown
          label="Skattetabell"
          value={nyAnställdFormulär.skattetabell || ""}
          onChange={(value) => updateNyAnställdFormulär({ skattetabell: value })}
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
          value={nyAnställdFormulär.skattekolumn || ""}
          onChange={(value) => updateNyAnställdFormulär({ skattekolumn: value })}
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

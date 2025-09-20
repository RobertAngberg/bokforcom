"use client";

import Tabell from "../../_components/Tabell";
import UtlaggBokforModal from "./UtlaggBokforModal";

interface UtlaggFlikProps {
  state: any;
  handlers: any;
  utlaggFlikData: () => any;
}

export default function UtlaggFlik({ state, handlers, utlaggFlikData }: UtlaggFlikProps) {
  // Använd den delade utlaggFlikData funktionen
  const { columns, utlägg, loading } = utlaggFlikData();

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Utlägg</h3>
      {loading && <div>Laddar utlägg...</div>}
      {!loading && utlägg.length === 0 && <div>Inga utlägg hittades.</div>}
      {!loading && utlägg.length > 0 && (
        <Tabell data={utlägg} columns={columns} getRowId={(row: any) => row.id} />
      )}
      <UtlaggBokforModal />
    </div>
  );
}

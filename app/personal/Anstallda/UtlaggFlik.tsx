"use client";

import Tabell from "../../_components/Tabell";
import UtlaggBokforModal from "./UtlaggBokforModal";
import { useAnstallda } from "../_hooks/useAnstallda";

export default function UtlaggFlik() {
  const { utlaggFlikData } = useAnstallda();
  // Ska nedan bort?
  const { columns, utlägg, loading } = utlaggFlikData();

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Utlägg</h3>
      {loading && <div>Laddar utlägg...</div>}
      {!loading && utlägg.length === 0 && <div>Inga utlägg hittades.</div>}
      {!loading && utlägg.length > 0 && (
        <Tabell data={utlägg} columns={columns} getRowId={(row) => row.id} />
      )}
      <UtlaggBokforModal />
    </div>
  );
}

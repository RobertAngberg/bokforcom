import { useEffect, useState } from "react";
import { hämtaUtlägg } from "../actions";
import { bokförUtlägg } from "../../bokfor/_actions/transactionActions";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import UtlaggBokforModal from "./UtlaggBokforModal";

export default function UtlaggFlik({ anställd }: { anställd: any }) {
  const [utlägg, setUtlägg] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalUtlägg, setModalUtlägg] = useState<any | null>(null);
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!anställd?.id) return;
    setLoading(true);
    hämtaUtlägg(anställd.id)
      .then((data) => setUtlägg(data || []))
      .finally(() => setLoading(false));
  }, [anställd]);

  const columns: ColumnDefinition<any>[] = [
    {
      key: "datum",
      label: "Datum",
      render: (value) => (value ? new Date(value).toLocaleDateString("sv-SE") : ""),
    },
    {
      key: "belopp",
      label: "Belopp",
      render: (value) => `${value} kr`,
    },
    { key: "beskrivning", label: "Beskrivning" },
    { key: "status", label: "Status" },
    {
      key: "åtgärd",
      label: "Åtgärd",
      render: (_: any, row: any) =>
        row.status === "Väntande" ? (
          <Knapp text="Bokför" onClick={() => setModalUtlägg(row)} />
        ) : null,
    },
  ];

  // Bokföringslogik för preview
  const getPreviewRows = (utlägg: any) => {
    const belopp = Number(utlägg.belopp);
    const momsSats = utlägg.momssats ?? 0.06;
    const moms = +(belopp * (momsSats / (1 + momsSats))).toFixed(2);
    const beloppUtanMoms = +(belopp - moms).toFixed(2);
    return [
      {
        kontonummer: "5810",
        beskrivning: "Biljetter",
        debet: beloppUtanMoms,
        kredit: 0,
      },
      {
        kontonummer: "2640",
        beskrivning: "Ingående moms",
        debet: moms,
        kredit: 0,
      },
      {
        kontonummer: "2890",
        beskrivning: "Övriga kortfristiga skulder",
        debet: 0,
        kredit: belopp,
      },
    ];
  };

  const handleBokför = async () => {
    if (!modalUtlägg?.id) return;
    await bokförUtlägg(modalUtlägg.id);
    setModalUtlägg(null);
    setLoading(true);
    const data = await hämtaUtlägg(anställd.id);
    setUtlägg(data || []);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Utlägg</h3>
      {loading && <div>Laddar utlägg...</div>}
      {!loading && utlägg.length === 0 && <div>Inga utlägg hittades.</div>}
      {!loading && utlägg.length > 0 && (
        <Tabell data={utlägg} columns={columns} getRowId={(row) => row.id} />
      )}
      {modalUtlägg && (
        <UtlaggBokforModal
          utlägg={modalUtlägg}
          previewRows={getPreviewRows(modalUtlägg)}
          onClose={() => setModalUtlägg(null)}
          onBokför={handleBokför}
        />
      )}
    </div>
  );
}

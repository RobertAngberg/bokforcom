import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";

export default function UtlaggBokforModal({
  previewRows,
  utlägg,
  onClose,
  onBokför,
}: {
  utlägg: any;
  previewRows: any[];
  onClose: () => void;
  onBokför: () => void;
}) {
  const columns: ColumnDefinition<any>[] = [
    { key: "kontonummer", label: "Konto" },
    { key: "beskrivning", label: "Beskrivning" },
    { key: "debet", label: "Debet", render: (v) => (v ? v + " kr" : "") },
    { key: "kredit", label: "Kredit", render: (v) => (v ? v + " kr" : "") },
  ];

  // previewRows skickas nu in från UtlaggFlik.tsx

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-8 min-w-[350px] max-w-full">
        <h2 className="text-xl font-bold mb-4">Bokför utlägg</h2>
        <Tabell
          data={previewRows}
          columns={columns}
          getRowId={(row) => row.kontonummer + "-" + row.debet + "-" + row.kredit}
        />
        <div className="flex gap-4 mt-8 justify-end">
          <Knapp text="Avbryt" onClick={onClose} />
          {!utlägg.transaktion_id && <Knapp text="Bokför" onClick={onBokför} />}
        </div>
      </div>
    </div>
  );
}

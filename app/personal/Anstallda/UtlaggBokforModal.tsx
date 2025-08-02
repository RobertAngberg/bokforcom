import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Knapp from "../../_components/Knapp";
import Modal from "../../_components/Modal";

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
    <Modal isOpen={true} onClose={onClose} title="Bokför utlägg" maxWidth="lg">
      <Tabell
        data={previewRows}
        columns={columns}
        getRowId={(row) => row.kontonummer + "-" + row.debet + "-" + row.kredit}
      />
      <div className="flex gap-4 mt-8 justify-end">
        <Knapp text="Avbryt" onClick={onClose} />
        {!utlägg.transaktion_id && <Knapp text="Bokför" onClick={onBokför} />}
      </div>
    </Modal>
  );
}

"use client";

import Tabell from "../../../../_components/Tabell";
import Knapp from "../../../../_components/Knapp";
import Modal from "../../../../_components/Modal";
import { useUtlagg } from "../../../hooks/useUtlagg";

export default function UtlaggBokforModal() {
  const { utlaggModalData } = useUtlagg();

  return (
    <Modal
      isOpen={utlaggModalData().isOpen}
      onClose={utlaggModalData().onClose}
      title="Bokför utlägg"
      maxWidth="lg"
    >
      <Tabell
        data={utlaggModalData().previewRows}
        columns={utlaggModalData().columns}
        getRowId={(row) => row.kontonummer + "-" + row.debet + "-" + row.kredit}
      />
      <div className="flex gap-4 mt-8 justify-end">
        <Knapp text="Avbryt" onClick={utlaggModalData().onClose} />
        <Knapp text="Bokför" onClick={utlaggModalData().onClose} />
      </div>
    </Modal>
  );
}

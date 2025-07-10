"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";
import ExtraraderModal from "./ExtraraderModal";
import ExtraraderSökning from "./ExtraraderSökning";
import ExtraraderGrid from "./ExtraraderGrid";
import { sparaExtrarad } from "../../actions";
import {
  beräknaSumma,
  formatKolumn2Värde,
  initializeModalFields,
  getFieldsForRow,
} from "./extraraderUtils";
import { useState } from "react";

export default function ExtraRader({
  lönespecId,
  onNyRad,
  grundlön,
}: {
  lönespecId: number;
  onNyRad: () => void;
  grundlön?: number;
}) {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({
    sjukfranvaro: false,
    skattadeFormaner: false,
    skattefrittTraktamente: false,
    bilersattning: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<{ id: string; label: string } | null>(null);
  const [modalFields, setModalFields] = useState({
    kolumn2: "",
    kolumn3: "",
    kolumn4: "",
    enhet: "",
  });
  const [sökterm, setSökterm] = useState("");

  const toggleDropdown = (key: string) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCheckbox = (id: string, label: string) => {
    const newCheckedState = !state[id];
    setState((prev) => ({ ...prev, [id]: newCheckedState }));

    if (newCheckedState) {
      setModalRow({ id, label });
      setModalFields(initializeModalFields(id, grundlön));
      setModalOpen(true);
    }
  };

  const handleRemoveRow = async (id: string) => {
    // Ta bort från UI och databas
    try {
      setState((prev) => ({ ...prev, [id]: false }));
      await sparaExtrarad({
        lönespecifikation_id: lönespecId,
        kolumn1: id,
        kolumn2: "0",
        kolumn3: "0",
        kolumn4: "",
      });
      onNyRad();
    } catch (error) {
      setState((prev) => ({ ...prev, [id]: true }));
    }
  };

  return (
    <AnimeradFlik title="Extra rader" icon="➕">
      <ExtraraderSökning sökterm={sökterm} setSökterm={setSökterm} />
      <ExtraraderGrid
        sökterm={sökterm}
        state={state}
        open={open}
        toggleDropdown={toggleDropdown}
        toggleCheckbox={toggleCheckbox}
        onRemoveRow={handleRemoveRow}
      />
      <ExtraraderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalRow?.label}
        fields={getFieldsForRow(modalRow?.id || "", modalFields, setModalFields, grundlön)}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!lönespecId) return;
          const kolumn3Value = beräknaSumma(modalRow?.id || "", modalFields, grundlön);
          const kolumn2Value = formatKolumn2Värde(modalRow?.id || "", modalFields);
          const dataToSave = {
            lönespecifikation_id: lönespecId,
            typ: modalRow?.id,
            kolumn1: modalRow?.label ?? "",
            kolumn2: kolumn2Value,
            kolumn3: kolumn3Value,
            kolumn4: modalFields.kolumn4,
          };
          await sparaExtrarad(dataToSave);
          setModalOpen(false);
          setState((prev) => ({ ...prev, [modalRow?.id || ""]: true }));
          onNyRad();
        }}
      />
    </AnimeradFlik>
  );
}

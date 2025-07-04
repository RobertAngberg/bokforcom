"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";
import ExtraraderModal from "./ExtraraderModal";
import ExtraraderSökning from "./ExtraraderSökning";
import ExtraraderGrid from "./ExtraraderGrid";
import { sparaExtrarad } from "../../actions";
import { useExtraraderState } from "./useExtraraderState";
import {
  beräknaSumma,
  formatKolumn2Värde,
  initializeModalFields,
  getFieldsForRow,
} from "./extraraderUtils";

export default function ExtraRader({
  lönespecId,
  onNyRad,
  grundlön,
}: {
  lönespecId: number;
  onNyRad: () => void;
  grundlön?: number;
}) {
  const {
    state,
    setState,
    open,
    setOpen,
    modalOpen,
    setModalOpen,
    modalRow,
    setModalRow,
    modalFields,
    setModalFields,
    sökterm,
    setSökterm,
  } = useExtraraderState();

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
    alert("handleRemoveRow anropad för: " + id); // ← BRUTAL MEN TYDLIG

    // ✅ HITTA EXTRARAD-ID från databasen baserat på lönespec + kolumn1
    try {
      // Först - ta bort från UI
      setState((prev) => ({ ...prev, [id]: false }));

      // Sen - ta bort från databas genom att spara med 0 belopp
      await sparaExtrarad({
        lönespecifikation_id: lönespecId,
        kolumn1: id, // eller vad som matchar kolumn1
        kolumn2: "0",
        kolumn3: "0",
        kolumn4: "",
      });

      onNyRad();
    } catch (error) {
      console.error("❌ Fel vid borttagning av extrarad:", error);
      // Återställ UI om det blev fel
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

          console.log("SPARAR EXTRARAD:", dataToSave);

          console.log("modalRow vid sparande:", modalRow);

          await sparaExtrarad(dataToSave);
          setModalOpen(false);
          onNyRad();
        }}
      />
    </AnimeradFlik>
  );
}

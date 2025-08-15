"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";
import ExtraraderModal from "./ExtraraderModal";
import ExtraraderSökning from "./ExtraraderSokning";
import ExtraraderGrid from "./ExtraraderGrid";
import { sparaExtrarad, läggTillUtläggILönespec } from "../../actions";
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
  anstalldId,
}: {
  lönespecId: number;
  onNyRad: () => void;
  grundlön?: number;
  anstalldId?: number;
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
  const [läggerTillUtlägg, setLäggerTillUtlägg] = useState(false);

  const läggTillUtlägg = async () => {
    if (!lönespecId) return;
    setLäggerTillUtlägg(true);
    try {
      const result = await läggTillUtläggILönespec(lönespecId);
      if (result.success) {
        console.log(`✅ Lade till ${result.count} utlägg`);
        onNyRad(); // Uppdatera vyn
      } else {
        console.error("❌ Kunde inte lägga till utlägg:", result.error);
      }
    } catch (error) {
      console.error("❌ Fel vid tillägg av utlägg:", error);
    } finally {
      setLäggerTillUtlägg(false);
    }
  };

  const toggleDropdown = (key: string) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCheckbox = (id: string, label: string) => {
    // Öppna modalen direkt, oavsett state
    setModalRow({ id, label });
    setModalFields(initializeModalFields(id, grundlön));
    setModalOpen(true);
  };

  const handleRemoveRow = async (id: string) => {
    // Ta bort från UI och databas
    try {
      setState((prev) => ({ ...prev, [id]: false }));
      await sparaExtrarad({
        lönespecifikation_id: lönespecId,
        typ: "extra", // Lägg till saknad typ
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
          // Spara alltid bara siffran i kolumn2, ingen enhet
          let kolumn2Value = modalFields.kolumn2;
          if (typeof kolumn2Value === "string") {
            // Extrahera första numeriska värdet ur strängen
            const match = kolumn2Value.match(/\d+(\.\d+)?/);
            kolumn2Value = match ? match[0] : "";
          }
          // Validera typ mot RAD_KONFIGURATIONER
          const radKonfigKeys = Object.keys(require("./extraradDefinitioner").RAD_KONFIGURATIONER);
          let typValue = modalRow?.id ?? "";
          if (!radKonfigKeys.includes(typValue)) {
            console.warn("⚠️ Felaktig typ vid sparande av extrarad:", typValue);
            typValue = "";
          }
          // Sätt alltid enhet till 'Timme' för obetald frånvaro
          let modalFieldsToSave = { ...modalFields };
          if (typValue === "obetaldFranvaro") {
            modalFieldsToSave.enhet = "Timme";
          }
          let kolumn3Value = beräknaSumma(typValue, modalFieldsToSave, grundlön);
          const dataToSave = {
            lönespecifikation_id: lönespecId,
            typ: typValue,
            kolumn1: modalRow?.label ?? "",
            kolumn2: kolumn2Value,
            kolumn3: kolumn3Value,
            kolumn4: modalFields.kolumn4,
          };
          await sparaExtrarad(dataToSave);
          setModalOpen(false);
          setState((prev) => ({ ...prev, [typValue]: true }));
          onNyRad();
        }}
        anstalldId={anstalldId}
      />
    </AnimeradFlik>
  );
}

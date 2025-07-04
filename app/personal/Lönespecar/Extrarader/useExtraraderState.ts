"use client";

import { useState } from "react";

export function useExtraraderState() {
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

  return {
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
  };
}

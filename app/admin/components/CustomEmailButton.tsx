"use client";

import { useState } from "react";
import CustomEmailModal from "./CustomEmailModal";
import Knapp from "../../_components/Knapp";

export default function CustomEmailButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Knapp text="✉️ Skicka Email" onClick={() => setIsOpen(true)} />
      <CustomEmailModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

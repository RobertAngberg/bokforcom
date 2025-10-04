"use client";

import Modal from "../../../../_components/Modal";
import NyAnställd from "./NyAnstalld";
import type { NyAnstalldModalProps } from "../../../types/types";

export default function NyAnstalldModal({ isOpen, onClose, handlers }: NyAnstalldModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lägg till anställd" maxWidth="4xl">
      <NyAnställd handlers={handlers} />
    </Modal>
  );
}

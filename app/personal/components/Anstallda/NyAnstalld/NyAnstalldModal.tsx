"use client";

import Modal from "../../../../_components/Modal";
import NyAnställd from "./NyAnstalld";
import type { NyAnstalldProps } from "../../../types/types";

interface NyAnstalldModalProps {
  isOpen: boolean;
  onClose: () => void;
  handlers: NyAnstalldProps["handlers"];
}

export default function NyAnstalldModal({ isOpen, onClose, handlers }: NyAnstalldModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lägg till anställd" maxWidth="4xl">
      <NyAnställd handlers={handlers} />
    </Modal>
  );
}

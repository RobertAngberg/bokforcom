"use client";

import { useState } from "react";
import type { SemesterBokförModal, SemesterData } from "../types/types";

export function useSemester() {
  const [semesterTransaktioner, setSemesterTransaktioner] = useState<any[]>([]);
  const [semesterLoading, setSemesterLoading] = useState(false);
  const [semesterBokförModal, setSemesterBokförModal] = useState<SemesterBokförModal>({
    isOpen: false,
    loading: false,
  });
  const [semesterData, setSemesterData] = useState<SemesterData>({
    betalda_dagar: 0,
    sparade_dagar: 0,
    skuld: 0,
    komp_dagar: 0,
  });

  const openSemesterBokförModal = () => {
    setSemesterBokförModal((prev) => ({ ...prev, isOpen: true }));
  };

  const closeSemesterBokförModal = () => {
    setSemesterBokförModal((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    semesterTransaktioner,
    semesterLoading,
    semesterBokförModal,
    semesterData,
    setSemesterTransaktioner,
    setSemesterLoading,
    openSemesterBokförModal,
    closeSemesterBokförModal,
    setSemesterData,
  };
}

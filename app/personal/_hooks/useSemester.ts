"use client";

import { usePersonalContext } from "../_context/PersonalContext";

export function useSemester() {
  const {
    state: { semesterTransaktioner, semesterLoading, semesterBokförModal, semesterData },
    setSemesterTransaktioner,
    setSemesterLoading,
    openSemesterBokförModal,
    closeSemesterBokförModal,
    setSemesterData,
  } = usePersonalContext();

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

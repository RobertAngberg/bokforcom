"use client";

import { Förval, UseForvalKortProps } from "../_types/types";

export function useForvalKort({ förval, isHighlighted, onClick }: UseForvalKortProps) {
  const cardClassName = `relative rounded-xl p-4 transition-all duration-200 shadow-md cursor-pointer ${
    isHighlighted
      ? "border-2 border-dashed border-gray-500 bg-slate-800"
      : "border border-gray-700 bg-slate-900"
  }`;

  const formatKontoValue = (value: boolean | string | number | undefined) => {
    if (value === true) return "✓";
    return value ?? "";
  };

  return {
    state: {
      cardClassName,
      kontonSökord: förval.sökord.join(", "),
      showEnterHint: isHighlighted,
    },
    handlers: {
      onClick,
      formatKontoValue,
    },
  };
}

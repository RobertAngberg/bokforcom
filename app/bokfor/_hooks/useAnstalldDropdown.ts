"use client";

import { Anstalld, UseAnstalldDropdownProps } from "../_types/types";

export function useAnstalldDropdown({ anstallda, value, onChange }: UseAnstalldDropdownProps) {
  const options = anstallda.map((a) => ({
    label: `${a.förnamn} ${a.efternamn}`,
    value: a.id.toString(),
  }));

  return {
    options,
    value,
    onChange,
  };
}

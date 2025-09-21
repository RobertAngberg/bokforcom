import React from "react";
import { RAD_KONFIGURATIONER } from "../../../../utils/extraradDefinitioner";
import type { ExtraradRadOchDropdownProps } from "../../../../types/types";

export default function ExtraradRadOchDropdown({
  label,
  checked,
  toggle,
  onRemove,
  isDropdown = false,
  open = false,
  onToggleDropdown,
  id,
}: ExtraradRadOchDropdownProps) {
  // Visa minustecken om negativtBelopp är true för denna rad
  const showMinus = id && RAD_KONFIGURATIONER[id]?.negativtBelopp;

  if (isDropdown) {
    return (
      <div
        className="group flex items-center justify-between px-2 py-1 hover:bg-slate-700 rounded min-h-10 text-sm cursor-pointer"
        onClick={onToggleDropdown}
        style={{ minHeight: "2.5rem" }}
      >
        <div className="flex items-center flex-1">
          <span className="mr-2">{open ? "▾" : "▸"}</span>
          <span>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="flex items-center px-2 py-1 hover:bg-slate-700 rounded min-h-10 text-sm cursor-pointer transition-colors w-full text-left"
      onClick={toggle}
      style={{ minHeight: "2.5rem" }}
    >
      <span className="text-slate-200">{label}</span>
      {showMinus && <span className="ml-1 text-red-400 text-xs">(-)</span>}
    </button>
  );
}

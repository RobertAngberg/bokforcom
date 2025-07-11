import React from "react";

interface ExtraradRadOchDropdownProps {
  label: string;
  checked?: boolean;
  toggle: () => void;
  onRemove?: () => void;
  isDropdown?: boolean;
  open?: boolean;
  onToggleDropdown?: () => void;
  id?: string;
}

export default function ExtraradRadOchDropdown({
  label,
  checked,
  toggle,
  onRemove,
  isDropdown = false,
  open = false,
  onToggleDropdown,
}: ExtraradRadOchDropdownProps) {
  return (
    <div
      className="group flex items-center justify-between px-2 py-1 hover:bg-slate-700 rounded min-h-10 text-sm cursor-pointer"
      onClick={isDropdown ? onToggleDropdown : toggle}
      style={{ minHeight: isDropdown ? "2.5rem" : "2.2rem" }}
    >
      {/* Vänster: Dropdown-pil eller checkbox */}
      <div className="flex items-center flex-1">
        {isDropdown ? (
          <span className="mr-2">{open ? "▾" : "▸"}</span>
        ) : (
          <input
            type="checkbox"
            checked={checked ?? false}
            readOnly
            className="mr-2 w-5 h-5 accent-blue-500 flex-shrink-0"
            style={{ minWidth: "1.25rem", minHeight: "1.25rem" }}
          />
        )}
        <span>{label}</span>
      </div>
      {/* Höger: X-knapp */}
      {!isDropdown && checked && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 flex-shrink-0"
          title="Ta bort rad"
        >
          ✕
        </button>
      )}
    </div>
  );
}

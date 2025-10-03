//#region Huvud
"use client";

type DropdownProps = {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string; // För att kunna skicka med i FormData
};
//#endregion

export default function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
  name,
}: DropdownProps) {
  return (
    <div className={className || "max-w-[220px] w-full"}>
      {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-[9px] text-white rounded cursor-pointer bg-cyan-700 hover:bg-cyan-800 font-medium"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

import type { RotRutCheckboxProps } from "../_types/types";

export default function RotRutCheckbox({
  checked,
  onChange,
  className = "w-6 h-6",
  labelClassName = "text-base text-white",
}: RotRutCheckboxProps) {
  return (
    <div>
      <label className={`flex items-center gap-2 ${labelClassName}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={className}
        />
        Aktivera ROT/RUT-avdrag
      </label>
    </div>
  );
}

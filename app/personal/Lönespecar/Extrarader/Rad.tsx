export default function Rad({
  id,
  label,
  checked,
  toggle,
  onRemove,
}: {
  id: string;
  label: string;
  checked?: boolean;
  toggle: () => void;
  onRemove?: () => void; // Ny prop för att ta bort rad
}) {
  return (
    <div className="group flex items-center justify-between px-2 py-1 hover:bg-slate-700 rounded min-h-10 text-sm">
      {/* Vänster sida: Checkbox + Label */}
      <div
        className="flex items-center cursor-pointer flex-1"
        onClick={toggle}
        style={{ minHeight: "2.2rem" }}
      >
        <input
          type="checkbox"
          checked={checked ?? false}
          readOnly
          className="mr-2 w-5 h-5 accent-blue-500 flex-shrink-0"
          style={{ minWidth: "1.25rem", minHeight: "1.25rem" }}
        />
        <span>{label}</span>
      </div>

      {/* Höger sida: X-knapp (visas bara om raden är checked OCH har onRemove) */}
      {checked && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Förhindra att checkbox togglas
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

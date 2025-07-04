export default function DropdownRad({
  label,
  open,
  toggle,
}: {
  label: string;
  open: boolean;
  toggle: () => void; // ändrat till noll argument
}) {
  return (
    <div
      className="flex items-center px-2 py-1 hover:bg-slate-700 rounded cursor-pointer min-h-10 text-sm"
      onClick={toggle}
      style={{ minHeight: "2.5rem" }}
    >
      <span className="mr-2">{open ? "▾" : "▸"}</span>
      <span>{label}</span>
    </div>
  );
}

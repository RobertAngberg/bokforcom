type Props = {
  label: string;
  values: Record<string, number | string>;
};

export default function Totalrad({ label, values }: Props) {
  return (
    <div className="flex justify-between items-center font-semibold border-t border-slate-500 py-3 mt-2">
      <span>{label}</span>
      <div className="flex gap-8">
        {Object.entries(values).map(([year, value]) => {
          const num = typeof value === "number" ? value : parseFloat(value as string) || 0;
          return (
            <span key={year} className="min-w-[100px] text-right">
              {num.toLocaleString("sv-SE", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              kr
            </span>
          );
        })}
      </div>
    </div>
  );
}

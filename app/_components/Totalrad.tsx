import { formatCurrency } from "../_utils/format";

type Props = {
  label: string;
  values: Record<string, number | string>;
};

export default function Totalrad({ label, values }: Props) {
  const entries = Object.entries(values);

  return (
    <div className="pt-3 mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-base text-white">{label}</span>
        <div className="grid gap-3 text-right text-sm sm:grid-flow-col sm:auto-cols-max sm:gap-8 sm:text-base">
          {entries.map(([key, value]) => {
            const num = typeof value === "number" ? value : parseFloat(value as string) || 0;
            return (
              <div key={key} className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wide text-slate-400 sm:text-[13px]">
                  {key}
                </span>
                <span className="font-semibold text-right text-white sm:min-w-[120px]">
                  {formatCurrency(num)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

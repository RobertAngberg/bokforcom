import type { ToppInfoProps } from "../../../../types/types";

export default function ToppInfo({ månadsNamn, lönespec, anställd }: ToppInfoProps) {
  // Helper för att konvertera värden till Date-kompatibla värden
  const toDateValue = (
    value: string | number | boolean | Date | null | undefined
  ): string | number | Date => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return value;
    return new Date(); // Fallback till nu
  };

  const bankkontoText = (() => {
    const clearing = anställd?.clearingnummer?.toString().trim();
    const konto = anställd?.bankkonto?.toString().trim();

    if (clearing && konto) {
      return `${clearing}-${konto}`;
    }
    if (konto) {
      return konto;
    }
    if (clearing) {
      return clearing;
    }
    return "Ej angivet";
  })();

  const personnummerText = anställd?.personnummer?.toString().trim();

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-bold text-white">Lönespecifikation {månadsNamn}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
        <div>
          <span className="font-semibold text-white">Löneperiod:</span>
          <br />
          <span className="text-gray-300">
            {new Date(toDateValue(lönespec.period_start || lönespec.skapad)).toLocaleDateString(
              "sv-SE"
            )}{" "}
            -{" "}
            {new Date(toDateValue(lönespec.period_slut || lönespec.skapad)).toLocaleDateString(
              "sv-SE"
            )}
          </span>
        </div>
        <div>
          <span className="font-semibold text-white">Bankkonto:</span>
          <br />
          <span className="text-gray-300">{bankkontoText}</span>
        </div>
        <div>
          <span className="font-semibold text-white">Lönespec ID:</span>
          <br />
          <span className="text-gray-300">#{lönespec.id}</span>
        </div>
        <div className="md:col-span-3 text-gray-400 text-sm">
          Personnummer: {personnummerText || "Ej angivet"}
        </div>
      </div>
    </div>
  );
}

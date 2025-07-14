import { RAD_KONFIGURATIONER, RadKonfiguration } from "../../Extrarader/extraradDefinitioner";

interface LöneRadItemProps {
  benämning: string;
  belopp: number;
  typ: "total" | "extrarad" | "netto" | "varav";
  onTaBort?: () => void;
  kommentar?: string;
}

export default function LöneRadItem({
  benämning,
  belopp,
  typ,
  onTaBort,
  kommentar,
}: LöneRadItemProps) {
  const textColor = typ === "netto" ? "text-white" : "text-white";
  const isExtrarad = typ === "extrarad";
  const isVarav = typ === "varav";

  // Visa minus framför beloppet om extrarad och negativt belopp, men bara om beloppet är positivt
  let showMinus = false;
  if (isExtrarad && benämning) {
    const radConfig = Object.values(RAD_KONFIGURATIONER).find(
      (c): c is RadKonfiguration => (c as RadKonfiguration).label === benämning
    );
    showMinus = (radConfig as RadKonfiguration)?.negativtBelopp === true && belopp > 0;
  }

  return (
    <tr
      className={`border-b border-slate-600/70 ${isExtrarad ? "hover:bg-slate-600 cursor-pointer group relative" : ""}`}
    >
      <td className={`${textColor} font-medium py-2 ${isVarav ? "pl-4 text-gray-300" : ""}`}>
        {isVarav ? "varav " : ""}
        {benämning}
      </td>
      <td className="text-center text-gray-300 py-2">{kommentar || ""}</td>
      <td
        className={`text-right ${textColor} font-medium py-2 relative ${isVarav ? "text-gray-300" : ""}`}
      >
        <span className="font-mono text-white">{showMinus ? "-" : ""}</span>
        {Math.abs(belopp).toLocaleString("sv-SE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        kr
        {onTaBort && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaBort();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 text-sm bg-slate-800 rounded px-1"
            title="Ta bort"
          >
            ❌
          </button>
        )}
      </td>
    </tr>
  );
}

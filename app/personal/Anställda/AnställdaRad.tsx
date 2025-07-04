import Knapp from "../../_components/Knapp";

type AnställdaRadProps = {
  anställd: {
    id: number;
    namn: string;
    epost: string;
    roll?: string;
  };
  onRedigera?: (id: number) => void;
  onTaBort?: (id: number) => void;
  loading?: boolean;
};

export default function AnställdaRad({
  anställd,
  onRedigera,
  onTaBort,
  loading,
}: AnställdaRadProps) {
  const ikon = "👤";

  const handleTaBort = () => {
    if (window.confirm(`Är du säker på att du vill ta bort ${anställd.namn}?`)) {
      onTaBort && onTaBort(anställd.id);
    }
  };

  const handleRadKlick = (e: React.MouseEvent) => {
    // Hindra klick om användaren klickar på Ta bort-knappen
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    if (!loading && onRedigera) {
      onRedigera(anställd.id);
    }
  };

  return (
    <tr
      className={`border-b border-slate-600 hover:bg-slate-800 cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
      onClick={handleRadKlick}
    >
      <td className="py-2 px-2 text-2xl w-10" title="Anställd">
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
        ) : (
          ikon
        )}
      </td>
      <td className="py-2 px-2">{anställd.namn}</td>
      <td className="py-2 px-2">{anställd.epost}</td>
      <td className="py-2 px-2">{anställd.roll ?? ""}</td>
      <td className="py-2 px-2 flex gap-2 justify-end">
        {onTaBort && !loading && <Knapp text="❌ Ta bort" onClick={handleTaBort} type="button" />}
      </td>
    </tr>
  );
}

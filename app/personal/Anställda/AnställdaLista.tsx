import AnställdaRad from "./AnställdaRad";

type Anställd = {
  id: number;
  namn: string;
  epost: string;
  roll?: string;
};

type AnställdaListaProps = {
  anställda: Anställd[];
  onRedigera?: (id: number) => void;
  onTaBort?: (id: number) => void;
  loadingAnställdId?: number | null; // Lägg till denna prop
};

export default function AnställdaLista({
  anställda,
  onRedigera,
  onTaBort,
  loadingAnställdId,
}: AnställdaListaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th className="text-left text-gray-400">Namn</th>
            <th className="text-left text-gray-400">E-post</th>
            <th className="text-left text-gray-400">Roll</th>
            <th className="text-left text-gray-400"></th>
          </tr>
        </thead>
        <tbody>
          {anställda.map((anställd) => (
            <AnställdaRad
              key={anställd.id}
              anställd={anställd}
              onRedigera={onRedigera}
              onTaBort={onTaBort}
              loading={loadingAnställdId === anställd.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

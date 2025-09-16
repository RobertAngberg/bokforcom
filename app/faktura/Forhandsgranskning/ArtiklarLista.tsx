import { ArtiklarListaProps } from "../_types/types";

export default function ArtiklarLista({ rows }: ArtiklarListaProps) {
  return (
    <table className="w-full text-left border mb-6 text-[10pt]" style={{ borderColor: "#ccc" }}>
      <thead>
        <tr>
          {["Beskrivning", "Antal", "Pris", "Moms", "Belopp"].map((header, i) => (
            <th
              key={i}
              className="p-2 border"
              style={{ borderColor: "#ccc", verticalAlign: "middle", textAlign: "left" }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((rad, i) => {
          const antal = parseFloat(String(rad.antal));
          const pris = parseFloat(String(rad.prisPerEnhet));
          const moms = parseFloat(String(rad.moms));
          const belopp = antal * pris * (1 + moms / 100);
          return (
            <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
              <td className="p-2" style={{ verticalAlign: "middle" }}>
                {rad.beskrivning}
              </td>
              <td className="p-2" style={{ verticalAlign: "middle" }}>
                {antal}
              </td>
              <td className="p-2" style={{ verticalAlign: "middle" }}>
                {pris.toFixed(2)} {rad.valuta}
              </td>
              <td className="p-2" style={{ verticalAlign: "middle" }}>
                {moms}%
              </td>
              <td className="p-2" style={{ verticalAlign: "middle" }}>
                {belopp.toFixed(2)} {rad.valuta}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

import LöneRadItem from "./LoneRadItem";
import { RAD_KONFIGURATIONER } from "../../Extrarader/extraradDefinitioner";
import { beräknaSumma } from "../../Extrarader/extraraderUtils";

interface LöneTabellProps {
  beräknadeVärden: {
    lönekostnad: number;
    socialaAvgifter: number;
    bruttolön: number;
    skatt: number;
    nettolön: number;
  };
  extrarader: any[];
  onTaBortExtrarad: (id: number) => void;
}

export default function LöneTabell({
  beräknadeVärden,
  extrarader,
  onTaBortExtrarad,
}: LöneTabellProps) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="text-left text-gray-400">Benämning</th>
          <th className="text-center text-gray-400"></th>
          <th className="text-right text-gray-400">Belopp</th>
        </tr>
      </thead>
      <tbody>
        <LöneRadItem benämning="Lönekostnad" belopp={beräknadeVärden.lönekostnad} typ="total" />

        <LöneRadItem benämning="Bruttolön" belopp={beräknadeVärden.bruttolön} typ="total" />

        <LöneRadItem
          benämning="sociala avgifter"
          belopp={beräknadeVärden.socialaAvgifter}
          typ="varav"
        />

        <LöneRadItem benämning="Skatt" belopp={beräknadeVärden.skatt} typ="varav" />

        {/* EXTRARADER */}
        {extrarader.map((rad, i) => {
          // Använd beräknaSumma för att få korrekt belopp (inkl. multiplikation och minus)
          const modalFields = {
            kolumn1: rad.kolumn1,
            kolumn2: rad.kolumn2,
            kolumn3: rad.kolumn3,
            kolumn4: rad.kolumn4,
          };
          const grundlön = beräknadeVärden?.bruttolön || 0;
          let belopp = parseFloat(beräknaSumma(rad.typ, modalFields, grundlön));
          // Skicka alltid positivt belopp till LöneRadItem, minus visas via showMinus
          belopp = Math.abs(belopp);

          return (
            <LöneRadItem
              key={rad.id || i}
              benämning={rad.kolumn1 || ""}
              belopp={belopp}
              typ="extrarad"
              kommentar={rad.kolumn4}
              onTaBort={() => onTaBortExtrarad(rad.id)}
            />
          );
        })}

        {/* NETTOLÖN - VISA ALLTID */}
        <LöneRadItem benämning="Nettolön" belopp={beräknadeVärden.nettolön} typ="netto" />
      </tbody>
    </table>
  );
}

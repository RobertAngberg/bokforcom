import LöneRadItem from "./LöneRadItem";
import { RAD_KONFIGURATIONER } from "../../Extrarader/extraradDefinitioner";

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
          let belopp;
          const konfig = RAD_KONFIGURATIONER[rad.typ];

          // beräknaTotalsummaAutomatiskt: true = antal × belopp per enhet (räkna ut totalsumman automatiskt)
          // beräknaTotalsummaAutomatiskt: false = användaren matar in totalsumman direkt
          if (konfig && !konfig.fält.beräknaTotalsummaAutomatiskt) {
            belopp = parseFloat(rad.kolumn3) || 0;
          } else {
            const antal = parseFloat(rad.kolumn2) || 1;
            const aSek = parseFloat(rad.kolumn3) || 0;
            belopp = antal * aSek;
          }

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

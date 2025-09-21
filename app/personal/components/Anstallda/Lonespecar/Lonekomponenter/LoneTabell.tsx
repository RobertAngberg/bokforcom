import LöneRadItem from "./LoneRadItem";
import { RAD_KONFIGURATIONER } from "../../../../utils/extraradDefinitioner";
import { beräknaSumma } from "../../../../utils/extraraderUtils";

interface LöneTabellProps {
  beräknadeVärden: {
    lönekostnad: number;
    socialaAvgifter: number;
    bruttolön: number;
    skatt: number;
    nettolön: number;
    dagavdrag?: {
      föräldraledighet?: number;
      vårdAvSjuktBarn?: number;
      sjukfrånvaro?: number;
      totalt?: number;
    };
  };
  grundlön: number | undefined;
  extrarader: any[];
  onTaBortExtrarad: (id: number) => void;
}

export default function LöneTabell({
  beräknadeVärden,
  extrarader,
  onTaBortExtrarad,
  grundlön,
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
          // Sätt enhet till 'Dag' om den saknas
          const enhetValue = rad.enhet || rad.modalFields?.enhet || "Dag";
          let belopp;
          const config = RAD_KONFIGURATIONER[rad.typ];
          // Visa exakt det avdrag som används i totalen för Föräldraledighet och Vård av sjukt barn
          if (
            rad.kolumn1?.toLowerCase().includes("föräldraledighet") &&
            beräknadeVärden.dagavdrag?.föräldraledighet !== undefined
          ) {
            belopp = -Math.abs(Math.round(beräknadeVärden.dagavdrag.föräldraledighet * 100) / 100);
          } else if (
            rad.kolumn1?.toLowerCase().includes("vård av sjukt barn") &&
            beräknadeVärden.dagavdrag?.vårdAvSjuktBarn !== undefined
          ) {
            belopp = -Math.abs(Math.round(beräknadeVärden.dagavdrag.vårdAvSjuktBarn * 100) / 100);
          } else {
            const modalFields = {
              kolumn1: rad.kolumn1,
              kolumn2: rad.kolumn2,
              kolumn3: rad.kolumn3,
              kolumn4: rad.kolumn4,
              enhet: enhetValue,
            };
            const summa = parseFloat(beräknaSumma(rad.typ, modalFields, grundlön));
            if (config?.negativtBelopp) {
              belopp = -Math.abs(summa);
            } else {
              belopp = Math.abs(summa);
            }
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

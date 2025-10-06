import { formatAmount, formatCurrency } from "../../../../_utils/format";
import { TotalerInfoProps } from "../../../types/types";

export default function TotalerInfo({
  sumExkl,
  totalMoms,
  rotRutAvdrag,
  summaAttBetala,
  valuta = "SEK",
  rotRutTyp,
}: TotalerInfoProps) {
  return (
    <div className="text-right space-y-1 text-[10pt]">
      <p>
        <strong>Summa exkl. moms:</strong> {formatAmount(sumExkl)} {valuta}
      </p>
      <p>
        <strong>Moms totalt:</strong> {formatAmount(totalMoms)} {valuta}
      </p>
      {rotRutAvdrag > 0 && (
        <p className="font-bold">
          {rotRutTyp === "ROT" ? "ROT-avdrag: –" : "RUT-avdrag: –"}
          {formatCurrency(rotRutAvdrag)}
        </p>
      )}
      <p className="text-lg font-bold mt-2">
        Summa att betala:{" "}
        {valuta === "SEK"
          ? formatCurrency(summaAttBetala)
          : `${formatAmount(summaAttBetala)} ${valuta}`}
      </p>
    </div>
  );
}

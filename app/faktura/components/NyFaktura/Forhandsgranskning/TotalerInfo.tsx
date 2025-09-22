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
        <strong>Summa exkl. moms:</strong> {sumExkl.toFixed(2)} {valuta}
      </p>
      <p>
        <strong>Moms totalt:</strong> {totalMoms.toFixed(2)} {valuta}
      </p>
      {rotRutAvdrag > 0 && (
        <p className="font-bold">
          {rotRutTyp === "ROT" ? "ROT-avdrag: –" : "RUT-avdrag: –"}
          {rotRutAvdrag.toLocaleString("sv-SE", { style: "currency", currency: "SEK" })}
        </p>
      )}
      <p className="text-lg font-bold mt-2">
        Summa att betala:{" "}
        {summaAttBetala.toLocaleString("sv-SE", { style: "currency", currency: "SEK" })}
      </p>
    </div>
  );
}

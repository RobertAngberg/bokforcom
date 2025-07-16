interface BetalningsInfoProps {
  formData: any;
  summaAttBetala: number;
}

export default function BetalningsInfo({ formData, summaAttBetala }: BetalningsInfoProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-10 text-[10pt]">
      {[
        ["Förfallodatum", formData.forfallodatum],
        [
          "Summa att betala",
          summaAttBetala.toLocaleString("sv-SE", { style: "currency", currency: "SEK" }),
        ],
        ["Ange referens", formData.fakturanummer],
        [formData.betalningsmetod || "—", formData.nummer || "—"],
      ].map(([label, value], i) => (
        <div key={i}>
          <p className="font-bold">{label}</p>
          <p>{value}</p>
        </div>
      ))}
    </div>
  );
}

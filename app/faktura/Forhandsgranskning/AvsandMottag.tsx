//#region Huvud
"use client";

// Säker text-rendering för att förhindra XSS
const sanitizeDisplay = (text: string | undefined | null): string => {
  if (!text) return "";
  return String(text)
    .replace(/[<>&"']/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[match] || match;
    })
    .substring(0, 200); // Begränsa längd
};

type AvsändMottagProps = {
  formData: any;
};
//#endregion

export default function AvsändMottag({ formData }: AvsändMottagProps) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-20">
      <div>
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.företagsnamn)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{sanitizeDisplay(formData.adress)}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.postnummer)} {sanitizeDisplay(formData.stad)}
        </p>
      </div>
      <div>
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.kundnamn)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.kundadress)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.kundpostnummer)} {sanitizeDisplay(formData.kundstad)}
        </p>
      </div>
    </div>
  );
}

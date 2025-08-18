//#region Huvud
"use client";

// Säker text-rendering för att förhindra XSS
const sanitizeDisplay = (text: string | undefined | null): string => {
  if (!text) return "—";
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
    .substring(0, 200);
};

type FotProps = {
  formData: any;
  session: any;
};
//#endregion

export default function Fot({ formData, session }: FotProps) {
  return (
    <div
      className="grid grid-cols-2 mt-10 pt-6 text-[10pt]"
      style={{ borderTop: "1px solid #ccc" }}
    >
      <div className="space-y-1">
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Namn
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{sanitizeDisplay(formData.adress)}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.postnummer)} {sanitizeDisplay(formData.stad)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Org.nr: {sanitizeDisplay(formData.organisationsnummer)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Moms.nr: {sanitizeDisplay(formData.momsregistreringsnummer)}
        </p>
      </div>
      <div className="text-right space-y-1">
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Kontaktuppgifter
        </p>
        {/* Ej rätt????????????? Session */}
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {sanitizeDisplay(formData.företagsnamn)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Telefon: {sanitizeDisplay(formData.telefonnummer)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          E-post: {sanitizeDisplay(formData.epost)}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Webb: {sanitizeDisplay(formData.webbplats)}
        </p>
      </div>
    </div>
  );
}

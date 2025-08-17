import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  faktura?: any;
  customMessage?: string;
}

// Säker text-escaping för email-innehåll
function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Säker formatering av tal
function safeToFixed(num: any, decimals: number = 2): string {
  const parsed = parseFloat(num);
  return isFinite(parsed) ? parsed.toFixed(decimals) : "0.00";
}

const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  faktura,
  customMessage,
}) => {
  // Säker beräkning av totalsumma
  const totalExMoms =
    faktura?.artiklar?.reduce((sum: number, item: any) => {
      const antal = parseFloat(item?.antal) || 0;
      const pris = parseFloat(item?.prisPerEnhet) || 0;
      return sum + antal * pris;
    }, 0) || 0;

  const totalMoms =
    faktura?.artiklar?.reduce((sum: number, item: any) => {
      const antal = parseFloat(item?.antal) || 0;
      const pris = parseFloat(item?.prisPerEnhet) || 0;
      const moms = parseFloat(item?.moms) || 0;
      return sum + antal * pris * (moms / 100);
    }, 0) || 0;

  const summaAttBetala = totalExMoms + totalMoms;
  const valuta = escapeHtml(faktura?.artiklar?.[0]?.valuta || "SEK");

  // Säker escaping av alla visade värden
  const safeFirstName = escapeHtml(firstName);
  const safeFakturanummer = escapeHtml(faktura?.fakturanummer || "");
  const safeCustomMessage = escapeHtml(customMessage || "");

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginTop: "30px",
          marginBottom: "30px",
        }}
      >
        Faktura #{safeFakturanummer}
      </h1>

      <p>Hej {safeFirstName}!</p>

      {/* Visa eget meddelande om det finns */}
      {customMessage && (
        <div
          style={{
            margin: "20px 0",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderLeft: "4px solid #007bff",
            borderRadius: "4px",
          }}
        >
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{safeCustomMessage}</div>
        </div>
      )}

      <p>
        Här kommer din faktura med förfallodatum {escapeHtml(faktura?.forfallodatum || "")}. Du
        hittar den bifogad som PDF.
      </p>

      <div
        style={{
          margin: "20px 0",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Fakturainformation</h2>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Fakturanummer:</strong>
              </td>
              <td>{safeFakturanummer}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Datum:</strong>
              </td>
              <td>{escapeHtml(faktura?.fakturadatum || "")}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Förfallodatum:</strong>
              </td>
              <td>{escapeHtml(faktura?.forfallodatum || "")}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Betalningsmetod:</strong>
              </td>
              <td>
                {escapeHtml(faktura?.betalningsmetod || "")} {escapeHtml(faktura?.bankinfo || "")}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Summa:</strong>
              </td>
              <td>
                <strong>
                  {safeToFixed(summaAttBetala, 2)} {valuta}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid #eaeaea",
          paddingTop: "20px",
          paddingBottom: "30px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center",
          lineHeight: "1.3",
        }}
      >
        <div>{escapeHtml(faktura?.företagsnamn || "")}</div>
        <div>
          {escapeHtml(faktura?.adress || "")}, {escapeHtml(faktura?.postnummer || "")}{" "}
          {escapeHtml(faktura?.stad || "")}
        </div>
        <div>Org.nr: {escapeHtml(faktura?.organisationsnummer || "")}</div>
      </div>
    </div>
  );
};

export default EmailTemplate;

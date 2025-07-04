import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  faktura?: any;
  customMessage?: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  faktura,
  customMessage,
}) => {
  // Beräkna totalsumma om faktura finns
  const totalExMoms =
    faktura?.artiklar?.reduce(
      (sum: number, item: any) => sum + item.antal * item.prisPerEnhet,
      0
    ) || 0;

  const totalMoms =
    faktura?.artiklar?.reduce(
      (sum: number, item: any) => sum + item.antal * item.prisPerEnhet * (item.moms / 100),
      0
    ) || 0;

  const summaAttBetala = totalExMoms + totalMoms;
  const valuta = faktura?.artiklar?.[0]?.valuta || "SEK";

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
        Faktura #{faktura?.fakturanummer || ""}
      </h1>

      <p>Hej {firstName}!</p>

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
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{customMessage}</div>
        </div>
      )}

      <p>
        Här kommer din faktura med förfallodatum {faktura?.forfallodatum || ""}. Du hittar den
        bifogad som PDF.
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
              <td>{faktura?.fakturanummer || ""}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Datum:</strong>
              </td>
              <td>{faktura?.fakturadatum || ""}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Förfallodatum:</strong>
              </td>
              <td>{faktura?.forfallodatum || ""}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Betalningsmetod:</strong>
              </td>
              <td>
                {faktura?.betalningsmetod || ""} {faktura?.bankinfo || ""}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0" }}>
                <strong>Summa:</strong>
              </td>
              <td>
                <strong>
                  {summaAttBetala.toFixed(2)} {valuta}
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
        <div>{faktura?.företagsnamn || ""}</div>
        <div>
          {faktura?.adress || ""}, {faktura?.postnummer || ""} {faktura?.stad || ""}
        </div>
        <div>Org.nr: {faktura?.organisationsnummer || ""}</div>
      </div>
    </div>
  );
};

export default EmailTemplate;

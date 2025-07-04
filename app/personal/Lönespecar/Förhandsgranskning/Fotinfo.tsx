import React from "react";

export default function Fotinfo({ företag }: any) {
  return (
    <div className="mt-auto pt-4 border-t border-gray-400">
      <div className="text-center text-xs text-black">
        <div className="text-sm font-bold mb-1 text-black">
          {företag?.företagsnamn || "DITT FÖRETAG AB"}
        </div>
        <div>
          {företag?.adress || "Alléstigen 7B"}, {företag?.postnummer || "72214"}{" "}
          {företag?.stad || "Västerås"}
        </div>
        <div>Org.nr: {företag?.organisationsnummer || "559999-9999"}</div>
        <div>{företag?.epost || "info@dittforetag.se"}</div>
        {företag?.telefonnummer && <div>Tel: {företag.telefonnummer}</div>}
      </div>
    </div>
  );
}

import React from "react";
import type { FotinfoProps } from "../../../../types/types";

export default function Fotinfo({ företag }: FotinfoProps) {
  return (
    <div className="mt-auto pt-4 border-t border-gray-400">
      <div className="text-center text-xs text-black">
        {företag?.företagsnamn && (
          <div className="text-sm font-bold mb-1 text-black">{företag.företagsnamn}</div>
        )}
        {(företag?.adress || företag?.postnummer || företag?.stad) && (
          <div>
            {företag?.adress && företag.adress}
            {företag?.adress && företag?.postnummer && ", "}
            {företag?.postnummer && företag.postnummer}
            {företag?.postnummer && företag?.stad && " "}
            {företag?.stad && företag.stad}
          </div>
        )}
        {företag?.organisationsnummer && <div>Org.nr: {företag.organisationsnummer}</div>}
        {företag?.epost && <div>{företag.epost}</div>}
        {företag?.telefonnummer && <div>Tel: {företag.telefonnummer}</div>}
      </div>
    </div>
  );
}

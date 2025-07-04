//#region Huvud
"use client";

import { useState } from "react";
import { deleteFaktura, hämtaFakturaMedRader } from "./actions";
import { useFakturaContext } from "./FakturaProvider";

interface Props {
  fakturor: any[];
  activeInvoiceId?: number;
}
//#endregion

export default function SparadeFakturor({ fakturor, activeInvoiceId }: Props) {
  const { setFormData, setKundStatus } = useFakturaContext();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);

  const handleSelectInvoice = async (id: number) => {
    setLoadingInvoiceId(id);
    try {
      const data = await hämtaFakturaMedRader(id);
      if (!data || !data.faktura) {
        alert("❌ Kunde inte hämta faktura");
        return;
      }

      const { faktura, artiklar, rotRut } = data;

      setFormData((prev) => ({
        ...prev,
        id: faktura.id,
        fakturanummer: faktura.fakturanummer ?? "",
        fakturadatum: faktura.fakturadatum?.toISOString
          ? faktura.fakturadatum.toISOString().slice(0, 10)
          : (faktura.fakturadatum ?? ""),
        forfallodatum: faktura.forfallodatum?.toISOString
          ? faktura.forfallodatum.toISOString().slice(0, 10)
          : (faktura.forfallodatum ?? ""),
        betalningsmetod: faktura.betalningsmetod ?? "",
        betalningsvillkor: faktura.betalningsvillkor ?? "",
        drojsmalsranta: faktura.drojsmalsranta ?? "",
        kundId: faktura.kundId?.toString() ?? "",
        nummer: faktura.nummer ?? "",
        kundmomsnummer: faktura.kundmomsnummer ?? "",
        kundnamn: faktura.kundnamn ?? "",
        kundnummer: faktura.kundnummer ?? "",
        kundorganisationsnummer: faktura.kundorganisationsnummer ?? "",
        kundadress: faktura.kundadress ?? "",
        kundpostnummer: faktura.kundpostnummer ?? "",
        kundstad: faktura.kundstad ?? "",
        kundemail: faktura.kundemail ?? "",
        företagsnamn: faktura.företagsnamn ?? "",
        epost: faktura.epost ?? "",
        adress: faktura.adress ?? "",
        postnummer: faktura.postnummer ?? "",
        stad: faktura.stad ?? "",
        organisationsnummer: faktura.organisationsnummer ?? "",
        momsregistreringsnummer: faktura.momsregistreringsnummer ?? "",
        telefonnummer: faktura.telefonnummer ?? "",
        bankinfo: faktura.bankinfo ?? "",
        webbplats: faktura.webbplats ?? "",
        logo: faktura.logo ?? "",
        logoWidth: faktura.logo_width ?? 200,
        artiklar: artiklar.map((rad: any) => ({
          beskrivning: rad.beskrivning,
          antal: Number(rad.antal),
          prisPerEnhet: Number(rad.pris_per_enhet ?? rad.prisPerEnhet),
          moms: Number(rad.moms),
          valuta: rad.valuta ?? "SEK",
          typ: rad.typ === "tjänst" ? "tjänst" : "vara",
          rotRutTyp: rad.rot_rut_typ ?? rad.rotRutTyp,
          rotRutKategori: rad.rot_rut_kategori ?? rad.rotRutKategori,
          avdragProcent: rad.avdrag_procent ?? rad.avdragProcent,
          arbetskostnadExMoms: rad.arbetskostnad_ex_moms ?? rad.arbetskostnadExMoms,
        })),
        // ROT/RUT-fält från rot_rut-tabellen
        rotRutAktiverat: !!rotRut.typ,
        rotRutTyp: rotRut.typ ?? "",
        rotRutKategori: rotRut.rot_rut_kategori ?? "",
        avdragProcent: rotRut.avdrag_procent ?? "",
        arbetskostnadExMoms: rotRut.arbetskostnad_ex_moms ?? "",
        avdragBelopp: rotRut.avdrag_belopp ?? "",
        personnummer: rotRut.personnummer ?? "",
        fastighetsbeteckning: rotRut.fastighetsbeteckning ?? "",
        rotBoendeTyp: rotRut.rot_boende_typ ?? "",
        brfOrganisationsnummer: rotRut.brf_organisationsnummer ?? "",
        brfLagenhetsnummer: rotRut.brf_lagenhetsnummer ?? "",
      }));

      setKundStatus("loaded");
    } catch (error) {
      alert("❌ Fel vid laddning av faktura");
      console.error(error);
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const hanteraRaderaFaktura = async (id: number) => {
    if (!confirm("❌ Vill du ta bort fakturan?")) return;

    try {
      await deleteFaktura(id);
      // Trigga reload event så Fakturor.tsx uppdaterar sin lista
      window.dispatchEvent(new Event("reloadFakturor"));
    } catch {
      alert("❌ Kunde inte ta bort faktura");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
      <div>
        <h3 className="text-xl font-semibold mb-2">🧾 Fakturor</h3>

        {fakturor.length === 0 ? (
          <p className="text-gray-400 italic">Inga fakturor hittades.</p>
        ) : (
          <ul className="space-y-2">
            {fakturor.map((faktura) => {
              const datum = faktura.fakturadatum
                ? new Date(faktura.fakturadatum).toLocaleDateString("sv-SE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";

              const isActive = activeInvoiceId === faktura.id;
              const isLoading = loadingInvoiceId === faktura.id;

              return (
                <li
                  key={faktura.id}
                  className={`bg-slate-900 border rounded px-4 py-2 hover:bg-slate-800 ${
                    isActive ? "border-green-500" : "border-slate-700"
                  } ${isLoading ? "opacity-75" : ""}`}
                >
                  <div className="flex justify-between">
                    <div
                      className={`cursor-pointer ${isLoading ? "pointer-events-none" : ""}`}
                      onClick={() => !isLoading && handleSelectInvoice(faktura.id)}
                    >
                      <div>
                        #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                      </div>
                      <div className="text-gray-400 text-sm">{datum}</div>

                      {isLoading && (
                        <div className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                          <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                          Laddar...
                        </div>
                      )}

                      {isActive && !isLoading && (
                        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                          ✅ Inladdad
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => hanteraRaderaFaktura(faktura.id)}
                      className="hover:text-red-500 text-lg ml-4"
                      title="Ta bort faktura"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

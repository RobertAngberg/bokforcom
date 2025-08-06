//#region Huvud
"use client";

import { useState } from "react";
import { deleteFaktura, hämtaFakturaMedRader, registreraKundfakturaBetalning } from "./actions";
import { useFakturaContext } from "./FakturaProvider";

interface Props {
  fakturor: any[];
  activeInvoiceId?: number;
  onSelectInvoice?: (id: number) => void | Promise<void>;
}
//#endregion

export default function SparadeFakturor({ fakturor, activeInvoiceId, onSelectInvoice }: Props) {
  const { setFormData, setKundStatus } = useFakturaContext();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [betalningsModal, setBetalningsModal] = useState<{
    fakturaId: number;
    belopp: number;
  } | null>(null);

  const hanteraRegistreraBetalning = async (
    fakturaId: number,
    belopp: number,
    kontoklass: string
  ) => {
    try {
      const result = await registreraKundfakturaBetalning(fakturaId, belopp, kontoklass);
      if (result.success) {
        alert("✅ Betalning registrerad!");
        window.dispatchEvent(new Event("reloadFakturor"));
        setBetalningsModal(null);
      } else {
        alert(`❌ ${result.error || "Kunde inte registrera betalning"}`);
      }
    } catch (error) {
      console.error("Fel vid betalningsregistrering:", error);
      alert("❌ Fel vid registrering av betalning");
    }
  };

  // Om onSelectInvoice finns, använd den istället för att ladda data själv
  const handleSelectInvoice = async (id: number) => {
    if (typeof onSelectInvoice === "function") {
      setLoadingInvoiceId(id);
      try {
        await onSelectInvoice(id);
        setKundStatus("loaded");
      } catch (error) {
        alert("❌ Fel vid laddning av faktura");
        console.error(error);
      } finally {
        setLoadingInvoiceId(null);
      }
      return;
    }
    // ...befintlig kod för att ladda faktura om ingen prop skickas...
    try {
      setLoadingInvoiceId(id);
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
        <div className="max-w-[260px]">
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
                    className={`bg-slate-900 border rounded px-4 py-3 hover:bg-slate-800 text-sm flex items-center gap-0 ${
                      isActive ? "border-green-500" : "border-slate-700"
                    } ${isLoading ? "opacity-75" : ""}`}
                  >
                    <div
                      className={`cursor-pointer flex-1 ${isLoading ? "pointer-events-none" : ""}`}
                      onClick={() => !isLoading && handleSelectInvoice(faktura.id)}
                    >
                      <div>
                        #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                      </div>
                      <div className="text-gray-400 text-sm">{datum}</div>

                      {faktura.betaldatum && (
                        <div className="text-green-400 text-xs mt-1">
                          Betald: {new Date(faktura.betaldatum).toLocaleDateString("sv-SE")}
                        </div>
                      )}

                      {isLoading && (
                        <div className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                          <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                          Laddar...
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => hanteraRaderaFaktura(faktura.id)}
                      className="hover:text-red-500 text-lg"
                      title="Ta bort faktura"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Betalningsmodal */}
      {betalningsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">💰 Registrera betalning</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const kontoklass = formData.get("kontoklass")?.toString() || "1930";
                hanteraRegistreraBetalning(
                  betalningsModal.fakturaId,
                  betalningsModal.belopp,
                  kontoklass
                );
              }}
            >
              <div className="mb-4">
                <label className="block text-white text-sm font-bold mb-2">
                  Belopp att registrera:
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={betalningsModal.belopp}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm font-bold mb-2">
                  Konto för betalning:
                </label>
                <select
                  name="kontoklass"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  defaultValue="1930"
                >
                  <option value="1930">1930 - Företagskonto/Bankkonto</option>
                  <option value="1910">1910 - Kassa</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  ✅ Registrera betalning
                </button>
                <button
                  type="button"
                  onClick={() => setBetalningsModal(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  ❌ Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

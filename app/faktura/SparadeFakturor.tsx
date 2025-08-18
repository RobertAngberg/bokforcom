//#region Huvud
"use client";

import { useState } from "react";
import { deleteFaktura, hämtaFakturaMedRader, registreraKundfakturaBetalning } from "./actions";
import { useFakturaContext } from "./FakturaProvider";

//#region Business Logic - Migrated from actions.ts
// Beräkna totalbelopp för faktura (flyttad från actions.ts)
function calculateInvoiceTotalBelopp(artiklar: any[]): number {
  const totalBelopp = artiklar.reduce((sum, artikel) => {
    const prisInkMoms = artikel.pris_per_enhet * (1 + artikel.moms / 100);
    return sum + artikel.antal * prisInkMoms;
  }, 0);
  return Math.round(totalBelopp * 100) / 100; // Avrunda till 2 decimaler
}

// Identifiera ROT/RUT typ från artiklar (flyttad från actions.ts)
function determineRotRutType(artiklar: any[]): string | null {
  const rotRutArtiklar = artiklar.filter((artikel) => artikel.rot_rut_typ);
  const harROT = rotRutArtiklar.some((artikel) => artikel.rot_rut_typ === "ROT");
  const harRUT = rotRutArtiklar.some((artikel) => artikel.rot_rut_typ === "RUT");

  if (harROT && harRUT) {
    return "ROT+RUT";
  } else if (harROT) {
    return "ROT";
  } else if (harRUT) {
    return "RUT";
  }
  return null;
}

// Beräkna ROT/RUT avdrag (flyttad från actions.ts)
function calculateRotRutAvdrag(artiklar: any[]): number {
  return artiklar
    .filter((a) => a.rot_rut_typ)
    .reduce((sum, a) => {
      const arbetskostnad = parseFloat(a.arbetskostnad_ex_moms) || 0;
      const procent = parseFloat(a.avdrag_procent) || 0;
      return sum + (arbetskostnad * procent) / 100;
    }, 0);
}

// Förbättra fakturadata med beräknade värden
function enrichFakturaData(faktura: any, artiklar: any[]) {
  const totalBelopp = calculateInvoiceTotalBelopp(artiklar);
  const rotRutTyp = determineRotRutType(artiklar);

  return {
    ...faktura,
    totalBelopp,
    antalArtiklar: artiklar.length,
    rotRutTyp,
  };
}
//#endregion

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

      console.log(
        "� SparadeFakturor - Laddar faktura ID:",
        id,
        "- Har ROT/RUT:",
        Object.keys(rotRut).length > 0
      );

      setFormData((prev) => ({
        ...prev,
        id: id.toString(), // Använd parametern direkt!
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
        rotRutAktiverat: !!(rotRut.typ && rotRut.typ !== ""),
        rotRutTyp: rotRut.typ || undefined,
        rotRutKategori: (rotRut as any).kategori || undefined,
        avdragProcent: rotRut.avdrag_procent || undefined,
        arbetskostnadExMoms: rotRut.arbetskostnad_ex_moms || undefined,
        avdragBelopp: rotRut.avdrag_belopp || undefined,
        personnummer: rotRut.personnummer || "",
        fastighetsbeteckning: rotRut.fastighetsbeteckning || "",
        rotBoendeTyp: rotRut.rot_boende_typ || undefined,
        brfOrganisationsnummer: rotRut.brf_organisationsnummer || "",
        brfLagenhetsnummer: rotRut.brf_lagenhetsnummer || "",
        // Nya ROT/RUT-fält
        rotRutBeskrivning: (rotRut as any).beskrivning || "",
        rotRutStartdatum: (rotRut as any).startdatum || "",
        rotRutSlutdatum: (rotRut as any).slutdatum || "",
        rotRutAntalTimmar: (rotRut as any).antal_timmar || undefined,
        rotRutPrisPerTimme: (rotRut as any).pris_per_timme || undefined,
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
      <div className="text-white">
        {fakturor.length === 0 ? (
          <p className="text-gray-400 italic">Inga fakturor hittades.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

              // Avgör status
              let statusBadge: string | null = null;
              let statusColor = "text-white";

              if (faktura.status_betalning === "Betald") {
                statusBadge = "✅ Betald";
                statusColor = "text-green-400";
              } else if (faktura.status_bokförd && faktura.status_bokförd !== "Ej bokförd") {
                statusBadge = "📚 Bokförd, ej betald";
                statusColor = "text-white";
              } else {
                statusBadge = "❌ Ej bokförd";
                statusColor = "text-white";
              }

              return (
                <div
                  key={faktura.id}
                  className={`bg-slate-900 border rounded px-4 py-3 hover:bg-slate-800 text-sm relative ${
                    isActive ? "border-green-500" : "border-slate-700"
                  } ${isLoading ? "opacity-75" : ""}`}
                >
                  {/* Radera-knapp i övre högra hörnet */}
                  {faktura.status_betalning !== "Betald" &&
                    (!faktura.status_bokförd || faktura.status_bokförd === "Ej bokförd") && (
                      <button
                        onClick={() => hanteraRaderaFaktura(faktura.id)}
                        className="absolute top-2 right-2 hover:text-red-500 text-lg z-10"
                        title="Ta bort faktura"
                        disabled={isLoading}
                      >
                        🗑️
                      </button>
                    )}

                  <div
                    className={`cursor-pointer ${isLoading ? "pointer-events-none" : ""} pr-8`}
                    onClick={() => !isLoading && handleSelectInvoice(faktura.id)}
                  >
                    {/* Huvudrad med nummer och kund */}
                    <div className="font-semibold text-base mb-3">
                      #{faktura.fakturanummer} – {faktura.kundnamn ?? "Okänd kund"}
                    </div>

                    {/* Avskiljare */}
                    <hr className="border-slate-600 mb-3" />

                    {/* Datum */}
                    <div className="text-white text-sm mb-2">{datum}</div>

                    {/* Belopp */}
                    <div className="font-medium text-white text-sm mb-2">
                      {faktura.totalBelopp?.toFixed(2) ?? "0.00"} kr
                    </div>

                    {/* Status */}
                    <div className={`text-sm ${statusColor} mb-2`}>{statusBadge}</div>

                    {/* Extra info om betald */}
                    {faktura.betaldatum && (
                      <div className="text-white text-xs mt-1">
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

                  {/* ROT/RUT-label i nedre högra hörnet */}
                  {faktura.rotRutTyp && (
                    <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        {faktura.rotRutTyp}
                      </span>
                      {faktura.rot_rut_status === "godkänd" && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          ✅ SKV
                        </span>
                      )}
                      {faktura.rot_rut_status === "väntar" && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                          ⏳ SKV
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

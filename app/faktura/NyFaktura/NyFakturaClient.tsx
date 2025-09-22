"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import KundUppgifter from "./KundUppgifter";
import ProdukterTjanster from "../ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import MainLayout from "../../_components/MainLayout";
import Alternativ from "../Alternativ/Alternativ";
import Betalning from "./Betalning";
import Avsandare from "./Avsandare";
import { FakturaProvider } from "../_context/FakturaContext";
import { useFaktura } from "../_hooks/useFaktura";
import type { NyFakturaClientProps } from "../_types/types";
import TillbakaPil from "../../_components/TillbakaPil";
import { useRouter } from "next/navigation";
import { hämtaFakturaMedRader } from "../_actions/fakturaActions";

function NyFakturaContent({ initialData }: NyFakturaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoadingFaktura, setIsLoadingFaktura] = useState(false);
  const { formData, showPreview, setShowPreview, setFormData, setKundStatus, showError } =
    useFaktura();

  // Ladda fakturedata om edit-parameter finns
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      setIsLoadingFaktura(true);
      const fakturaId = parseInt(editId);
      if (!isNaN(fakturaId)) {
        hämtaFakturaMedRader(fakturaId)
          .then((data) => {
            if (!data || !data.faktura) {
              showError("Kunde inte hämta faktura");
              setIsLoadingFaktura(false);
              return;
            }

            const { faktura, artiklar, rotRut } = data;

            setFormData({
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
                prisPerEnhet: Number(rad.prisPerEnhet),
                moms: Number(rad.moms),
                valuta: rad.valuta ?? "SEK",
                typ: rad.typ === "tjänst" ? "tjänst" : "vara",
                rotRutTyp: rad.rotRutTyp,
                rotRutKategori: rad.rotRutKategori,
                avdragProcent: rad.avdragProcent,
                arbetskostnadExMoms: rad.arbetskostnadExMoms,
                rotRutBeskrivning: rad.rotRutBeskrivning,
                rotRutStartdatum: rad.rotRutStartdatum,
                rotRutSlutdatum: rad.rotRutSlutdatum,
                rotRutPersonnummer: rad.rotRutPersonnummer,
                rotRutFastighetsbeteckning: rad.rotRutFastighetsbeteckning,
                rotRutBoendeTyp: rad.rotRutBoendeTyp,
                rotRutBrfOrg: rad.rotRutBrfOrg,
                rotRutBrfLagenhet: rad.rotRutBrfLagenhet,
              })),
              // ROT/RUT-fält från rot_rut-tabellen eller första artikeln med ROT/RUT-data
              rotRutAktiverat:
                !!(rotRut.typ && rotRut.typ !== "") || artiklar.some((a: any) => a.rotRutTyp),
              rotRutTyp:
                rotRut.typ || artiklar.find((a: any) => a.rotRutTyp)?.rotRutTyp || undefined,
              rotRutKategori:
                (rotRut as any).rotRutKategori ||
                artiklar.find((a: any) => a.rotRutKategori)?.rotRutKategori ||
                undefined,
              avdragProcent:
                rotRut.avdrag_procent ||
                artiklar.find((a: any) => a.avdragProcent)?.avdragProcent ||
                undefined,
              arbetskostnadExMoms:
                rotRut.arbetskostnad_ex_moms ||
                artiklar.find((a: any) => a.arbetskostnadExMoms)?.arbetskostnadExMoms ||
                undefined,
              avdragBelopp: rotRut.avdrag_belopp || undefined,
              personnummer:
                rotRut.personnummer ||
                artiklar.find((a: any) => a.rotRutPersonnummer)?.rotRutPersonnummer ||
                "",
              fastighetsbeteckning:
                rotRut.fastighetsbeteckning ||
                artiklar.find((a: any) => a.rotRutFastighetsbeteckning)
                  ?.rotRutFastighetsbeteckning ||
                "",
              rotBoendeTyp: rotRut.rot_boende_typ || undefined,
              brfOrganisationsnummer:
                rotRut.brf_organisationsnummer ||
                artiklar.find((a: any) => a.rotRutBrfOrg)?.rotRutBrfOrg ||
                "",
              brfLagenhetsnummer:
                rotRut.brf_lagenhetsnummer ||
                artiklar.find((a: any) => a.rotRutBrfLagenhet)?.rotRutBrfLagenhet ||
                "",
              // Nya ROT/RUT-fält från rot_rut-tabellen eller första artikeln
              rotRutBeskrivning:
                (rotRut as any).rotRutBeskrivning ||
                artiklar.find((a: any) => a.rotRutBeskrivning)?.rotRutBeskrivning ||
                "",
              rotRutStartdatum:
                (rotRut as any).rotRutStartdatum ||
                artiklar.find((a: any) => a.rotRutStartdatum)?.rotRutStartdatum ||
                "",
              rotRutSlutdatum:
                (rotRut as any).rotRutSlutdatum ||
                artiklar.find((a: any) => a.rotRutSlutdatum)?.rotRutSlutdatum ||
                "",
            });

            // Sätt kundStatus till "loaded" så att kunduppgifterna visas
            if (faktura.kundnamn) {
              setKundStatus("loaded");
            }

            setIsLoadingFaktura(false);
          })
          .catch((error) => {
            console.error("Fel vid laddning av faktura:", error);
            showError("Kunde inte ladda fakturedata");
            setIsLoadingFaktura(false);
          });
      } else {
        setIsLoadingFaktura(false);
      }
    } else {
      setIsLoadingFaktura(false);
    }
  }, [searchParams]); // Bara searchParams som dependency

  // Helper functions för preview
  const openPreview = () => setShowPreview(true);
  const closePreview = () => setShowPreview(false);
  const reloadFaktura = () => {
    // För nu, implementera basic reload funktionalitet
    window.location.reload();
  };

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          <TillbakaPil onClick={() => router.push("/faktura")} />
          <h1 className="text-2xl text-center w-full">
            {isLoadingFaktura ? (
              <span className="text-blue-400">🔄 Laddar faktura...</span>
            ) : formData.fakturanummer && formData.kundnamn ? (
              `🧾 Faktura #${formData.fakturanummer} - ${formData.kundnamn}`
            ) : formData.fakturanummer ? (
              `🧾 Faktura #${formData.fakturanummer}`
            ) : (
              "Ny Faktura"
            )}
          </h1>
        </div>

        <AnimeradFlik title="Avsändare" icon="🧑‍💻">
          <Avsandare />
        </AnimeradFlik>

        <AnimeradFlik title="Kunduppgifter" icon="🧑‍💼">
          <KundUppgifter />
        </AnimeradFlik>

        <AnimeradFlik title="Produkter & Tjänster" icon="📦">
          <ProdukterTjanster />
        </AnimeradFlik>

        <AnimeradFlik title="Betalning" icon="💰">
          <Betalning />
        </AnimeradFlik>

        <AnimeradFlik title="Alternativ" icon="⚙️">
          <Alternativ onReload={reloadFaktura} onPreview={openPreview} />
        </AnimeradFlik>
      </MainLayout>

      <div id="print-area" className="hidden print:block">
        {!isLoadingFaktura && <Forhandsgranskning />}
      </div>

      {showPreview && !isLoadingFaktura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl border border-gray-300 rounded-none">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={closePreview} text="❌ Stäng" />
            </div>
            <div className="p-6 flex justify-center">
              <div className="w-[210mm] h-[297mm] bg-white shadow border rounded">
                <Forhandsgranskning />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function NyFakturaClient({ initialData }: NyFakturaClientProps) {
  return (
    <FakturaProvider initialData={initialData}>
      <NyFakturaContent initialData={initialData} />
    </FakturaProvider>
  );
}

// Kom ihåg; loggan sparas i localStorage

//#region Imports och types
"use client";

import { useEffect, useState } from "react";
import { useFakturaContext } from "./FakturaProvider";
import { useSession } from "next-auth/react";
import KundUppgifter from "./KundUppgifter";
import ProdukterTjanster from "./ProdukterTjänster/ProdukterTjänster";
import Forhandsgranskning from "./Förhandsgranskning/Förhandsgranskning";
import SparadeFakturor from "./SparadeFakturor";
import AnimeradFlik from "../_components/AnimeradFlik";
import BakåtPil from "../_components/BakåtPil";
import Knapp from "../_components/Knapp";
import MainLayout from "../_components/MainLayout";
import Alternativ from "./Alternativ/Alternativ";
import Betalning from "./Betalning";
import Avsandare from "./Avsandare";
import {
  saveInvoice,
  hämtaFakturaMedRader,
  deleteFaktura,
  hämtaSparadeFakturor,
  hämtaFöretagsprofil,
} from "./actions";

type Props = {
  fakturor: any[];
  kunder: any[];
  artiklar: any[];
};
//#endregion

export default function Fakturor({ fakturor: initialFakturor, kunder, artiklar }: Props) {
  // State för att styra flikarnas synlighet
  const [showAllFlikar, setShowAllFlikar] = useState(false);
  //#region Context och state
  const { formData, setFormData, setKundStatus } = useFakturaContext();
  // Funktion för att hantera när en faktura väljs
  const hanteraValdFaktura = async (fakturaId: number) => {
    const data = await hämtaFakturaMedRader(fakturaId);
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
    setShowAllFlikar(true);
  };
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  const [fakturor, setFakturor] = useState(initialFakturor);
  //#endregion

  // Spåra aktiv faktura
  const currentInvoiceId = formData.id ? parseInt(formData.id) : undefined;

  //#region Ladda företagsdata centralt när session är tillgänglig
  useEffect(() => {
    if (session?.user?.id && !formData.företagsnamn) {
      hämtaFöretagsprofil(session.user.id).then((profil) => {
        if (profil) {
          setFormData((prev) => ({
            ...prev,
            företagsnamn: profil.företagsnamn ?? "",
            adress: profil.adress ?? "",
            postnummer: profil.postnummer ?? "",
            stad: profil.stad ?? "",
            organisationsnummer: profil.organisationsnummer ?? "",
            momsregistreringsnummer: profil.momsregistreringsnummer ?? "",
            telefonnummer: profil.telefonnummer ?? "",
            epost: profil.epost ?? "",
            bankinfo: profil.bankinfo ?? "",
            webbplats: profil.webbplats ?? "",
          }));
        }
      });
    }
  }, [session?.user?.id, formData.företagsnamn, setFormData]);
  //#endregion

  //#region Lyssna på reloadFakturor event
  useEffect(() => {
    const reload = async () => {
      const nyaFakturor = await hämtaSparadeFakturor();
      setFakturor(nyaFakturor);
    };

    const handler = () => reload();
    window.addEventListener("reloadFakturor", handler);
    return () => window.removeEventListener("reloadFakturor", handler);
  }, []);
  //#endregion

  // Props till Forhandsgranskning
  const lönespec = formData;
  const anställd = {
    förnamn: formData.kundnamn,
    efternamn: "",
    user_id: formData.kundId,
    ...formData,
  };
  const företagsprofil = {
    företagsnamn: formData.företagsnamn,
    adress: formData.adress,
    postnummer: formData.postnummer,
    stad: formData.stad,
    organisationsnummer: formData.organisationsnummer,
    momsregistreringsnummer: formData.momsregistreringsnummer,
    telefonnummer: formData.telefonnummer,
    epost: formData.epost,
    bankinfo: formData.bankinfo,
    webbplats: formData.webbplats,
    logo: formData.logo,
    logoWidth: formData.logoWidth,
  };
  const extrarader = formData.artiklar || [];
  const handleStäng = () => setShowPreview(false);

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          {showAllFlikar && (
            <div className="absolute left-0 top-1">
              <BakåtPil onClick={() => setShowAllFlikar(false)} className="">
                Tillbaka
              </BakåtPil>
            </div>
          )}
          <h1 className="text-3xl text-center w-full">Fakturor</h1>
        </div>

        {!showAllFlikar && (
          <AnimeradFlik title="Sparade fakturor" icon="📂" forcedOpen>
            <SparadeFakturor
              fakturor={fakturor}
              activeInvoiceId={currentInvoiceId}
              onSelectInvoice={hanteraValdFaktura}
            />
          </AnimeradFlik>
        )}

        {!showAllFlikar && (
          <div className="flex justify-center my-8">
            <Knapp
              text="📝 Ny faktura"
              onClick={() => {
                /* Töm formuläret om du vill börja på ny faktura */
                setShowAllFlikar(true);
              }}
            />
          </div>
        )}

        {showAllFlikar && (
          <>
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
              <Alternativ
                onReload={() => window.location.reload()}
                onPreview={() => setShowPreview(true)}
              />
            </AnimeradFlik>
          </>
        )}
      </MainLayout>

      <div id="print-area" className="hidden print:block">
        <Forhandsgranskning />
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl border border-gray-300 rounded-none">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={() => setShowPreview(false)} text="❌ Stäng" />
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

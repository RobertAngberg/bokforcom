// Ny faktura komponent

//#region Imports och types
"use client";

import { useEffect, useState } from "react";
import { FakturaProvider } from "../_components/FakturaProvider";
import { useFakturaContext } from "../_components/FakturaProvider";
import { useSession } from "next-auth/react";
import KundUppgifter from "../_components/KundUppgifter";
import { validateEmail } from "../../login/sakerhet/loginValidation";
import ProdukterTjanster from "../ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import AnimeradFlik from "../../_components/AnimeradFlik";
import TillbakaPil from "../../_components/TillbakaPil";
import Knapp from "../../_components/Knapp";
import MainLayout from "../../_components/MainLayout";
import Alternativ from "../Alternativ/Alternativ";
import Betalning from "../_components/Betalning";
import Avsandare from "../_components/Avsandare";
import { hämtaFöretagsprofil, hämtaSparadeKunder, hämtaSparadeArtiklar } from "../actions";
import Link from "next/link";
//#endregion

//#region Business Logic - Migrated from actions.ts
// Säker text-sanitering för fakturor
function sanitizeFakturaInput(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Ta bort potentiellt farliga tecken
    .substring(0, 255); // Begränsa längd
}

// Säker numerisk validering för fakturor
function validateNumericFakturaInput(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
}

// Säker JSON-parsing med validering
function safeParseFakturaJSON(jsonString: string): any[] {
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Datum-formatering för fakturor
function formatDate(str: string | null): string | null {
  if (!str) return null;
  const d = new Date(str);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

// Beräkna default datum (30 dagar framåt)
function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

// Beräkna totalbelopp för faktura med moms
function calculateTotalBelopp(artiklar: any[]): number {
  const total = artiklar.reduce((sum, artikel) => {
    const prisInkMoms = artikel.prisPerEnhet * (1 + artikel.moms / 100);
    return sum + artikel.antal * prisInkMoms;
  }, 0);
  return Math.round(total * 100) / 100; // Avrunda till 2 decimaler
}

// Validera artikel-data
function validateArtikel(artikel: any): { isValid: boolean; error?: string } {
  if (!artikel.beskrivning || sanitizeFakturaInput(artikel.beskrivning).length < 2) {
    return { isValid: false, error: "Alla artiklar måste ha en giltig beskrivning" };
  }

  if (!validateNumericFakturaInput(artikel.antal) || artikel.antal <= 0) {
    return { isValid: false, error: "Ogiltigt antal i artikel" };
  }

  if (!validateNumericFakturaInput(artikel.prisPerEnhet) || artikel.prisPerEnhet < 0) {
    return { isValid: false, error: "Ogiltigt pris i artikel" };
  }

  if (!validateNumericFakturaInput(artikel.moms) || artikel.moms < 0 || artikel.moms > 100) {
    return { isValid: false, error: "Ogiltig moms i artikel" };
  }

  return { isValid: true };
}

// Validera fakturadata
function validateFakturaData(formData: any): { isValid: boolean; error?: string } {
  // Validera kund
  if (!formData.kundId || formData.kundId <= 0) {
    return { isValid: false, error: "Kund måste väljas" };
  }

  // Validera fakturanummer
  const fakturanummer = sanitizeFakturaInput(formData.fakturanummer || "");
  if (!fakturanummer || fakturanummer.length < 1) {
    return { isValid: false, error: "Fakturanummer krävs" };
  }

  // Validera kundnamn
  const kundnamn = sanitizeFakturaInput(formData.kundnamn || "");
  if (!kundnamn || kundnamn.length < 2) {
    return { isValid: false, error: "Giltigt kundnamn krävs" };
  }

  // Validera email om angivet
  if (formData.kundemail && !validateEmail(formData.kundemail)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  // Validera artiklar
  if (!formData.artiklar || formData.artiklar.length === 0) {
    return { isValid: false, error: "Fakturan måste ha minst en artikel" };
  }

  // Validera varje artikel
  for (const artikel of formData.artiklar) {
    const validation = validateArtikel(artikel);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}
//#endregion

function NyFakturaComponent({ kunder, artiklar }: { kunder: any[]; artiklar: any[] }) {
  //#region Context och state
  const { formData, setFormData } = useFakturaContext();
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  //#endregion

  //#region Ladda företagsdata centralt när session är tillgänglig
  useEffect(() => {
    if (session?.user?.id && !formData.företagsnamn) {
      hämtaFöretagsprofil(session.user.id).then((profil: any) => {
        if (profil) {
          setFormData((prev: any) => ({
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

  // Nollställ formData när komponenten laddas (ny faktura)
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      id: "",
      fakturanummer: "",
      fakturadatum: "",
      forfallodatum: "",
      kundnamn: "",
      kundId: "",
      kundnummer: "",
      kundorganisationsnummer: "",
      kundadress: "",
      kundpostnummer: "",
      kundstad: "",
      kundemail: "",
      artiklar: [],
    }));
  }, [setFormData]);
  //#endregion

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute left-0 top-1">
            <Link
              href="/faktura"
              className="flex items-center gap-2 text-white font-bold px-3 py-2 rounded hover:bg-gray-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Tillbaka
            </Link>
          </div>
          <h1 className="text-2xl text-center w-full">
            {formData.fakturanummer && formData.kundnamn
              ? `🧾 Faktura #${formData.fakturanummer} - ${formData.kundnamn}`
              : formData.fakturanummer
                ? `🧾 Faktura #${formData.fakturanummer}`
                : "Ny Faktura"}
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
          <Alternativ
            onReload={() => {
              if (confirm("🔄 Vill du verkligen återställa? All ifylld data försvinner.")) {
                window.location.reload();
              }
            }}
            onPreview={() => setShowPreview(true)}
          />
        </AnimeradFlik>
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

// Data-loading wrapper för att hålla server-side funktionaliteten
async function DataLoader() {
  const [kunder, artiklar] = await Promise.all([hämtaSparadeKunder(), hämtaSparadeArtiklar()]);

  return { kunder, artiklar };
}

export default function NyFakturaPage() {
  const [data, setData] = useState<{ kunder: any[]; artiklar: any[] } | null>(null);

  useEffect(() => {
    DataLoader().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 overflow-x-hidden px-4 py-10 text-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="w-full p-8 bg-cyan-950 border border-cyan-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                <p className="text-slate-100 text-lg">Laddar...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FakturaProvider>
      <NyFakturaComponent kunder={data.kunder} artiklar={data.artiklar} />
    </FakturaProvider>
  );
}

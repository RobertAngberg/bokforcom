"use client";

import { useState, useEffect } from "react";
import { useFakturaContext } from "../FakturaProvider";
import { bokförFaktura, hämtaBokföringsmetod, hämtaFakturaStatus } from "../actions";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Modal from "../../_components/Modal";
import Toast from "../../_components/Toast";

//#region Business Logic - Migrated from actions.ts
// Validera bokföringspost (flyttad från actions.ts)
function validateBokföringsPost(post: BokföringsPost): { isValid: boolean; error?: string } {
  if (!post.konto || !/^\d{4}$/.test(post.konto.toString())) {
    return { isValid: false, error: "Ogiltigt kontonummer (måste vara 4 siffror)" };
  }

  if (isNaN(post.debet) || isNaN(post.kredit) || post.debet < 0 || post.kredit < 0) {
    return { isValid: false, error: "Ogiltiga belopp i bokföringsposter" };
  }

  if (post.debet > 0 && post.kredit > 0) {
    return { isValid: false, error: "En post kan inte ha både debet och kredit" };
  }

  return { isValid: true };
}

// Validera bokföringens balans (flyttad från actions.ts)
function validateBokföringsBalance(poster: BokföringsPost[]): { isValid: boolean; error?: string } {
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  if (Math.abs(totalDebet - totalKredit) > 0.01) {
    return {
      isValid: false,
      error: `Bokföringen balanserar inte! Debet: ${totalDebet.toFixed(2)}, Kredit: ${totalKredit.toFixed(2)}`,
    };
  }

  return { isValid: true };
}

// Validera all bokföringsdata (flyttad från actions.ts)
function validateBokföringsData(data: any): { isValid: boolean; error?: string } {
  if (!data.fakturanummer || data.fakturanummer.trim().length === 0) {
    return { isValid: false, error: "Fakturanummer krävs" };
  }

  if (!data.kundnamn || data.kundnamn.trim().length === 0) {
    return { isValid: false, error: "Kundnamn krävs" };
  }

  if (!data.poster || !Array.isArray(data.poster) || data.poster.length === 0) {
    return { isValid: false, error: "Minst en bokföringspost krävs" };
  }

  if (isNaN(data.totaltBelopp) || data.totaltBelopp <= 0) {
    return { isValid: false, error: "Ogiltigt totalbelopp" };
  }

  // Validera varje post
  for (const post of data.poster) {
    const validation = validateBokföringsPost(post);
    if (!validation.isValid) {
      return validation;
    }
  }

  // Validera balans
  const balanceValidation = validateBokföringsBalance(data.poster);
  if (!balanceValidation.isValid) {
    return balanceValidation;
  }

  return { isValid: true };
}

// Avgör om det är en betalningsregistrering (flyttad från actions.ts)
function isPaymentRegistration(poster: BokföringsPost[]): boolean {
  const harBankKonto = poster.some((p) => p.konto === "1930" || p.konto === "1910");
  const harKundfordringar = poster.some((p) => p.konto === "1510");
  return harBankKonto && harKundfordringar && poster.length === 2;
}

// Avgör om det är kontantmetod (flyttad från actions.ts)
function isKontantmetod(poster: BokföringsPost[]): boolean {
  const harBankKontantmetod = poster.some((p) => p.konto === "1930");
  const harIngenKundfordringar = !poster.some((p) => p.konto === "1510");
  return harBankKontantmetod && harIngenKundfordringar;
}
//#endregion

interface BokförFakturaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

export default function BokförFakturaModal({ isOpen, onClose }: BokförFakturaModalProps) {
  const { formData } = useFakturaContext();
  const [loading, setLoading] = useState(false);
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("kontantmetoden");
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
  }>({});
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Hämta användarens bokföringsmetod och fakturaSTATUS från databasen
  useEffect(() => {
    if (isOpen) {
      setStatusLoaded(false);
      hämtaBokföringsmetod().then(setBokföringsmetod);

      // Hämta fakturaSTATUS om ID finns
      if (formData.id) {
        console.log("🔍 Hämtar status för faktura ID:", formData.id);
        hämtaFakturaStatus(parseInt(formData.id)).then((status) => {
          console.log("📊 Fakturasstatus:", status);
          setFakturaStatus(status);
          setStatusLoaded(true);
        });
      } else {
        console.log("❌ Inget faktura ID hittades");
        setStatusLoaded(true);
      }
    }
  }, [isOpen, formData.id]);

  if (!isOpen) return null;

  // Wait for status to be loaded before rendering the modal content
  if (!statusLoaded) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`📊 Bokför faktura ${formData.fakturanummer}`}
        maxWidth="4xl"
      >
        <div className="text-center py-8">
          <div className="text-white">⏳ Laddar fakturasstatus...</div>
        </div>
      </Modal>
    );
  }

  const ärKontantmetod = bokföringsmetod === "kontantmetoden";

  // Analysera fakturan och föreslå bokföringsposter
  const analyseraBokföring = (): { poster: BokföringsPost[]; varningar: string[] } => {
    const varningar: string[] = [];
    const poster: BokföringsPost[] = [];

    // Validera grunddata
    if (!formData.artiklar || formData.artiklar.length === 0) {
      varningar.push("Fakturan saknar artiklar/tjänster");
      return { poster, varningar };
    }

    // Beräkna totalt belopp
    const totalExMoms = formData.artiklar.reduce(
      (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet,
      0
    );

    const totalMoms = formData.artiklar.reduce(
      (sum, artikel) => sum + (artikel.antal * artikel.prisPerEnhet * artikel.moms) / 100,
      0
    );

    const totalInkMoms = totalExMoms + totalMoms;

    if (totalInkMoms <= 0) {
      varningar.push("Fakturans totalbelopp är 0 eller negativt");
      return { poster, varningar };
    }

    // KONTROLLERA OM FAKTURAN REDAN ÄR BOKFÖRD
    console.log("🔍 Kollar fakturaStatus:", fakturaStatus);
    if (fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd") {
      // Fakturan är redan bokförd - visa bara betalningsregistrering
      if (fakturaStatus.status_betalning !== "Betald") {
        // Kolla om det finns ROT/RUT-artiklar för att beräkna kundens del
        const harRotRutArtiklar =
          formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;
        const betalningsbelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : totalInkMoms; // Endast kundens del för ROT/RUT

        // Om det är "Delvis betald" (ROT/RUT där kunden redan betalat), visa inte betalningsregistrering
        if (fakturaStatus.status_betalning === "Delvis betald") {
          varningar.push(
            "💰 Fakturan är delvis betald. Kunden har betalat sin del. Använd ROT/RUT-betalningsknappen för SKV:s del."
          );
          return { poster, varningar };
        }

        poster.push({
          konto: "1930", // Bank/Kassa
          kontoNamn: "Företagskonto/Bankkonto",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: betalningsbelopp,
          kredit: 0,
        });

        poster.push({
          konto: "1510",
          kontoNamn: "Kundfordringar",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: 0,
          kredit: betalningsbelopp,
        });

        if (harRotRutArtiklar) {
          varningar.push(
            "⚠️ Fakturan är redan bokförd. Detta registrerar KUNDENS betalning (50%). ROT/RUT-delen registreras separat när SKV betalar."
          );
        } else {
          varningar.push("⚠️ Fakturan är redan bokförd. Detta registrerar betalning.");
        }
      } else {
        // Kolla om det finns ROT/RUT-artiklar för att visa rätt meddelande
        const harRotRutArtiklar =
          formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;

        if (harRotRutArtiklar) {
          varningar.push("✅ Fakturan är redan bokförd och betald.");
          varningar.push(
            "För ROT/RUT-utbetalning från SKV: ändra ROT/RUT-status till 'Väntar på SKV' och använd sen ROT/RUT-betalningsknappen."
          );
        } else {
          varningar.push("✅ Fakturan är redan bokförd och betald.");
        }
        return { poster, varningar };
      }

      return { poster, varningar };
    }

    // NORMAL BOKFÖRING (om ej bokförd)
    // Avgör om det är vara eller tjänst (majoriteten)
    const varor = formData.artiklar.filter((a) => a.typ === "vara").length;
    const tjänster = formData.artiklar.filter((a) => a.typ === "tjänst").length;

    let intäktskonto: string;
    let kontoNamn: string;

    if (varor > tjänster) {
      intäktskonto = "3001";
      kontoNamn = "Försäljning varor";
    } else if (tjänster > varor) {
      intäktskonto = "3011";
      kontoNamn = "Försäljning tjänster";
    } else {
      varningar.push("Oklart om det är varor eller tjänster - lika många av varje typ");
      intäktskonto = "3011"; // Default till tjänster
      kontoNamn = "Försäljning tjänster";
    }

    // Kolla om det finns ROT/RUT-artiklar
    const harRotRutArtiklar = formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;
    const rotRutBelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : 0; // 50% av totalen
    const kundBelopp = harRotRutArtiklar ? totalInkMoms - rotRutBelopp : totalInkMoms;

    // Skapa bokföringsposter
    // 1. Kundfordran eller Bank/Kassa beroende på metod (kundens del)
    const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
    const skuld_tillgångsnamn = ärKontantmetod ? "Bank/Kassa" : "Kundfordringar";

    poster.push({
      konto: skuld_tillgångskonto,
      kontoNamn: skuld_tillgångsnamn,
      debet: kundBelopp,
      kredit: 0,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

    // 1b. ROT/RUT-fordran (SKV:s del) - om det finns ROT/RUT
    if (harRotRutArtiklar && rotRutBelopp > 0) {
      poster.push({
        konto: "1513",
        kontoNamn: "Kundfordringar – delad faktura",
        debet: rotRutBelopp,
        kredit: 0,
        beskrivning: `ROT/RUT-del faktura ${formData.fakturanummer}`,
      });
    }

    // 2. Intäkt (kredit)
    poster.push({
      konto: intäktskonto,
      kontoNamn: kontoNamn,
      debet: 0,
      kredit: totalExMoms,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

    // 3. Utgående moms (kredit) - endast om det finns moms
    if (totalMoms > 0) {
      poster.push({
        konto: "2610",
        kontoNamn: "Utgående moms 25%",
        debet: 0,
        kredit: totalMoms,
        beskrivning: `Moms faktura ${formData.fakturanummer}`,
      });
    }

    return { poster, varningar };
  };

  const { poster, varningar } = analyseraBokföring();

  // Kolumn-definitioner för tabellen
  const columns: ColumnDefinition<BokföringsPost>[] = [
    {
      key: "konto",
      label: "Konto",
    },
    {
      key: "kontoNamn",
      label: "Kontonamn",
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
    },
    {
      key: "debet",
      label: "Debet",
      render: (value) => (value > 0 ? value.toFixed(2) : ""),
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value) => (value > 0 ? value.toFixed(2) : ""),
    },
  ];

  // Använd poster direkt utan summa-rad
  const posterMedSumma = poster;
  const hanteraBokför = async () => {
    setLoading(true);
    try {
      // KOLLA OM FAKTURAN ÄR SPARAD FÖRST
      if (!formData.id) {
        setToast({
          message: "Fakturan måste sparas innan den kan bokföras!\n\nKlicka 'Spara faktura' först.",
          type: "error",
          isVisible: true,
        });
        setLoading(false);
        return;
      }

      const totalInkMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
          0
        ) || 0;

      // Frontend-validering med migerade funktioner
      const bokföringsData = {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
      };

      const validation = validateBokföringsData(bokföringsData);
      if (!validation.isValid) {
        setToast({
          message: validation.error || "Valideringsfel",
          type: "error",
          isVisible: true,
        });
        setLoading(false);
        return;
      }

      const result = await bokförFaktura(bokföringsData);

      console.log("🔥 BOKFÖR DATA:", {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        formDataId: formData.id,
        fakturanummer: formData.fakturanummer,
      });

      if (result.success) {
        setToast({
          message: result.message || "Bokföring genomförd",
          type: "success",
          isVisible: true,
        });
        // Skicka event för att uppdatera fakturaslistan
        window.dispatchEvent(new Event("reloadFakturor"));
        onClose();
      } else {
        setToast({
          message: `Bokföringsfel: ${result.error}`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Bokföringsfel:", error);
      setToast({
        message: "Fel vid bokföring",
        type: "error",
        isVisible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 Bokför faktura ${formData.fakturanummer}`}
      maxWidth="4xl"
    >
      {/* Information */}
      {varningar.length > 0 && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded">
          <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            💡 Information:
          </h3>
          <ul className="text-blue-200 space-y-1">
            {varningar.map((varning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <div>
                  {varning
                    .replace(/^⚠️\s*/, "")
                    .split("\n")
                    .map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Faktura-info */}
      <div className="mb-6 p-4 bg-slate-700 rounded">
        <h3 className="text-white font-semibold mb-2">Fakturanuppgifter:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Kund:</span>
            <span className="text-white ml-2">{formData.kundnamn}</span>
          </div>
          <div>
            <span className="text-gray-400">Fakturanummer:</span>
            <span className="text-white ml-2">{formData.fakturanummer}</span>
          </div>
          <div>
            <span className="text-gray-400">Antal artiklar:</span>
            <span className="text-white ml-2">{formData.artiklar?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-400">Totalt inkl. moms:</span>
            <span className="text-white ml-2">
              {formData.artiklar
                ?.reduce(
                  (sum, artikel) =>
                    sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
                  0
                )
                .toFixed(2)}{" "}
              kr
            </span>
          </div>
        </div>
      </div>

      {/* Bokföringsposter */}
      {poster.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-4">Föreslagna bokföringsposter:</h3>

          <Tabell
            data={posterMedSumma}
            columns={columns}
            getRowId={(item) => `${item.konto}-${item.beskrivning}`}
          />
        </div>
      )}

      {/* Knappar */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Avbryt
        </button>
        <button
          onClick={hanteraBokför}
          disabled={loading || poster.length === 0}
          className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>⏳ Bokför...</>
          ) : fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd" ? (
            <>💰 Registrera betalning</>
          ) : ärKontantmetod ? (
            <>📚 Bokför betalning till Bank/Kassa</>
          ) : (
            <>📚 Bokför faktura till Kundfordringar</>
          )}
        </button>
      </div>

      {/* Info längst ner */}
      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <div>
          Bokföringsmetod:{" "}
          <span className="text-white">
            {ärKontantmetod ? "💰 Kontantmetod" : "📄 Fakturametoden"}
          </span>
        </div>
        <div>
          {/* Visa olika text beroende på vad som händer */}
          {fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd"
            ? // Betalningsregistrering - fakturan är redan bokförd
              "💰 Intäkten är redan registrerad, nu registreras betalningen."
            : ärKontantmetod
              ? // Kontantmetod - intäkt och betalning samtidigt
                "💡 Intäkten och betalningen registreras samtidigt till Bank/Kassa."
              : // Fakturametoden - intäkt först, betalning senare
                "💡 Intäkten registreras nu, betalning bokförs senare."}
        </div>
      </div>

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </Modal>
  );
}

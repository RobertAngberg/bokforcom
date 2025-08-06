"use client";

import { useState, useEffect } from "react";
import { useFakturaContext } from "../FakturaProvider";
import { bokförFaktura, hämtaBokföringsmetod, hämtaFakturaStatus } from "../actions";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import Modal from "../../_components/Modal";

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

  // Hämta användarens bokföringsmetod och fakturaSTATUS från databasen
  useEffect(() => {
    if (isOpen) {
      hämtaBokföringsmetod().then(setBokföringsmetod);

      // Hämta fakturaSTATUS om ID finns
      if (formData.id) {
        console.log("🔍 Hämtar status för faktura ID:", formData.id);
        hämtaFakturaStatus(parseInt(formData.id)).then((status) => {
          console.log("📊 Fakturasstatus:", status);
          setFakturaStatus(status);
        });
      } else {
        console.log("❌ Inget faktura ID hittades");
      }
    }
  }, [isOpen, formData.id]);

  if (!isOpen) return null;

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
        poster.push({
          konto: "1930", // Bank/Kassa
          kontoNamn: "Företagskonto/Bankkonto",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: totalInkMoms,
          kredit: 0,
        });

        poster.push({
          konto: "1510",
          kontoNamn: "Kundfordringar",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: 0,
          kredit: totalInkMoms,
        });

        varningar.push("⚠️ Fakturan är redan bokförd. Detta registrerar betalning.");
      } else {
        varningar.push("✅ Fakturan är redan bokförd och betald.");
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

    // Skapa bokföringsposter
    // 1. Kundfordran eller Bank/Kassa beroende på metod
    const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
    const skuld_tillgångsnamn = ärKontantmetod ? "Bank/Kassa" : "Kundfordringar";

    poster.push({
      konto: skuld_tillgångskonto,
      kontoNamn: skuld_tillgångsnamn,
      debet: totalInkMoms,
      kredit: 0,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

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
      const totalInkMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
          0
        ) || 0;

      const result = await bokförFaktura({
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
      });

      console.log("🔥 BOKFÖR DATA:", {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        formDataId: formData.id,
        fakturanummer: formData.fakturanummer,
      });

      if (result.success) {
        alert(`✅ ${result.message}`);
        onClose();
      } else {
        alert(`❌ Bokföringsfel: ${result.error}`);
      }
    } catch (error) {
      console.error("Bokföringsfel:", error);
      alert("❌ Fel vid bokföring");
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
      {/* Varningar */}
      {varningar.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Varningar:</h3>
          <ul className="text-yellow-200 space-y-1">
            {varningar.map((varning, index) => (
              <li key={index}>• {varning}</li>
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
          disabled={loading || poster.length === 0 || varningar.length > 0}
          className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>⏳ Bokför...</>
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
          {ärKontantmetod
            ? "💡 Intäkten registreras när betalning kommer in."
            : "💡 Intäkten registreras nu, betalning bokförs senare."}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { useFakturaContext } from "../FakturaProvider";
import { bokförFaktura } from "../actions";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";

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

  if (!isOpen) return null;

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
    // 1. Kundfordran (debet)
    poster.push({
      konto: "1510",
      kontoNamn: "Kundfordringar",
      debet: totalInkMoms,
      kredit: 0,
      beskrivning: `Faktura ${formData.fakturanummer} - ${formData.kundnamn}`,
    });

    // 2. Intäkt (kredit)
    poster.push({
      konto: intäktskonto,
      kontoNamn: kontoNamn,
      debet: 0,
      kredit: totalExMoms,
      beskrivning: `Faktura ${formData.fakturanummer} - ${formData.kundnamn}`,
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

  // Kolumndefinitioner för tabellen
  const columns: ColumnDefinition<BokföringsPost>[] = [
    {
      key: "konto",
      label: "Konto",
      render: (value) => <span className="text-cyan-400">{value}</span>,
    },
    {
      key: "kontoNamn",
      label: "Kontonamn",
      render: (value) => <span className="text-white">{value}</span>,
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
      render: (value, row) => (
        <span
          className={`${row.beskrivning?.includes("SUMMA") ? "text-white font-semibold" : "text-gray-300"}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "debet",
      label: "Debet",
      render: (value, row) => (
        <span
          className={`text-right block ${row.beskrivning?.includes("SUMMA") ? "text-white font-semibold" : "text-white"}`}
        >
          {value > 0 ? value.toFixed(2) : ""}
        </span>
      ),
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value, row) => (
        <span
          className={`text-right block ${row.beskrivning?.includes("SUMMA") ? "text-white font-semibold" : "text-white"}`}
        >
          {value > 0 ? value.toFixed(2) : ""}
        </span>
      ),
    },
  ];

  // Lägg till summeringsrad
  const posterMedSumma = [
    ...poster,
    {
      konto: "",
      kontoNamn: "",
      beskrivning: "--- SUMMA ---",
      debet: poster.reduce((sum, p) => sum + p.debet, 0),
      kredit: poster.reduce((sum, p) => sum + p.kredit, 0),
    } as BokföringsPost,
  ];

  const hanteraBokför = async () => {
    setLoading(true);
    try {
      const totalInkMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
          0
        ) || 0;

      const result = await bokförFaktura({
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-cyan-400">
            📊 Bokför faktura {formData.fakturanummer}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

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
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? "Bokför..." : "📊 Bokför"}
          </button>
        </div>
      </div>
    </div>
  );
}

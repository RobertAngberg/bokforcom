import { useState } from "react";
import Knapp from "../../../../_components/Knapp";
import type { ExtraRad, SimpleBokföringsPost } from "../../../types/types";

export default function BokförLönTest() {
  const [grundlön, setGrundlön] = useState(35000);
  const [extrarader, setExtrarader] = useState<ExtraRad[]>([]);

  // Lägg till ny extrarad
  const läggTillRad = () => {
    const nyRad: ExtraRad = {
      id: Date.now().toString(),
      typ: "lön",
      antal: 1,
      belopp: 0,
      tillagd: false,
    };
    setExtrarader([...extrarader, nyRad]);
  };

  // Ta bort extrarad
  const taBortRad = (id: string) => {
    setExtrarader(extrarader.filter((rad) => rad.id !== id));
  };

  // Markera extrarad som tillagd
  const markeraSomTillagd = (id: string) => {
    setExtrarader(extrarader.map((rad) => (rad.id === id ? { ...rad, tillagd: true } : rad)));
  };

  // Uppdatera extrarad
  const uppdateraRad = (id: string, field: keyof ExtraRad, value: any) => {
    setExtrarader(extrarader.map((rad) => (rad.id === id ? { ...rad, [field]: value } : rad)));
  };

  // Beräkna totaler och bokföringsposter
  const beräknaBokföring = (): {
    bruttolön: number;
    socialaAvgifter: number;
    skatt: number;
    nettolön: number;
    poster: SimpleBokföringsPost[];
  } => {
    let bruttolön = grundlön;
    let skattefriaTraktamenten = 0;
    let bilersättningar = 0;
    let skattadaFörmåner = 0;
    let semester = 0;
    let poster: SimpleBokföringsPost[] = [];

    // Bearbeta extrarader
    extrarader.forEach((rad) => {
      const totalBelopp = rad.antal * rad.belopp;

      switch (rad.typ) {
        case "vab":
        case "föräldraledighet":
          // VAB och föräldraledighet är -1610 kr per dag (vid 35k grundlön)
          const dagslön = 1610; // Baserat på 35k månadslön
          bruttolön -= rad.antal * dagslön;
          break;

        case "skattefri_traktamente_inrikes":
          skattefriaTraktamenten += totalBelopp;
          // Lägg bara till post om raden är markerad som tillagd
          if (rad.tillagd) {
            poster.push({
              konto: "7321",
              kontoNamn: "Skattefria traktamenten, Sverige",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "skattefri_traktamente_utrikes":
          skattefriaTraktamenten += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7323",
              kontoNamn: "Skattefria traktamenten, utlandet",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "bilersättning_privat":
        case "bilersättning_företag":
          bilersättningar += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7331",
              kontoNamn: "Skattefria bilersättningar",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "fri_bil":
          skattadaFörmåner += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7385",
              kontoNamn: "Kostnader för fri bil",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "fri_bostad":
          skattadaFörmåner += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7381",
              kontoNamn: "Kostnader för fri bostad",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "fri_mat":
          skattadaFörmåner += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7382",
              kontoNamn: "Kostnader för fria eller subventionerade måltider",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "övrig_förmån":
          skattadaFörmåner += totalBelopp;
          if (rad.tillagd) {
            poster.push({
              konto: "7389",
              kontoNamn: "Övriga kostnader för förmåner",
              debet: totalBelopp,
              kredit: 0,
            });
          }
          break;

        case "semesterlön":
          semester += totalBelopp;
          bruttolön += totalBelopp;
          break;

        case "övertid":
        case "ob_tillägg":
        case "risktillägg":
          bruttolön += totalBelopp;
          break;

        case "obetald_frånvaro":
          bruttolön -= totalBelopp;
          break;
      }
    });

    // Beräkna skattepliktig bruttolön (inkl förmåner)
    const skattepliktBruttolön = bruttolön + skattadaFörmåner;

    // Sociala avgifter (31.42% av skattepliktig bruttolön)
    const socialaAvgifterNormal = Math.round(skattepliktBruttolön * 0.3142 * 100) / 100;

    // Extra sociala avgifter på förmåner (31.42% av förmåner)
    const socialaAvgifterFörmåner = Math.round(skattadaFörmåner * 0.3142 * 100) / 100;

    const totalaSocialaAvgifter = socialaAvgifterNormal;

    // Skatt (ca 22% av skattepliktig bruttolön - förenklad)
    const skatt = Math.round(skattepliktBruttolön * 0.22 * 100) / 100;

    // Nettolön
    const nettolön = bruttolön - skatt + skattefriaTraktamenten + bilersättningar;

    // Huvudposter
    const huvudPoster: SimpleBokföringsPost[] = [
      {
        konto: "7210",
        kontoNamn: "Löner till tjänstemän",
        debet: bruttolön - semester,
        kredit: 0,
      },
      {
        konto: "7510",
        kontoNamn: "Lagstadgade sociala avgifter",
        debet: socialaAvgifterNormal,
        kredit: 0,
      },
      {
        konto: "1930",
        kontoNamn: "Företagskonto / affärskonto",
        debet: 0,
        kredit: nettolön,
      },
      {
        konto: "2710",
        kontoNamn: "Personalskatt",
        debet: 0,
        kredit: skatt,
      },
      {
        konto: "2731",
        kontoNamn: "Avräkning lagstadgade sociala avgifter",
        debet: 0,
        kredit: totalaSocialaAvgifter,
      },
    ];

    // Lägg till semester om det finns
    if (semester > 0) {
      huvudPoster.push({
        konto: "7285",
        kontoNamn: "Semesterlöner till tjänstemän",
        debet: semester,
        kredit: 0,
      });
    }

    // Lägg till motkonto för skattepliktiga förmåner om det finns
    if (skattadaFörmåner > 0) {
      huvudPoster.push({
        konto: "7399",
        kontoNamn: "Motkonto skattepliktiga förmåner",
        debet: 0,
        kredit: skattadaFörmåner,
      });

      // Extra sociala avgifter för förmåner
      if (socialaAvgifterFörmåner > 0) {
        huvudPoster.push({
          konto: "7515",
          kontoNamn: "Sociala avgifter på skattepliktiga kostnadsersättningar",
          debet: socialaAvgifterFörmåner,
          kredit: 0,
        });
      }
    }

    return {
      bruttolön: skattepliktBruttolön,
      socialaAvgifter: totalaSocialaAvgifter,
      skatt,
      nettolön,
      poster: [...huvudPoster, ...poster].filter((p) => p.debet > 0 || p.kredit > 0),
    };
  };

  const { bruttolön, socialaAvgifter, skatt, nettolön, poster } = beräknaBokföring();
  const totalDebet = poster.reduce((sum, p) => sum + p.debet, 0);
  const totalKredit = poster.reduce((sum, p) => sum + p.kredit, 0);

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🧪 Bokför Lön - Test</h1>

      {/* Grundlön */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Grundlön</h2>
        <div className="flex gap-4 items-center">
          <label>Månadslön:</label>
          <input
            type="number"
            value={grundlön}
            onChange={(e) => setGrundlön(Number(e.target.value))}
            className="bg-slate-700 p-2 rounded w-32"
          />
          <span>kr</span>
        </div>
      </div>

      {/* Extrarader */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Extrarader</h2>
          <Knapp text="+ Lägg till rad" onClick={läggTillRad} />
        </div>

        {/* Kolumnrubriker */}
        {extrarader.length > 0 && (
          <div className="grid grid-cols-5 gap-4 mb-3 text-sm font-semibold text-slate-300 border-b border-slate-600 pb-2">
            <div>Typ</div>
            <div>Antal</div>
            <div>Belopp</div>
            <div>Totalt</div>
            <div>Åtgärder</div>
          </div>
        )}

        {extrarader.map((rad) => (
          <div key={rad.id} className="grid grid-cols-5 gap-4 mb-3 items-center">
            <select
              value={rad.typ}
              onChange={(e) => uppdateraRad(rad.id, "typ", e.target.value)}
              className="bg-slate-700 p-2 rounded"
            >
              <option value="lön">Lön/OB/Övertid</option>
              <option value="vab">VAB (-1610 kr/dag)</option>
              <option value="föräldraledighet">Föräldraledighet (-1610 kr/dag)</option>
              <option value="skattefri_traktamente_inrikes">Traktamente Sverige</option>
              <option value="skattefri_traktamente_utrikes">Traktamente Utland</option>
              <option value="bilersättning_privat">Bilersättning Privat</option>
              <option value="bilersättning_företag">Bilersättning Företag</option>
              <option value="fri_bil">Fri bil</option>
              <option value="fri_bostad">Fri bostad</option>
              <option value="fri_mat">Fri mat</option>
              <option value="övrig_förmån">Övrig förmån</option>
              <option value="semesterlön">Semesterlön</option>
              <option value="övertid">Övertid</option>
              <option value="ob_tillägg">OB-tillägg</option>
              <option value="risktillägg">Risktillägg</option>
              <option value="obetald_frånvaro">Obetald frånvaro</option>
            </select>

            <input
              type="number"
              placeholder="Antal"
              value={rad.antal}
              onChange={(e) => uppdateraRad(rad.id, "antal", Number(e.target.value))}
              className="bg-slate-700 p-2 rounded w-20"
            />

            <input
              type="number"
              placeholder={
                rad.typ === "vab" || rad.typ === "föräldraledighet" ? "1610 kr/dag" : "Belopp"
              }
              value={rad.typ === "vab" || rad.typ === "föräldraledighet" ? 1610 : rad.belopp}
              onChange={(e) => uppdateraRad(rad.id, "belopp", Number(e.target.value))}
              className="bg-slate-700 p-2 rounded w-24"
              readOnly={rad.typ === "vab" || rad.typ === "föräldraledighet"}
              disabled={rad.typ === "vab" || rad.typ === "föräldraledighet"}
            />

            <span className="text-sm">
              ={" "}
              {rad.typ === "vab" || rad.typ === "föräldraledighet"
                ? `${(rad.antal * -1610).toLocaleString("sv-SE")} kr`
                : `${(rad.antal * rad.belopp).toLocaleString("sv-SE")} kr`}
            </span>

            <div className="flex gap-2">
              {!rad.tillagd && (
                <button
                  onClick={() => markeraSomTillagd(rad.id)}
                  className="text-green-400 hover:text-green-300 px-2 py-1 bg-green-900 rounded text-xs"
                >
                  Lägg till
                </button>
              )}
              {rad.tillagd && <span className="text-green-400 text-xs px-2 py-1">✓ Tillagd</span>}
              <button onClick={() => taBortRad(rad.id)} className="text-red-400 hover:text-red-300">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sammanfattning */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">📊 Sammanfattning</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            Bruttolön (skattepliktig): <strong>{bruttolön.toLocaleString("sv-SE")} kr</strong>
          </div>
          <div>
            Sociala avgifter: <strong>{socialaAvgifter.toLocaleString("sv-SE")} kr</strong>
          </div>
          <div>
            Skatt: <strong>{skatt.toLocaleString("sv-SE")} kr</strong>
          </div>
          <div>
            Nettolön: <strong>{nettolön.toLocaleString("sv-SE")} kr</strong>
          </div>
        </div>
      </div>

      {/* Bokföringsposter */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">📋 Bokföringsposter</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left p-2">Konto</th>
                <th className="text-left p-2">Beskrivning</th>
                <th className="text-right p-2">Debet</th>
                <th className="text-right p-2">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {poster
                .sort((a, b) => a.konto.localeCompare(b.konto))
                .map((post, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="p-2 font-mono">{post.konto}</td>
                    <td className="p-2">{post.kontoNamn}</td>
                    <td className="p-2 text-right">
                      {post.debet > 0 ? `${post.debet.toLocaleString("sv-SE")} kr` : ""}
                    </td>
                    <td className="p-2 text-right">
                      {post.kredit > 0 ? `${post.kredit.toLocaleString("sv-SE")} kr` : ""}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-500 font-bold">
                <td className="p-2" colSpan={2}>
                  TOTALT
                </td>
                <td className="p-2 text-right">{totalDebet.toLocaleString("sv-SE")} kr</td>
                <td className="p-2 text-right">{totalKredit.toLocaleString("sv-SE")} kr</td>
              </tr>
              <tr
                className={`${Math.abs(totalDebet - totalKredit) < 0.01 ? "text-green-400" : "text-red-400"}`}
              >
                <td className="p-2" colSpan={2}>
                  BALANS
                </td>
                <td className="p-2 text-right" colSpan={2}>
                  {Math.abs(totalDebet - totalKredit) < 0.01
                    ? "✅ Balanserad"
                    : `❌ Diff: ${(totalDebet - totalKredit).toFixed(2)} kr`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Referenstabeller */}
      <div className="bg-slate-800 p-4 rounded-lg mt-6">
        <h2 className="text-lg font-semibold mb-4">📚 Referenstabeller</h2>

        {/* Kontoplan för löner */}
        <div className="mb-8">
          <h3 className="text-md font-semibold mb-3 text-blue-300">Kontoplan för löner</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-left p-2">Kontonamn</th>
                  <th className="text-left p-2">Typ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7210</td>
                  <td className="p-2">Löner till tjänstemän</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7285</td>
                  <td className="p-2">Semesterlöner till tjänstemän</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7321</td>
                  <td className="p-2">Skattefria traktamenten, Sverige</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7323</td>
                  <td className="p-2">Skattefria traktamenten, utlandet</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7331</td>
                  <td className="p-2">Skattefria bilersättningar</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7381</td>
                  <td className="p-2">Kostnader för fri bostad</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7382</td>
                  <td className="p-2">Kostnader för fria eller subventionerade måltider</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7385</td>
                  <td className="p-2">Kostnader för fri bil</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7389</td>
                  <td className="p-2">Övriga kostnader för förmåner</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7399</td>
                  <td className="p-2">Motkonto skattepliktiga förmåner</td>
                  <td className="p-2">Motkonto</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7510</td>
                  <td className="p-2">Lagstadgade sociala avgifter</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">7515</td>
                  <td className="p-2">Sociala avgifter på skattepliktiga kostnadsersättningar</td>
                  <td className="p-2">Kostnad</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">1930</td>
                  <td className="p-2">Företagskonto / affärskonto</td>
                  <td className="p-2">Tillgång</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-mono">2710</td>
                  <td className="p-2">Personalskatt</td>
                  <td className="p-2">Skuld</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">2731</td>
                  <td className="p-2">Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2">Skuld</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lönespec exempel med bokföring */}
      <div className="space-y-8">
        {/* 1a - Lönespec, bara lön */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">1a - Lönespec, bara lön</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">45 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">27 309,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">1b - Bokföring av 1a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">27 309,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2a - Lönespec, VAB och föräldraledighet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">
              2a - Lönespec, VAB och föräldraledighet
            </h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Vård av sjukt barn</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Dag × 1 610,00 kr</td>
                  <td className="p-2 text-right">-1 610,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Föräldraledighet</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Dag × 1 610,00 kr</td>
                  <td className="p-2 text-right">-1 610,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">41 765,28 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">31 780,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">9 985,28 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">6 808,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">24 972,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">2b - Bokföring av 2a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">24 972,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">6 808,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">9 985,28 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">31 780,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">9 985,28 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3a - Lönespec, många skattade förmåner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">
              3a - Lönespec, många skattade förmåner
            </h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Skattade förmåner</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Försäkring × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Ränteförmån × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Gratis lunch eller middag × 1</td>
                  <td className="p-2 text-right">122,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Boende × 1</td>
                  <td className="p-2 text-right">138,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Gratis frukost × 1</td>
                  <td className="p-2 text-right">61,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Annan förmån × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Gratis mat × 1 Dag</td>
                  <td className="p-2 text-right">305,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Parkering × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">47 403,19 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">36 070,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">11 333,19 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">8 021,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">26 979,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">3b - Bokföring av 3a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">26 979,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">8 021,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">11 333,19 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7381 Kostnader för fri bostad</td>
                  <td className="p-2 text-right">138,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7382 Kostnader för fria eller subventionerade måltider</td>
                  <td className="p-2 text-right">488,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7386 Subventionerad ränta</td>
                  <td className="p-2 text-right">111,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7389 Övriga kostnader för förmåner</td>
                  <td className="p-2 text-right">333,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7399 Motkonto skattepliktiga förmåner</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">1 070,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">10 996,98 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">
                    7515 Sociala avgifter på skattepliktiga kostnadsersättningar
                  </td>
                  <td className="p-2 text-right">336,21 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4a - Lönespec, skattefria traktamenten */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">
              4a - Lönespec, skattefria traktamenten
            </h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Skattefritt traktamente</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Annan kompensation × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Uppehälle, utrikes × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Reseersättning × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Uppehälle, inrikes × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Logi × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">45 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">27 864,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">4b - Bokföring av 4a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">27 864,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7321 Skattefria traktamenten, Sverige</td>
                  <td className="p-2 text-right">444,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7323 Skattefria traktamenten, utlandet</td>
                  <td className="p-2 text-right">111,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5a - Lönespec, bilersättningar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">
              5a - Lönespec, bilersättningar
            </h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Bilersättning</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Privat bil: 111 × 2,50 kr</td>
                  <td className="p-2 text-right">277,50 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Företagsbil, bensin eller diesel: 111 × 1,20 kr</td>
                  <td className="p-2 text-right">133,20 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">Företagsbil, el: 1 111 × 0,95 kr</td>
                  <td className="p-2 text-right">1 055,45 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">45 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">28 775,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">5b - Bokföring av 5a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">28 775,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">7 691,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7331 Skattefria bilersättningar</td>
                  <td className="p-2 text-right">1 466,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">10 997,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6a - Lönespec, resten */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3 text-green-300">6a - Lönespec, resten</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Beskrivning</th>
                  <th className="text-right p-2">Belopp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Lön</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 pl-4">1 Månad × 35 000,00 kr</td>
                  <td className="p-2 text-right">35 000,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Risktillägg × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">OB-tillägg × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Semesterskuld × 1 Dag</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Obetald frånvaro × 1</td>
                  <td className="p-2 text-right">–111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Övertid × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Semestertillägg × 1 Dag</td>
                  <td className="p-2 text-right">150,50 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Företagsbil × 1</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Lönekostnad</td>
                  <td className="p-2 text-right font-bold">46 778,29 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2 font-bold">Totalt Bruttolön</td>
                  <td className="p-2 text-right font-bold">35 594,50 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Sociala avgifter</td>
                  <td className="p-2 text-right">11 183,79 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">varav Skatt</td>
                  <td className="p-2 text-right">7 856,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">Utbetalas: 2025-06-18</td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-t-2 border-slate-500">
                  <td className="p-2 font-bold text-green-400">Nettolön</td>
                  <td className="p-2 text-right font-bold text-green-400">27 628,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 text-blue-300">6b - Bokföring av 6a</h3>
            <table className="w-full text-sm bg-slate-700 rounded">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2">Konto</th>
                  <th className="text-right p-2">Debet</th>
                  <th className="text-right p-2">Kredit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600">
                  <td className="p-2">1930 Företagskonto / affärskonto</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">27 628,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2710 Personalskatt</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">7 856,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">2731 Avräkning lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">11 183,79 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7210 Löner till tjänstemän</td>
                  <td className="p-2 text-right">33 612,50 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7285 Semesterlöner till tjänstemän</td>
                  <td className="p-2 text-right">1 871,50 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7385 Kostnader för fri bil</td>
                  <td className="p-2 text-right">111,00 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7399 Motkonto skattepliktiga förmåner</td>
                  <td className="p-2 text-right">0,00 kr</td>
                  <td className="p-2 text-right">111,00 kr</td>
                </tr>
                <tr className="border-b border-slate-600">
                  <td className="p-2">7510 Lagstadgade sociala avgifter</td>
                  <td className="p-2 text-right">11 148,91 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
                <tr>
                  <td className="p-2">7512 Sociala avgifter för förmånsvärden</td>
                  <td className="p-2 text-right">34,88 kr</td>
                  <td className="p-2 text-right">0,00 kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

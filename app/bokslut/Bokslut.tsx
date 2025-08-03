"use client";

import { useState, useEffect } from "react";
import {
  hamtaKontosaldo,
  hamtaSenasteTransaktioner,
  hamtaBokslutschecklista,
  testDatabaseConnection,
} from "./actions";
import { genereraNEBilaga } from "./neBilaga";

interface BokslutsPeriod {
  id: string;
  ar: number;
  period: string;
  status: "pagar" | "stangd" | "godkand";
  startDatum: string;
  slutDatum: string;
}

interface BokslutPost {
  id: string;
  typ: "avskrivning" | "periodisering" | "avsattning" | "jamkning";
  beskrivning: string;
  belopp: number;
  konto: string;
  status: "utkast" | "bokford" | "granskad";
}

export default function Bokslut() {
  const [aktivPeriod, setAktivPeriod] = useState<string>("2025");
  const [aktivFlik, setAktivFlik] = useState<"oversikt" | "nebilaga" | "checklista" | "info">(
    "oversikt"
  );

  // State för riktig data
  const [saldo, setSaldo] = useState<any[]>([]);
  const [transaktioner, setTransaktioner] = useState<any[]>([]);
  const [lista, setLista] = useState<any[]>([]);
  const [neBilaga, setNeBilaga] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hämta data från databasen
  useEffect(() => {
    async function hamtaData() {
      try {
        setLoading(true);
        const ar = parseInt(aktivPeriod);

        // Först: testa databas-anslutning
        console.log("[CLIENT] Testing database connection...");
        const dbTest = await testDatabaseConnection();
        console.log("[CLIENT] Database test result:", dbTest);

        if (dbTest.allUsers && dbTest.allUsers.length > 0) {
          console.log("[CLIENT] Available userIds with transactions:", dbTest.allUsers);
        } else {
          console.log("[CLIENT] No users found with transactions in database");
        }
        const [saldo, transaktioner, lista, neBilagaData] = await Promise.all([
          hamtaKontosaldo(ar),
          hamtaSenasteTransaktioner(ar, 20),
          hamtaBokslutschecklista(ar),
          genereraNEBilaga(ar),
        ]);

        console.log("[CLIENT] Results:", {
          saldo,
          transaktioner,
          lista,
          neBilagaData,
        });

        setSaldo(saldo);
        setTransaktioner(transaktioner);
        setLista(lista);
        setNeBilaga(neBilagaData);
      } catch (error) {
        console.error("Fel vid hämtning av bokslutdata:", error);
      } finally {
        setLoading(false);
      }
    }

    hamtaData();
  }, [aktivPeriod]);

  // Statisk data för perioder (kan utökas med databas senare)
  const perioder: BokslutsPeriod[] = [
    {
      id: "2025",
      ar: 2025,
      period: "Helår 2025",
      status: "pagar",
      startDatum: "2025-01-01",
      slutDatum: "2025-12-31",
    },
    {
      id: "2024",
      ar: 2024,
      period: "Helår 2024",
      status: "godkand",
      startDatum: "2024-01-01",
      slutDatum: "2024-12-31",
    },
    {
      id: "2023",
      ar: 2023,
      period: "Helår 2023",
      status: "stangd",
      startDatum: "2023-01-01",
      slutDatum: "2023-12-31",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pagar":
        return "bg-yellow-100 text-yellow-800";
      case "stangd":
        return "bg-blue-100 text-blue-800";
      case "godkand":
        return "bg-green-100 text-green-800";
      case "utkast":
        return "bg-gray-100 text-gray-800";
      case "bokford":
        return "bg-blue-100 text-blue-800";
      case "granskad":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pagar":
        return "Pågår";
      case "stangd":
        return "Stängd";
      case "godkand":
        return "Godkänd";
      case "utkast":
        return "Utkast";
      case "bokford":
        return "Bokförd";
      case "granskad":
        return "Granskad";
      default:
        return status;
    }
  };

  const aktivPeriodData = perioder.find((p) => p.id === aktivPeriod);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Bokslut</h1>
        <p className="text-gray-400">
          Hantera årsbokslut, periodstängningar och bokslutsjusteringar
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Välj period</label>
        <select
          value={aktivPeriod}
          onChange={(e) => setAktivPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {perioder.map((period) => (
            <option key={period.id} value={period.id}>
              {period.period} - {getStatusText(period.status)}
            </option>
          ))}
        </select>
      </div>

      {/* Status Overview */}
      {aktivPeriodData && (
        <div className="bg-gray-900 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{aktivPeriodData.period}</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(aktivPeriodData.status)}`}
            >
              {getStatusText(aktivPeriodData.status)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-sm text-gray-400">Startdatum</p>
              <p className="font-semibold text-white">{aktivPeriodData.startDatum}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-sm text-gray-400">Slutdatum</p>
              <p className="font-semibold text-white">{aktivPeriodData.slutDatum}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⏰</div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="font-semibold text-white">{getStatusText(aktivPeriodData.status)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-700">
          {[
            { key: "oversikt", label: "Översikt", icon: "📊" },
            { key: "nebilaga", label: "NE-bilaga", icon: "�" },
            { key: "checklista", label: "Checklista", icon: "✅" },
            { key: "info", label: "Information", icon: "ℹ️" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setAktivFlik(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                aktivFlik === key
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {aktivFlik === "oversikt" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-400">Laddar bokslutdata...</div>
            </div>
          ) : (
            <>
              <div className="bg-gray-900 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">�</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Kontosaldo</p>
                    <p className="text-2xl font-semibold text-white">{saldo.length} konton</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">✅</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Klara uppgifter</p>
                    <p className="text-2xl font-semibold text-white">
                      {lista.filter((item: any) => item.klar).length}/{lista.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Kvarstående</p>
                    <p className="text-2xl font-semibold text-white">
                      {lista.filter((item: any) => !item.klar).length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {aktivFlik === "nebilaga" && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Viktiga konton att kontrollera vid bokslut
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Laddar kontosaldo...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-cyan-400">Kontosaldo från databasen</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Konto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Beskrivning
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Saldo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Transaktioner
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {saldo.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                            Inga kontosaldo hittades för period {aktivPeriod}
                          </td>
                        </tr>
                      ) : (
                        saldo.map((konto: any) => (
                          <tr key={konto.kontonummer}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {konto.kontonummer}
                            </td>
                            <td className="px-6 py-4 text-sm text-white">{konto.beskrivning}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                              {new Intl.NumberFormat("sv-SE", {
                                style: "currency",
                                currency: "SEK",
                              }).format(konto.saldo)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                              {konto.antalTransaktioner}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Resultatposter som kräver granskning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium text-cyan-400">Intäkter</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">3000-3999 Försäljning</span>
                    <span className="text-gray-400">Cutoff-kontroll</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">3740 Öres- och kronutjämning</span>
                    <span className="text-gray-400">Kontroll</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-cyan-400">Kostnader</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">7210 Löner</span>
                    <span className="text-gray-400">Lönebesked</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">7220 Avskrivningar inventarier</span>
                    <span className="text-gray-400">Beräkning</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">7533 Semesterersättning</span>
                    <span className="text-gray-400">Avsättning</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">8300 Ränteintäkter</span>
                    <span className="text-gray-400">Periodisering</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">8400 Räntekostnader</span>
                    <span className="text-gray-400">Upplupet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {aktivFlik === "checklista" && (
        <div className="bg-gray-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Bokslutschecklista</h3>
            <p className="text-sm text-gray-400 mt-1">
              Följ denna checklista för att säkerställa ett komplett bokslut
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {lista.map((item: any, index: number) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.klar}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-800"
                    readOnly
                  />
                  <label
                    className={`ml-3 text-sm ${item.klar ? "text-gray-500 line-through" : "text-white"}`}
                  >
                    {item.uppgift}
                  </label>
                  {item.klar && <span className="text-green-500 ml-2">✅</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NE-bilaga Tab */}
      {aktivFlik === "nebilaga" && (
        <div className="bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">NE-bilaga {aktivPeriod}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Näringsverksamhet enskild firma - Automatiskt genererad från din bokföring
            </p>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Genererar NE-bilaga...</div>
            </div>
          ) : neBilaga ? (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Balansräkning */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-cyan-400">Balansräkning</h4>

                  {/* Tillgångar */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3">Tillgångar</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          B1 - Immateriella anläggningstillgångar
                        </span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B1?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B2 - Byggnader och markanläggningar</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B2?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          B3 - Mark och andra tillgångar som inte får skrivas av
                        </span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B3?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B4 - Maskiner och inventarier</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B4?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B6 - Varulager</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B6?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B7 - Kundfordringar</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B7?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B8 - Övriga fordringar</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B8?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                        <span className="text-gray-300">B9 - Kassa och bank</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B9?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Eget kapital och skulder */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3">Eget kapital och skulder</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">B10 - Eget kapital</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B10?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B11 - Obeskattade reserver</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B11?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B12 - Avsättningar</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B12?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B13 - Låneskulder</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B13?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B14 - Skatteskulder</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B14?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B15 - Leverantörsskulder</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B15?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">B16 - Övriga skulder</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.B16?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resultaträkning */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-cyan-400">Resultaträkning</h4>

                  {/* Intäkter */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3">Intäkter</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">R1 - Försäljning och utfört arbete</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R1?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R2 - Momsfria intäkter</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R2?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R3 - Bil- och bostadsförmån</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R3?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R4 - Ränteintäkter</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R4?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kostnader */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3">Kostnader</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">R5 - Varor, material och tjänster</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R5?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R6 - Övriga externa kostnader</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R6?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R7 - Anställd personal</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R7?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R8 - Räntekostnader</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R8?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R9 - Av- och nedskrivningar byggnader</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R9?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R10 - Av- och nedskrivningar maskiner</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R10?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-gray-700 pt-2">
                        <span className="text-gray-300">R11 - Bokfört resultat</span>
                        <span className="text-white font-semibold">
                          {neBilaga.neBilaga.R11?.toLocaleString("sv-SE") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300">
                  ℹ️ <strong>OBS!</strong> NE-bilagan är automatiskt genererad från din bokföring.
                  Du kan behöva justera siffrorna när du fyller i dem hos Skatteverket, till exempel
                  för bil- eller bostadsförmån.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400">Kunde inte generera NE-bilaga</div>
            </div>
          )}
        </div>
      )}

      {/* Information Tab */}
      {aktivFlik === "info" && (
        <div className="bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">
              Årsbokslut för enskilda näringsidkare
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Officiell information från Skatteverket om bokslut och deklaration
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Introduktion */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-3">
                ✅ Förenklat årsbokslut - Perfekt för din verksamhet
              </h4>
              <p className="text-gray-300 leading-relaxed">
                Som enskild näringsidkare med omsättning under 3 miljoner kronor använder du
                <strong className="text-white"> förenklat årsbokslut</strong> enligt K1-regelverket.
                Detta är en förenklad men formellt korrekt redovisningsform som är tillåten för
                mindre företag som ditt.
              </p>
            </div>

            {/* Förenklat årsbokslut */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                📋 Vad du behöver för ditt förenklade årsbokslut
              </h4>

              <div className="space-y-4">
                <div className="bg-cyan-900/20 border border-cyan-700 rounded p-4">
                  <p className="text-cyan-300 font-medium mb-2">
                    🎯 Detta systemet hjälper dig med allt
                  </p>
                  <p className="text-gray-300">
                    Våra verktyg genererar automatiskt alla delar som krävs för ditt förenklade
                    årsbokslut. Du får både balansräkning, resultaträkning och färdig NE-bilaga
                    direkt från din bokföring.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">
                    Ett förenklat årsbokslut innehåller:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong className="text-white">Balansräkning</strong> som visar företagets
                        ekonomiska ställning med tillgångar, skulder och eget kapital på
                        räkenskapsårets sista dag
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>
                        <strong className="text-white">Resultaträkning</strong> som visar det gångna
                        räkenskapsårets intäkter, kostnader och resultat
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
                  <p className="text-yellow-300 text-sm">
                    💡 <strong>Tips:</strong> Du kan upprätta ditt förenklade årsbokslut genom att
                    använda Skatteverkets e-tjänst "Förenklat årsbokslut". Då kan du enkelt hämta
                    uppgifterna från e-tjänsten till din deklaration.
                  </p>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded p-4">
                  <p className="text-gray-300 text-sm">
                    ℹ️ Du ska <strong className="text-white">inte skicka in</strong> det förenklade
                    årsbokslutet till Skatteverket.
                  </p>
                </div>
              </div>
            </div>

            {/* Information för större företag */}
            <details className="bg-gray-900 rounded-lg">
              <summary className="p-4 cursor-pointer text-gray-400 hover:text-white">
                📊 Information för större företag (över 3 miljoner kr omsättning)
              </summary>
              <div className="px-4 pb-4 space-y-3 text-sm text-gray-400">
                <p>
                  <strong className="text-gray-300">Vanligt årsbokslut:</strong> Företag med
                  omsättning över 3 miljoner kronor måste upprätta vanligt årsbokslut enligt
                  K-regelverket, inklusive tilläggsupplysningar.
                </p>
                <p>
                  <strong className="text-gray-300">Årsredovisning:</strong> Endast mycket stora
                  enskilda firmor (extremt sällsynt) måste upprätta årsredovisning enligt
                  K3-regelverket.
                </p>
                <p>
                  <strong className="text-gray-300">Revision:</strong> Normalt inget krav på revisor
                  för enskilda näringsidkare.
                </p>
              </div>
            </details>

            {/* Länkar och resurser */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                🔗 Användbara resurser
              </h4>

              <div className="space-y-3">
                <div className="bg-gray-800 rounded p-4">
                  <p className="text-white font-medium mb-2">📚 Bokföringsnämnden</p>
                  <p className="text-gray-300 text-sm">
                    Information om bokföringsskyldighet, bokföring, årsbokslut och årsredovisning
                    för enskilda näringsidkare
                  </p>
                </div>

                <div className="bg-gray-800 rounded p-4">
                  <p className="text-white font-medium mb-2">📖 K1-vägledning</p>
                  <p className="text-gray-300 text-sm">
                    Bokföringsnämndens vägledning K1 för enskilda näringsidkare med instruktioner om
                    vad som ska bokföras
                  </p>
                </div>

                <div className="bg-gray-800 rounded p-4">
                  <p className="text-white font-medium mb-2">🏛️ Skatteverkets e-tjänst</p>
                  <p className="text-gray-300 text-sm">
                    "Förenklat årsbokslut" - för att enkelt upprätta årsbokslut och hämta uppgifter
                    till deklaration
                  </p>
                </div>

                <div className="bg-gray-800 rounded p-4">
                  <p className="text-white font-medium mb-2">📋 Skatteverkets broschyr</p>
                  <p className="text-gray-300 text-sm">
                    "Bokföring, bokslut och deklaration del 1" - K1-reglerna beskrivna och
                    förklarade på ett enkelt sätt
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-cyan-300 mb-3">
                🚀 Kom igång med ditt bokslut
              </h4>
              <p className="text-gray-300 mb-4">
                Använd flikarna ovan för att hantera ditt årsbokslut. Börja med{" "}
                <strong className="text-white">Översikt</strong> för att se din ekonomiska status,
                använd <strong className="text-white">NE-bilaga</strong> för automatisk
                deklarationshjälp och <strong className="text-white">Checklista</strong> för att
                hålla koll på alla obligatoriska moment.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAktivFlik("oversikt")}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-medium transition-colors"
                >
                  📊 Gå till Översikt
                </button>
                <button
                  onClick={() => setAktivFlik("nebilaga")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  📄 Visa NE-bilaga
                </button>
                <button
                  onClick={() => setAktivFlik("checklista")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                >
                  ✅ Se Checklista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

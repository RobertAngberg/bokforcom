"use client";

import { useState } from "react";

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
  const [aktivFlik, setAktivFlik] = useState<"oversikt" | "poster" | "rapporter" | "checklista">(
    "oversikt"
  );

  // Mock data
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

  const bokslutsposter: BokslutPost[] = [
    {
      id: "1",
      typ: "avskrivning",
      beskrivning: "Avskrivning datautrustning",
      belopp: -25000,
      konto: "7220",
      status: "bokford",
    },
    {
      id: "2",
      typ: "periodisering",
      beskrivning: "Upplupna semesterlöner",
      belopp: -180000,
      konto: "2710",
      status: "utkast",
    },
    {
      id: "3",
      typ: "avsattning",
      beskrivning: "Avsättning garantiåtaganden",
      belopp: -50000,
      konto: "2890",
      status: "granskad",
    },
    {
      id: "4",
      typ: "jamkning",
      beskrivning: "Skattemässig justering",
      belopp: 15000,
      konto: "2013",
      status: "utkast",
    },
  ];

  const checklista = [
    { uppgift: "Kontrollera alla verifikat är bokförda", klar: true },
    { uppgift: "Genomför månadsavstämningar", klar: true },
    { uppgift: "Kontrollera lagerinventering", klar: false },
    { uppgift: "Beräkna avskrivningar", klar: true },
    { uppgift: "Bokför upplupna kostnader", klar: false },
    { uppgift: "Kontrollera semesterlöneskuld", klar: false },
    { uppgift: "Granska avsättningar", klar: false },
    { uppgift: "Upprätta årsredovisning", klar: false },
    { uppgift: "Revisorsgranskning", klar: false },
    { uppgift: "Inlämning till Bolagsverket", klar: false },
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
            { key: "poster", label: "Bokslutsposter", icon: "📝" },
            { key: "rapporter", label: "Rapporter", icon: "📋" },
            { key: "checklista", label: "Checklista", icon: "✅" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📝</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Bokslutsposter</p>
                <p className="text-2xl font-semibold text-white">{bokslutsposter.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">💰</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Totala justeringar</p>
                <p className="text-2xl font-semibold text-white">
                  {(bokslutsposter.reduce((sum, post) => sum + post.belopp, 0) / 1000).toFixed(0)}k
                </p>
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
                  {checklista.filter((item) => item.klar).length}/{checklista.length}
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
                  {checklista.filter((item) => !item.klar).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {aktivFlik === "poster" && (
        <div className="bg-gray-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Bokslutsposter</h3>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">
                Ny post
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Beskrivning
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Konto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Belopp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {bokslutsposter.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white capitalize">
                      {post.typ}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {post.beskrivning}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {post.konto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {post.belopp.toLocaleString("sv-SE")} kr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}
                      >
                        {getStatusText(post.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-cyan-400 hover:text-cyan-300 mr-3">Redigera</button>
                      <button className="text-red-400 hover:text-red-300">Ta bort</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aktivFlik === "rapporter" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-white mb-4">Årsbokslut rapporter</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Resultaträkning</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Balansräkning</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Kassaflödesanalys</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Huvudbok</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-white mb-4">Skatterapporter</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Självdeklaration</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Momsdeklaration</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">Kontrolluppgifter</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white">SIE-export för revisor</span>
                  <span className="text-lg">📄</span>
                </div>
              </button>
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
              {checklista.map((item, index) => (
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
    </div>
  );
}

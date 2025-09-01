//#region: Huvud
"use client";

import React, { useEffect, useState } from "react";
import { fetchRawYearData, checkWelcomeStatus, markWelcomeAsShown } from "./actions";
import { processYearData } from "../_utils/format";
import Kort from "./Kort";
import Chart from "./Chart";
import MainLayout from "../_components/MainLayout";
import Dropdown from "../_components/Dropdown";

type YearSummary = {
  totalInkomst: number;
  totalUtgift: number;
  totalResultat: number;
  yearData: YearDataPoint[];
};

type YearDataPoint = {
  month: string;
  inkomst: number;
  utgift: number;
};

type Props = {
  initialData: YearSummary | null;
};

export default function StartPage({ initialData }: Props) {
  const [year, setYear] = useState("2025");
  const { data, isLoading } = useFetchYearSummary(year, initialData);
  const [showWelcome, setShowWelcome] = useState(false);

  // Kolla välkomstmeddelande-status när komponenten laddar
  useEffect(() => {
    checkWelcomeStatus().then(setShowWelcome);
  }, []);

  // Stäng välkomstmeddelande och markera som visat
  const handleWelcomeClose = async () => {
    setShowWelcome(false);
    await markWelcomeAsShown();
  };

  function useFetchYearSummary(year: string, initialData: YearSummary | null) {
    const [data, setData] = useState<YearSummary | null>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      setIsLoading(true);
      fetchRawYearData(year)
        .then((rawData) => {
          const processedData = processYearData(rawData);
          setData(processedData);
        })
        .catch((error) => {
          console.error("Error fetching year data:", error);
          setData(null);
        })
        .finally(() => setIsLoading(false));
    }, [year]); // Tog bort initialData från dependencies för att förhindra re-renders

    return { data, isLoading };
  }

  return (
    <MainLayout>
      {/* Välkomstmeddelande för nya användare */}
      {showWelcome && (
        <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-600">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-3">
                🎉 Välkommen till Bokför.com!
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Grattis! Du har nu skapat ditt konto och kan börja bokföra. Du får mer än gärna
                använda Hjälp/Feedback nere till höger närhelst du behöver hjälp eller har frågor!
              </p>
            </div>
            <button
              onClick={handleWelcomeClose}
              className="ml-4 text-slate-400 hover:text-white transition-colors"
              title="Stäng välkomstmeddelande"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 mb-8 text-center">
        <Kort title="Intäkter" data={data?.totalInkomst || 0} />
        <Kort title="Kostnader" data={data?.totalUtgift || 0} />
        <Kort title="Resultat" data={data?.totalResultat || 0} />
      </div>

      <div className="flex justify-center mb-6">
        <Dropdown
          value={year}
          onChange={setYear}
          options={[
            { label: "2025", value: "2025" },
            { label: "2024", value: "2024" },
            { label: "2023", value: "2023" },
            { label: "2022", value: "2022" },
            { label: "2021", value: "2021" },
            { label: "2020", value: "2020" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="border-t-4 border-cyan-600 border-solid rounded-full w-16 h-16 animate-spin"></div>
        </div>
      ) : data?.yearData ? (
        <Chart year={year} onYearChange={setYear} chartData={data.yearData} />
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-white text-lg">Ingen data tillgänglig för {year}</p>
        </div>
      )}
    </MainLayout>
  );
}

//#region: Huvud
"use client";

import React, { useEffect, useState } from "react";
import { fetchRawYearData } from "./actions";
import Kort from "./Kort";
import Chart from "./Chart";
import MainLayout from "../_components/MainLayout";
import Dropdown from "../_components/Dropdown";
import { useAnvändaravtalModal } from "../_components/AnvändaravtalModal";

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
  initialData: YearSummary;
};

// Frontend data processing - flyttat från actions.ts
const processYearData = (rawData: any[]): YearSummary => {
  const grouped: Record<string, { inkomst: number; utgift: number }> = {};
  let totalInkomst = 0;
  let totalUtgift = 0;

  rawData.forEach((row, i) => {
    const { transaktionsdatum, debet, kredit, kontonummer } = row;

    if (!transaktionsdatum || !kontonummer) {
      console.warn(`⚠️ Rad ${i + 1} saknar datum eller kontonummer:`, row);
      return;
    }

    const date = new Date(transaktionsdatum);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

    const deb = Number(debet ?? 0);
    const kre = Number(kredit ?? 0);
    const prefix = kontonummer?.toString()[0];

    if (!grouped[key]) grouped[key] = { inkomst: 0, utgift: 0 };

    if (prefix === "3") {
      grouped[key].inkomst += kre;
      totalInkomst += kre;
    }

    if (["5", "6", "7", "8"].includes(prefix)) {
      grouped[key].utgift += deb;
      totalUtgift += deb;
    }
  });

  const yearData = Object.entries(grouped).map(([month, values]) => ({
    month,
    inkomst: values.inkomst,
    utgift: values.utgift,
  }));

  return {
    totalInkomst: +totalInkomst.toFixed(2),
    totalUtgift: +totalUtgift.toFixed(2),
    totalResultat: +(totalInkomst - totalUtgift).toFixed(2),
    yearData,
  };
};
//#endregion

export default function Startsida({ initialData }: Props) {
  const [year, setYear] = useState("2025");
  const { data, isLoading } = useFetchYearSummary(year, initialData);
  const { openModal, AnvändaravtalModal } = useAnvändaravtalModal();

  function useFetchYearSummary(year: string, initialData: YearSummary | null) {
    const [data, setData] = useState<YearSummary | null>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (year === "2025") return;

      setIsLoading(true);
      fetchRawYearData(year)
        .then((rawData) => {
          const processedData = processYearData(rawData);
          setData(processedData);
        })
        .finally(() => setIsLoading(false));
    }, [year]);

    return { data, isLoading };
  }

  return (
    <MainLayout>
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
      ) : (
        <Chart year={year} onYearChange={setYear} chartData={data?.yearData || []} />
      )}

      {/* Länk till användaravtal */}
      <div className="mt-8 text-center">
        <button
          onClick={openModal}
          className="text-sm text-gray-400 hover:text-white transition-colors underline"
        >
          📋 Användaravtal
        </button>
      </div>

      <AnvändaravtalModal />
    </MainLayout>
  );
}

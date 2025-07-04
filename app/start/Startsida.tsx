//#region: Huvud
"use client";

import React, { useEffect, useState } from "react";
import { fetchDataFromYear } from "./actions";
import Kort from "./Kort";
import Chart from "./Chart";
import MainLayout from "../_components/MainLayout";
import PDFUpload from "./PDFUpload";

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
//#endregion

export default function Startsida({ initialData }: Props) {
  const [year, setYear] = useState("2025");
  const { data, isLoading } = useFetchYearSummary(year, initialData);

  function useFetchYearSummary(year: string, initialData: YearSummary | null) {
    const [data, setData] = useState<YearSummary | null>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (year === "2025") return;

      setIsLoading(true);
      fetchDataFromYear(year)
        .then((newData) => setData(newData))
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="border-t-4 border-cyan-600 border-solid rounded-full w-16 h-16 animate-spin"></div>
        </div>
      ) : (
        <Chart year={year} onYearChange={setYear} chartData={data?.yearData || []} />
      )}

      <PDFUpload />
    </MainLayout>
  );
}

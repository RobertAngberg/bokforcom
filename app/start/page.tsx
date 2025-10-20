"use client";

import Kort from "./components/Kort";
import Chart from "./components/Chart";
import MainLayout from "../_components/MainLayout";
import Dropdown from "../_components/Dropdown";
import ValkomstMedd from "./components/ValkomstMedd";
import { useStart } from "./hooks/useStart";

export default function Start() {
  const { year, setYear, data, isLoading, showWelcome, handleWelcomeClose } = useStart();

  return (
    <MainLayout>
      {showWelcome && <ValkomstMedd onClose={handleWelcomeClose} />}

      <div className="mb-8 flex flex-col items-stretch gap-4 text-center sm:flex-row sm:flex-wrap sm:justify-center">
        <Kort title="Intäkter" data={data?.totalInkomst || 0} />
        <Kort title="Kostnader" data={data?.totalUtgift || 0} />
        <Kort title="Resultat" data={data?.totalResultat || 0} />
      </div>

      <div className="flex justify-center mb-2 md:mb-4">
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

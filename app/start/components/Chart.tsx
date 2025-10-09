"use client";

import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import "chart.js/auto";
import React from "react";
import type { ChartProps } from "../types/types";

export default function HomeChart({ year, chartData }: ChartProps) {
  // Memoize the processed chart data to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (!chartData || chartData.length === 0) {
      return {
        labels: [],
        inkomstData: [],
        utgiftData: [],
        resultData: [],
      };
    }

    const monthDataMap: { [key: string]: { inkomst: number; utgift: number } } = {};

    chartData.forEach((row) => {
      const parsedDate = new Date(`${row.month}T00:00:00Z`);
      if (isNaN(parsedDate.getTime())) return;

      const monthIndex = parsedDate.getMonth();
      const label = monthNames[monthIndex];

      if (!monthDataMap[label]) {
        monthDataMap[label] = { inkomst: 0, utgift: 0 };
      }

      monthDataMap[label].inkomst += row.inkomst;
      monthDataMap[label].utgift += row.utgift;
    });

    const finalLabels = monthNames.filter((m) => monthDataMap[m]);
    const inkomstValues = finalLabels.map((label) => monthDataMap[label].inkomst);
    const utgiftValues = finalLabels.map((label) => -monthDataMap[label].utgift);
    const resultValues = finalLabels.map(
      (label) => monthDataMap[label].inkomst - monthDataMap[label].utgift
    );

    return {
      labels: finalLabels,
      inkomstData: inkomstValues,
      utgiftData: utgiftValues,
      resultData: resultValues,
    };
  }, [chartData]);

  // Memoize chart data object to prevent Chart.js re-renders
  const data = useMemo(
    () => ({
      labels: processedData.labels,
      datasets: [
        {
          label: "Resultat",
          data: processedData.resultData,
          type: "line" as const,
          borderColor: "rgb(255, 215, 0)",
          backgroundColor: "rgb(255, 215, 0)",
          fill: false,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 4,
          stack: undefined,
        },
        {
          label: "Intäkter",
          data: processedData.inkomstData,
          backgroundColor: "rgb(0, 128, 128)",
          stack: "stack1",
        },
        {
          label: "Kostnader",
          data: processedData.utgiftData,
          backgroundColor: "rgb(255, 99, 132)",
          stack: "stack1",
        },
      ],
    }),
    [processedData]
  );

  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      indexAxis: "x" as const,
      responsive: true,
      layout: {
        padding: {
          top: 20,
          bottom: 30,
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: "white",
            font: { size: 14 },
            padding: 20,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: "white",
            font: { size: 14 },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "white",
            font: { size: 14 },
            padding: 20,
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
        },
      },
    }),
    []
  );

  // Don't render chart if no data
  if (!processedData.labels.length) {
    return (
      <div className="w-full m-0 p-0">
        <div className="relative w-full h-[75vh] p-0 m-0 flex items-center justify-center">
          <p className="text-white text-lg">Ingen data att visa för {year}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full m-0 p-0">
      <div className="relative w-full h-[75vh] p-0 m-0">
        <Chart type="bar" datasetIdKey="id" options={options} data={data} />
      </div>
    </div>
  );
}

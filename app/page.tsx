"use client";

import { useState, useEffect } from "react";
import Startsida from "./start/Startsida";
import { fetchDataFromYear } from "./start/actions";

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Ladda data när komponenten mountas
  useEffect(() => {
    const loadData = async () => {
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
      const dataPromise = fetchDataFromYear("2025");
      const [, data] = await Promise.all([delayPromise, dataPromise]);
      setInitialData(data);
    };
    loadData();
  }, []);

  return <>{initialData && <Startsida initialData={initialData} />}</>;
}

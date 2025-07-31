"use client";

import { useState } from "react";
import Startsida from "./start/Startsida";
import { fetchDataFromYear } from "./start/actions";
import Modal from "./_components/Modal";

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Ladda data när komponenten mountas
  useState(() => {
    const loadData = async () => {
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
      const dataPromise = fetchDataFromYear("2025");
      const [, data] = await Promise.all([delayPromise, dataPromise]);
      setInitialData(data);
    };
    loadData();
  });

  return (
    <>
      {initialData && <Startsida initialData={initialData} />}

      {/* Test knapp för Modal */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 right-4 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-40"
      >
        Testa Modal
      </button>
    </>
  );
}

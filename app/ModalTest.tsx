"use client";

import { useState } from "react";
import Modal from "./_components/Modal";

export default function ModalTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        🧪 Testa Modal
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🎉 Test Modal"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-white">Detta är en test av den nya Modal-komponenten!</p>

          <div className="bg-slate-700 p-3 rounded">
            <h3 className="text-cyan-400 font-semibold mb-2">Funktioner som fungerar:</h3>
            <ul className="text-gray-300 space-y-1 text-sm">
              <li>✅ ESC-tangent stänger modal</li>
              <li>✅ Klick utanför stänger modal</li>
              <li>✅ Body scroll-lock</li>
              <li>✅ Samma stil som övriga modaler</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Stäng via knapp
            </button>
            <button
              onClick={() => alert("Modal funkar! 🎯")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Test funktion
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

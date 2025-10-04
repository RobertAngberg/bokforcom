"use client";

import Link from "next/link";
import { useBokforContext } from "../../context/BokforContextProvider";

export default function Steg4() {
  const { state, handlers } = useBokforContext();

  // Visa bara på steg 4
  if (state.currentStep !== 4) return null;

  return (
    <main className="flex flex-col items-center text-center">
      <h1 className="mb-8 text-3xl">Bokföring genomförd!</h1>
      <Link
        href="/bokfor"
        onClick={handlers.handleNewBokforing}
        className="px-6 py-4 font-bold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700 transition"
      >
        Bokför något nytt
      </Link>
    </main>
  );
}

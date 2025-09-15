"use client";

import Link from "next/link";
import { useBokforStore } from "../../_stores/bokforStore";

export default function Steg4() {
  const { currentStep } = useBokforStore();

  // Visa bara på steg 4
  if (currentStep !== 4) return null;

  return (
    <main className="flex flex-col items-center text-center">
      <h1 className="mb-8 text-3xl">Bokföring genomförd!</h1>
      <Link
        href="/bokfor"
        onClick={() => window.location.reload()}
        className="px-6 py-4 font-bold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700 transition"
      >
        Bokför något nytt
      </Link>
    </main>
  );
}

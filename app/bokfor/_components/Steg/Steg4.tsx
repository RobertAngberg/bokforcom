"use client";

import Link from "next/link";
import { useBokforStore } from "../../_stores/bokforStore";
import { useSteg4 } from "../../_hooks/useSteg4";

export default function Steg4() {
  const { currentStep } = useBokforStore();
  const { handlers } = useSteg4();

  // Visa bara på steg 4
  if (currentStep !== 4) return null;

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

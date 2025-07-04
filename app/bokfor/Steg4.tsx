import Link from "next/link";
import React from "react";

export default function Steg4() {
  return (
    <main className="flex flex-col items-center text-center">
      <h1 className="mb-8 text-3xl">Bokföring genomförd!</h1>
      <Link
        href="/bokfor"
        // Använder reload för att återställa alla state-variabler i Bokför till startläget
        onClick={() => window.location.reload()}
        className="px-6 py-4 font-bold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700 transition"
      >
        Bokför något nytt
      </Link>
    </main>
  );
}

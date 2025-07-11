"use client";

import Link from "next/link";

export default function Aaapage() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 w-full max-w-full mx-auto mt-12">
      <a
        href="/personal/Anstallda"
        className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition mb-4 w-full"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>👥</span>
          Anställda
        </h2>
        <p className="text-sm italic text-gray-400 mt-1">
          Kontrakt, lönespecar och semester för anställda.
        </p>
      </a>
      <a
        href="/personal/Lonekorning"
        className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition mb-4 w-full"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>💰</span>
          Lönekörning
        </h2>
        <p className="text-sm italic text-gray-400 mt-1">
          Hantera utbetalning och bokföring av löner.
        </p>
      </a>
    </div>
  );
}

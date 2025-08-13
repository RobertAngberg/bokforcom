"use client";

import MainLayout from "../_components/MainLayout";
import { useState } from "react";
import Bokför from "../bokfor/Bokfor";
import { fetchFavoritforval } from "../bokfor/actions";

export default function PersonalPage() {
  const [showUtlagg, setShowUtlagg] = useState(false);
  const [favoritFörvalen, setFavoritFörvalen] = useState<any[] | null>(null);

  const handleUtlaggClick = async () => {
    if (!favoritFörvalen) {
      const res = await fetchFavoritforval();
      setFavoritFörvalen(res);
    }
    setShowUtlagg(true);
  };

  if (showUtlagg && favoritFörvalen) {
    return <Bokför favoritFörvalen={favoritFörvalen} utlaggMode={true} />;
  }

  return (
    <MainLayout>
      <div className="">
        <h1 className="text-3xl text-white mb-8 text-center">Personal</h1>
        <div className="grid gap-6 grid-cols-3 w-full mx-auto mt-12">
          <a
            href="/personal/Anstallda"
            className="block p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full"
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
            className="block p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>💰</span>
              Lönekörning
            </h2>
            <p className="text-sm italic text-gray-400 mt-1">
              Hantera utbetalning och bokföring av löner.
            </p>
          </a>
          <button
            type="button"
            className="block p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full text-left"
            onClick={handleUtlaggClick}
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🧾</span>
              Utlägg
            </h2>
            <p className="text-sm italic text-gray-400 mt-1">
              Hantera och bokför utlägg för anställda. Du väljer anställd i steg 3.
            </p>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

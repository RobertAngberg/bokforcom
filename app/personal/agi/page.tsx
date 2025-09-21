"use client";

import MainLayout from "../../_components/MainLayout";
import Link from "next/link";

export default function AGI_Page() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">📋 AGI - Arbetsgivardeklaration</h1>
          <p className="text-gray-300 text-lg">
            Verktyg och resurser för Arbetsgivardeklaration till Skatteverket
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full mx-auto mt-12">
          <Link
            href="/personal/agi/kodreferens"
            className="block p-6 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📖</div>
              <div>
                <h2 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition">
                  Kodreferens
                </h2>
                <p className="text-sm text-gray-400">Alla tresiffriga koder från Skatteverket</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Fullständig referens för alla fältkoder som används i arbetsgivardeklarationen.
              Organiserad i kategorier med detaljerade beskrivningar från Skatteverkets officiella
              vägledning.
            </p>
            <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
              Utforska kodreferens →
            </div>
          </Link>

          <Link
            href="/personal/agi/teknisk"
            className="block p-6 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">💻</div>
              <div>
                <h2 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition">
                  Teknisk Guide
                </h2>
                <p className="text-sm text-gray-400">Implementation och XML-format</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Teknisk beskrivning version 1.1.17.1 med nyheter 2025: frånvarouppgifter, utvidgat
              växa-stöd, XML-format, kontroller och praktisk implementation.
            </p>
            <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
              Läs teknisk guide →
            </div>
          </Link>

          <Link
            href="/personal/agi/generator"
            className="block p-6 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🏗️</div>
              <div>
                <h2 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition">
                  XML-generator
                </h2>
                <p className="text-sm text-gray-400">Schema-validerad XML-generering</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Generera kompletta XML-filer för inlämning till Skatteverket. Stöder alla funktioner
              inklusive frånvarouppgifter 2025 och utvidgat växa-stöd.
            </p>
            <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
              Skapa AGI XML →
            </div>
          </Link>

          <div className="p-6 rounded-lg bg-gray-900 opacity-50 w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📊</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-500">Rapporter</h2>
                <p className="text-sm text-gray-500">Kommer snart</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Generera rapporter och sammanställningar för dina arbetsgivardeklarationer. Översikt
              per månad och anställd.
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ℹ️ Om Arbetsgivardeklaration
          </h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              <strong>Arbetsgivardeklaration (AGI)</strong> är en månadsvis deklaration som svenska
              arbetsgivare måste lämna till Skatteverket senast den 12:e varje månad för föregående
              månads löner.
            </p>
            <p>
              Deklarationen innehåller uppgifter om utbetalda löner, avdragen skatt,
              arbetsgivaravgifter och andra ersättningar till anställda.
            </p>
            <p>
              Informationen används av Skatteverket för kontroll och överförs till andra myndigheter
              som Försäkringskassan för beräkning av förmåner.
            </p>
          </div>

          <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-400/30 rounded-lg">
            <h4 className="font-semibold text-yellow-100 mb-2 flex items-center gap-2">
              🆕 Viktiga förändringar 2025
            </h4>
            <div className="space-y-2 text-yellow-100 text-sm">
              <p>
                <strong>Frånvarouppgifter:</strong> Från 1 januari 2025 måste arbetsgivare
                rapportera frånvaro som kan ge rätt till föräldrapenning eller tillfällig
                föräldrapenning.
              </p>
              <p>
                <strong>Utvidgat växa-stöd:</strong> Nedsättningen omfattar nu upp till två
                anställda med höjd beloppsgräns till 35 000 kr/månad.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-gray-400 text-xs">
              För senaste information och regler, besök{" "}
              <a
                href="https://skatteverket.se/foretagochorganisationer/arbetsgivare/lamnaarbetsgivardeklaration.4.361dc8c15312eff6fd1a33f.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Skatteverkets officiella sida
              </a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

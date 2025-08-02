"use client";
import Link from "next/link";
import MainLayout from "../_components/MainLayout";

const fakturaAlternativ = [
  {
    emoji: "📄",
    title: "Sparade fakturor",
    description: "Visa och hantera tidigare skapade fakturor.",
    href: "/faktura/Sparade",
  },
  {
    emoji: "📋",
    title: "Leverantörsfakturor",
    description: "Hantera inkommande fakturor från leverantörer.",
    href: "/faktura/Leverantorsfakturor",
  },
  {
    emoji: "📝",
    title: "Ny faktura",
    description: "Skapa en helt ny faktura från början.",
    href: "/faktura/NyFaktura",
  },
];

export default function FakturaPage() {
  return (
    <MainLayout>
      <h1 className="text-3xl mb-10 text-center text-white">Fakturor</h1>

      {/* Alternativ för fakturhantering */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {fakturaAlternativ.map((alt) => (
          <Link
            key={alt.title}
            href={alt.href}
            className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>{alt.emoji}</span> {alt.title}
            </h2>
            <p className="text-sm italic text-gray-400 mt-1">{alt.description}</p>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}

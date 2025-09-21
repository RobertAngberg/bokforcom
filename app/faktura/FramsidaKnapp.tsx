"use client";

import Link from "next/link";
import { FakturaKnappProps } from "./_types/types";

export default function FakturaKnapp({ emoji, title, description, href }: FakturaKnappProps) {
  return (
    <Link href={href} className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      <p className="text-sm italic text-gray-400 mt-1">{description}</p>
    </Link>
  );
}

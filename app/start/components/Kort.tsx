import React from "react";
import type { FrontCardProps } from "../types/types";

export default function Card({ title, data }: FrontCardProps) {
  return (
    <div className="flex-1 min-w-[180px] rounded-xl border-4 bg-cyan-950">
      <div className="p-5 text-2xl font-bold text-white bg-slate-900">{title}</div>
      <div className="p-6 text-2xl bg-white text-sky-950">{data.toFixed(2)}</div>
    </div>
  );
}

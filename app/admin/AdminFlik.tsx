"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  icon: string;
  children: ReactNode;
};

export default function AdminFlik({ title, icon, children }: Props) {
  return (
    <details className="group">
      <summary>
        {icon} {title} <span className="text-white">▼</span>
      </summary>
      <div className="p-4 bg-slate-900 group-open:rounded-b-lg">{children}</div>
    </details>
  );
}

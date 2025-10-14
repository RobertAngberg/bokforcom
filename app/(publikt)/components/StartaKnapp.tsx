"use client";

import { useState } from "react";

interface StartaKnappProps {
  className?: string;
  fullWidth?: boolean;
}

export default function StartaKnapp({ className, fullWidth = false }: StartaKnappProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    window.location.href = "/login";
  };

  const baseClasses =
    "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50";
  const widthClass = fullWidth ? "w-full" : "";
  const classes = `${baseClasses} ${widthClass} ${className || ""}`.trim();

  return (
    <button onClick={handleClick} disabled={isLoading} className={classes}>
      {isLoading ? "Startar..." : "🚀 Starta gratis"}
    </button>
  );
}

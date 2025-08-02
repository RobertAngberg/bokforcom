import React from "react";

type TillbakaPilProps = {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
};

export default function TillbakaPil({
  onClick,
  className = "",
  children = "Tillbaka",
  ariaLabel = "Tillbaka",
}: TillbakaPilProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-0 top-0 flex items-center gap-2 text-white font-bold px-3 py-2 rounded hover:bg-gray-700 focus:outline-none ${className}`}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </button>
  );
}

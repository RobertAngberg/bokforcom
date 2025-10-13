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
  children = null,
  ariaLabel = "Tillbaka",
}: TillbakaPilProps) {
  const hasChildren = Boolean(children);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center ${hasChildren ? "gap-2 px-3" : "justify-center px-2"} text-white font-bold py-2 rounded hover:bg-gray-700 focus:outline-none ${className}`}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${hasChildren ? "mr-1" : ""}`}
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

"use client";

import { useFormStatus } from "react-dom";

type KnappProps = {
  text: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  pendingText?: string;
  fullWidth?: boolean;
};

export default function Knapp({
  text,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  loadingText,
  pendingText,
  fullWidth = false,
  className = "",
}: KnappProps & { className?: string }) {
  const { pending } = useFormStatus();

  // För fullWidth variant, använd useFormStatus pending state
  const isFormPending = fullWidth && pending;
  const isDisabled = disabled || loading || isFormPending;

  // Bestäm vilken text som ska visas
  let displayText = text;
  if (loading) {
    displayText = loadingText || "Laddar...";
  } else if (isFormPending) {
    displayText = pendingText || `${text}...`;
  }

  // Base styles
  const baseStyles =
    "flex items-center justify-center gap-2 font-medium text-white rounded transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

  // Conditional styles based on fullWidth
  const widthStyles = fullWidth
    ? `w-full px-4 py-6 font-bold ${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-700"}`
    : "bg-cyan-700 hover:bg-cyan-800 px-4 py-2";

  return (
    <button
      type={fullWidth ? "submit" : type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${widthStyles} ${className}`}
    >
      {(loading || isFormPending) && (
        <div
          className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
            fullWidth ? "w-5 h-5" : "w-4 h-4"
          }`}
        />
      )}
      {displayText}
    </button>
  );
}

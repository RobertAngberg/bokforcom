// _components/KnappFullWidth.tsx
"use client";

import { useFormStatus } from "react-dom";

type KnappFullWidthProps = {
  text: string; // obligatoriskt
  pendingText?: string; // valfritt
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export default function KnappFullWidth({
  text,
  pendingText,
  type = "submit",
  disabled = false,
  onClick,
}: KnappFullWidthProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const waitLabel = pendingText ?? `${text}...`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 px-4 py-6 font-bold text-white rounded ${
        isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-700"
      }`}
    >
      {pending && (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {pending ? waitLabel : text}
    </button>
  );
}

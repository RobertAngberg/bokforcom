"use client";

import { useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
  showCloseButton?: boolean;
  isLoading?: boolean;
  // Optional extra classes for the inner modal container (width/layout tweaks per usage)
  containerClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "4xl",
  showCloseButton = true,
  isLoading = false,
  containerClassName,
}: ModalProps) {
  // Hantera ESC-tangent
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Förhindra scroll på body när modal är öppen
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Hantera klick utanför modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Max-width klasser
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        maxWidth === "full" ? "p-1 sm:p-2" : "p-4"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-slate-800 border border-slate-600 p-6 rounded-lg ${maxWidthClass} w-full max-h-[90vh] overflow-y-auto ${
          containerClassName || ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl text-white text-center flex-1 mt-2">{title}</h2>
          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-white text-2xl transition-colors cursor-pointer"
              aria-label="Stäng modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div>{isLoading ? <LoadingSpinner /> : children}</div>
      </div>
    </div>
  );
}

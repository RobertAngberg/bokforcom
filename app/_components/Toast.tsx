"use client";

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

export type ToastType = "success" | "error" | "info";

// Simple global toast function
export function showToast(message: string, type: ToastType = "success", duration: number = 3000) {
  // Create container element
  const container = document.createElement("div");
  document.body.appendChild(container);

  // Create React root and render Toast
  const root = createRoot(container);

  const cleanup = () => {
    root.unmount();
    container.remove();
  };

  root.render(<Toast message={message} type={type} duration={duration} onClose={cleanup} />);
}

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(true); // Starta direkt som true

  useEffect(() => {
    // Definiera handleClose INUTI useEffect
    const handleClose = () => {
      setIsAnimating(false);
      // Vänta på fade-out animation innan vi kallar onClose
      setTimeout(() => {
        onClose();
      }, 300);
    };

    // Auto-close efter duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]); // Inkludera onClose i dependencies

  const handleManualClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles =
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-2xl drop-shadow-lg transition-all duration-300 cursor-pointer";

    const typeStyles = {
      success: "bg-emerald-600 text-white border border-emerald-500",
      error: "bg-red-600 text-white border border-red-500",
      info: "bg-slate-600 text-white border border-slate-500",
    };

    const animationStyles = isAnimating
      ? "translate-y-0 opacity-100 scale-100"
      : "-translate-y-full opacity-0 scale-95";

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
        return (
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className={getToastStyles()} onClick={handleManualClose}>
      <div className="flex items-center">
        {getIcon()}
        <span className="font-medium text-base whitespace-pre-line">{message}</span>
      </div>
    </div>
  );
}

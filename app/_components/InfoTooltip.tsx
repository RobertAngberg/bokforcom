"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function InfoTooltip({ text, position = "top" }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const getTooltipPosition = () => {
    if (!buttonRect) return { top: 0, left: 0 };

    const offset = 8;
    const tooltipWidth = 250;

    switch (position) {
      case "bottom":
        return {
          top: buttonRect.bottom + offset,
          left: buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: buttonRect.top + buttonRect.height / 2,
          left: buttonRect.left - tooltipWidth - offset,
        };
      case "right":
        return {
          top: buttonRect.top + buttonRect.height / 2,
          left: buttonRect.right + offset,
        };
      default: // top
        return {
          top: buttonRect.top - offset,
          left: buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setButtonRect(null);
  };

  const tooltipContent = isVisible && buttonRect && (
    <div
      className="fixed px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg border border-slate-700 pointer-events-none"
      style={{
        ...getTooltipPosition(),
        width: "250px",
        whiteSpace: "normal",
        wordWrap: "break-word",
        lineHeight: "1.4",
        zIndex: 999999,
        transform:
          position === "top"
            ? "translateY(-100%)"
            : position === "bottom"
              ? "translateY(0)"
              : "translateY(-50%)",
      }}
    >
      {text}

      {/* Arrow */}
      <div
        className="absolute"
        style={{
          ...(position === "top" && {
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid #0f172a",
          }),
          ...(position === "bottom" && {
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "6px solid #0f172a",
          }),
          ...(position === "left" && {
            left: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: "6px solid #0f172a",
          }),
          ...(position === "right" && {
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: "6px solid #0f172a",
          }),
        }}
      />
    </div>
  );

  return (
    <>
      <div
        className="w-4 h-4 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs cursor-help hover:bg-cyan-400 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        i
      </div>

      {typeof document !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

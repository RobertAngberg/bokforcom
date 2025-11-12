"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimeradFlik({
  title,
  icon,
  children,
  visaSummaDirekt,
  forcedOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  visaSummaDirekt?: string;
  forcedOpen?: boolean;
}) {
  const [open, setOpen] = useState(forcedOpen);
  const [hasBeenOpened, setHasBeenOpened] = useState(forcedOpen); // 🆕 Track if ever opened
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(forcedOpen ? "auto" : "0px");

  const toggle = () => {
    if (!open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight + "px");
      setOpen(true);
      setHasBeenOpened(true); // 🆕 Mark as opened
    } else if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight + "px");
      requestAnimationFrame(() => setHeight("0px"));
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight + "px");
      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight + "px");
      const timeout = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timeout);
    }
  }, [children, open]);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden mb-4">
      <button
        onClick={toggle}
        className="w-full px-4 py-3 text-lg font-semibold flex justify-between transition bg-slate-900 hover:bg-slate-800 cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-2 text-left">
          <span aria-hidden="true">{icon}</span>
          <span className="text-left leading-tight">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {visaSummaDirekt && (
            <span className="text-sm font-bold text-white">{visaSummaDirekt}</span>
          )}
          <span className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>▼</span>
        </div>
      </button>
      <div
        ref={contentRef}
        style={{
          height: height,
          transition: "height 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: open ? "visible" : "hidden",
        }}
      >
        {/* 🆕 Lazy render: Only render children when accordion has been opened at least once */}
        {hasBeenOpened && <div className="p-4 bg-slate-900">{children}</div>}
      </div>
    </div>
  );
}

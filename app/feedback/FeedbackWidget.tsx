"use client";

import { useState } from "react";
import TextFalt from "../_components/TextFalt";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    type: "feedback",
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsSubmitted(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ message: "", type: "feedback" });
        setTimeout(() => {
          setIsSubmitted(false);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Feedback error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideInFromBottomRight {
          0% {
            opacity: 0;
            transform: translate(50px, 50px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes slideOutToBottomRight {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(20px, 20px) scale(0.95);
          }
        }
      `}</style>

      {/* Widget Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
          className="bg-cyan-700 hover:bg-cyan-600 text-slate-100 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2 transform"
        >
          <span
            className={`transition-transform duration-200 ${isOpen ? "rotate-45" : "rotate-0"}`}
          >
            {isOpen ? "✕" : "💬"}
          </span>
          <span className="hidden sm:inline">Hjälp/Feedback</span>
        </button>
      </div>

      {/* Feedback Form */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
          style={{
            animation: isClosing
              ? "slideOutToBottomRight 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"
              : "slideInFromBottomRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Hjälp & Support</h3>
            {!isSubmitted && (
              <p className="text-sm text-slate-300 mb-4">
                Du är väldigt välkommen med frågor eller feedback! Vi svarar snabbt. Tack så mycket!
              </p>
            )}

            {isSubmitted ? (
              <div className="text-center py-4 animate-in fade-in duration-500">
                <div className="text-cyan-400 text-3xl mb-2 animate-in zoom-in duration-300 delay-100">
                  ✓
                </div>
                <p className="text-cyan-400 font-medium animate-in slide-in-from-bottom-2 duration-300 delay-200">
                  Tack för din feedback!
                </p>
                <p className="text-slate-300 text-sm animate-in slide-in-from-bottom-1 duration-300 delay-300">
                  Vi återkommer inom 24h
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-300">
                <div className="animate-in slide-in-from-left-2 duration-300 delay-75">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-md text-slate-100 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 hover:border-slate-400"
                  >
                    <option value="feedback">💡 Feedback</option>
                    <option value="bug">🐛 Buggrapport</option>
                    <option value="support">❓ Support</option>
                    <option value="feature">✨ Funktionsförslag</option>
                  </select>
                </div>

                <div className="animate-in slide-in-from-left-2 duration-300 delay-150">
                  <TextFalt
                    label=""
                    name="message"
                    type="textarea"
                    placeholder="Berätta mer..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-md text-slate-100 text-sm h-24 resize-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 transition-all duration-200 hover:border-slate-400"
                    required
                    maxLength={1000}
                  />
                </div>

                <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300 delay-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-100 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
                  >
                    <span
                      className={`inline-block transition-transform duration-200 ${isSubmitting ? "animate-pulse" : ""}`}
                    >
                      {isSubmitting ? "⏳ Skickar..." : "🚀 Skicka"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-slate-300 hover:text-slate-100 text-sm transition-all duration-200 hover:bg-slate-700 rounded-md"
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-10 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

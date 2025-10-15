"use client";

import { useState } from "react";

export default function KontaktFormular() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    website: "", // HONEYPOT
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "", website: "" });
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        const data = await response.json();
        setError(data.error || "Något gick fel");
      }
    } catch {
      setError("Kunde inte skicka meddelandet. Försök igen senare.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-900/20 border border-green-500 text-green-400 p-6 rounded-xl text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-xl font-bold mb-2">Tack för ditt meddelande!</h3>
        <p>Vi återkommer inom 24 timmar.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HONEYPOT - Dolt fält som bara bots fyller i */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />

      {/* Namn */}
      <div>
        <label htmlFor="name" className="block text-white font-semibold mb-2">
          Namn *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Ditt namn"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-white font-semibold mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="din@email.com"
        />
      </div>

      {/* Meddelande */}
      <div>
        <label htmlFor="message" className="block text-white font-semibold mb-2">
          Meddelande *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          placeholder="Skriv ditt meddelande här..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Skickar..." : "📧 Skicka meddelande"}
      </button>

      <p className="text-slate-400 text-sm text-center">
        * Vi svarar vanligtvis inom 24 timmar på vardagar
      </p>
    </form>
  );
}

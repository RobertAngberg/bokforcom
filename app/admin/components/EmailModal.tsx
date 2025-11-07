"use client";

import { useState } from "react";
import Modal from "../../_components/Modal";
import Knapp from "../../_components/Knapp";
import { sendEmailToUser } from "../actions/emailActions";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName?: string;
}

export default function EmailModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
}: EmailModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Ämne och meddelande måste fyllas i");
      return;
    }

    setSending(true);
    setError(null);

    // Skapa HTML-version av meddelandet
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0e7490 0%, #06b6d4 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Bokför.com</h2>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Detta är ett meddelande från Bokför.com<br>
            <a href="https://bokför.com" style="color: #0e7490;">www.bokför.com</a>
          </p>
        </div>
      </div>
    `;

    const result = await sendEmailToUser(userId, subject, htmlMessage);

    setSending(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setSubject("");
        setMessage("");
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error || "Kunde inte skicka email");
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSubject("");
      setMessage("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Skicka email till ${userName || userEmail}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 px-4 py-2">
        {/* Mottagare info */}
        <div className="bg-slate-800 p-3 rounded-lg">
          <p className="text-sm text-slate-400">Mottagare:</p>
          <p className="text-white font-medium">{userEmail}</p>
        </div>

        {/* Ämne */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Ämne</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="T.ex. Viktig information om ditt konto"
            disabled={sending || success}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Meddelande */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Meddelande</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Skriv ditt meddelande här..."
            disabled={sending || success}
            rows={8}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-3">
            <p className="text-green-400 text-sm">✅ Email skickat!</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avbryt
          </button>
          <Knapp
            text={sending ? "Skickar..." : success ? "Skickat!" : "Skicka Email"}
            onClick={handleSend}
            disabled={sending || success || !subject.trim() || !message.trim()}
          />
        </div>
      </div>
    </Modal>
  );
}

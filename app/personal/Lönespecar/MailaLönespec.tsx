import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import Förhandsgranskning from "./Förhandsgranskning/Förhandsgranskning";
import Knapp from "../../_components/Knapp";

interface MailaLönespecProps {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
}

export default function MailaLönespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader,
  beräknadeVärden = {},
}: MailaLönespecProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visaModal, setVisaModal] = useState(false);

  const handleMaila = async () => {
    setLoading(true);
    setError(null);
    let reactRoot: any = null;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    try {
      const mail = anställd.mail || anställd.epost || anställd.email || "";
      reactRoot = createRoot(container);
      reactRoot.render(
        <Förhandsgranskning
          lönespec={lönespec}
          anställd={anställd}
          företagsprofil={företagsprofil}
          extrarader={extrarader}
          beräknadeVärden={beräknadeVärden}
          onStäng={() => {}}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      const element = container.querySelector("#lonespec-print-area") as HTMLElement;
      if (!element) throw new Error("Kunde inte rendera PDF-innehåll.");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = 210;
      const imgWidth = pdfWidth - 15;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imageData, "PNG", 7.5, 5, imgWidth, imgHeight);
      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("pdf", pdfBlob, "lonespec.pdf");
      formData.append("email", mail);
      formData.append("namn", `${anställd.förnamn} ${anställd.efternamn}`);

      const res = await fetch("/api/send-lonespec", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Kunde inte skicka e-post.");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Något gick fel.");
    } finally {
      setLoading(false);
      if (reactRoot) reactRoot.unmount();
      document.body.removeChild(container);
    }
  };

  return (
    <>
      <Knapp text="✉️ Maila lönespec" onClick={() => setVisaModal(true)} disabled={loading} />
      {visaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 relative border border-slate-700">
            <button
              className="absolute top-2 right-2 text-2xl text-slate-300 hover:text-white"
              onClick={() => setVisaModal(false)}
              disabled={loading}
              aria-label="Stäng"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Maila lönespecifikation</h2>
            <div className="mb-4 text-slate-200">
              En PDF av lönespecen kommer att skickas till:
              <br />
              <span className="font-semibold text-white">
                {anställd.mail || anställd.epost || anställd.email}
              </span>
            </div>
            <div className="flex gap-2">
              <Knapp
                text="✉️ Skicka lönespec"
                onClick={handleMaila}
                disabled={loading || sent}
                loading={loading}
                loadingText="Skickar..."
              />
              <Knapp text="Avbryt" onClick={() => setVisaModal(false)} disabled={loading} />
            </div>
            {error && <div className="text-red-400 mt-3">{error}</div>}
            {sent && <div className="text-green-400 mt-3">Lönespec skickad!</div>}
          </div>
        </div>
      )}
    </>
  );
}

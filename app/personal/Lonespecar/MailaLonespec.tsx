import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import Forhandsgranskning from "../Lonespecar/Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import Knapp from "../../_components/Knapp";

interface SingleLönespec {
  lönespec: any;
  anställd: any;
  företagsprofil: any;
  extrarader: any[];
  beräknadeVärden?: any;
}

interface MailaLonespecProps {
  // For single mode
  lönespec?: any;
  anställd?: any;
  företagsprofil?: any;
  extrarader?: any[];
  beräknadeVärden?: any;
  // For batch mode
  batch?: SingleLönespec[];
  batchMode?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export default function MailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  batch = [],
  batchMode = false,
  open,
  onClose,
}: MailaLonespecProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visaModal, setVisaModal] = useState(false);
  const showModal = open !== undefined ? open : visaModal;

  // Helper for single or batch
  const lönespecList = batchMode
    ? batch
    : [{ lönespec, anställd, företagsprofil, extrarader, beräknadeVärden }];

  // Batch mail logic
  const handleBatchMaila = async () => {
    setLoading(true);
    setError(null);
    let sentCount = 0;
    try {
      for (const item of lönespecList) {
        let reactRoot: any = null;
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        document.body.appendChild(container);
        try {
          const mail = item.anställd.mail || item.anställd.epost || item.anställd.email || "";
          reactRoot = createRoot(container);
          reactRoot.render(
            <Forhandsgranskning
              lönespec={item.lönespec}
              anställd={item.anställd}
              företagsprofil={item.företagsprofil}
              extrarader={item.extrarader}
              beräknadeVärden={item.beräknadeVärden}
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
          formData.append("pdf", pdfBlob, `lonespec.pdf`);
          formData.append("email", mail);
          formData.append("namn", `${item.anställd.förnamn} ${item.anställd.efternamn}`);
          const res = await fetch("/api/send-lonespec", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Kunde inte skicka e-post till " + mail);
          sentCount++;
        } finally {
          if (reactRoot) reactRoot.unmount();
          document.body.removeChild(container);
        }
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Något gick fel vid utskick av lönespecar.");
    } finally {
      setLoading(false);
    }
  };

  // Single mail logic (unchanged)
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
        <Forhandsgranskning
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
      const res = await fetch("/api/send-lonespec", { method: "POST", body: formData });
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

  // Modal rendering
  const closeModal = () => {
    setVisaModal(false);
    onClose?.();
  };

  return (
    <>
      {!batchMode && (
        <Knapp text="✉️ Maila lönespec" onClick={() => setVisaModal(true)} disabled={loading} />
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative border border-slate-700">
            <button
              className="absolute top-2 right-2 text-2xl text-slate-300 hover:text-white"
              onClick={closeModal}
              disabled={loading}
              aria-label="Stäng"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">
              {batchMode ? "Maila lönespecifikationer" : "Maila lönespecifikation"}
            </h2>
            {batchMode ? (
              <>
                <div className="mb-2 text-slate-200 max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {lönespecList.map((item, i) => (
                      <li key={i} className="mb-1">
                        {item.anställd?.förnamn} {item.anställd?.efternamn} –{" "}
                        {item.anställd?.mail || item.anställd?.epost || item.anställd?.email}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4 text-slate-200">
                  {lönespecList.length} lönespecifikationer kommer att skickas ut till respektive
                  anställd.
                </div>
              </>
            ) : (
              <div className="mb-4 text-slate-200">
                En PDF av lönespecen kommer att skickas till:
                <br />
                <span className="font-semibold text-white">
                  {anställd.mail || anställd.epost || anställd.email}
                </span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {batchMode ? (
                <Knapp
                  text="✉️ Maila lönespecar"
                  onClick={handleBatchMaila}
                  disabled={loading || sent}
                  loading={loading}
                  loadingText="Skickar..."
                />
              ) : (
                <Knapp
                  text="✉️ Skicka lönespec"
                  onClick={handleMaila}
                  disabled={loading || sent}
                  loading={loading}
                  loadingText="Skickar..."
                />
              )}
              <Knapp text="Avbryt" onClick={closeModal} disabled={loading} />
            </div>
            {error && <div className="text-red-400 mt-3">{error}</div>}
            {sent && (
              <div className="text-green-400 mt-3">
                {batchMode ? "Alla lönespecar skickades!" : "Lönespec skickad!"}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

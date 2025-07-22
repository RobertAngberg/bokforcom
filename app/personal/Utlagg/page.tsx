"use client";

// Ta bort felaktig import
import MainLayout from "../../_components/MainLayout";
import { useState, useEffect } from "react";
import Forhandsgranskning from "../../bokfor/Forhandsgranskning";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hämtaAllaAnställda } from "../actions";

export default function UtlaggPage() {
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [anstallda, setAnstallda] = useState<any[]>([]);
  const [valdAnstalld, setValdAnstalld] = useState<string>("");
  const [beskrivning, setBeskrivning] = useState("");
  const [belopp, setBelopp] = useState<string>("");
  const [datum, setDatum] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const res = await hämtaAllaAnställda();
      setAnstallda(res);
    })();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFil(file);
    setPdfUrl(URL.createObjectURL(file));
  };

  // Custom style for react-datepicker to fix white background
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .custom-datepicker .react-datepicker__header {
        background-color: #1e293b !important;
        border-bottom: 1px solid #334155 !important;
      }
      .custom-datepicker .react-datepicker__current-month,
      .custom-datepicker .react-datepicker__day-name {
        color: #fff !important;
      }
      .custom-datepicker .react-datepicker__month-dropdown-container,
      .custom-datepicker .react-datepicker__year-dropdown-container {
        background: #1e293b !important;
        color: #fff !important;
      }
      .custom-datepicker .react-datepicker__month-dropdown,
      .custom-datepicker .react-datepicker__year-dropdown {
        background: #1e293b !important;
        color: #fff !important;
      }
      .custom-datepicker .react-datepicker__day--selected,
      .custom-datepicker .react-datepicker__day--keyboard-selected {
        background: #0ea5e9 !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <MainLayout>
      <div className="w-full h-full">
        <h1 className="text-3xl text-white mb-8 text-center">Utlägg</h1>
        <div className="bg-gray-900 rounded-lg p-6 text-white w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr] gap-12 w-full h-full">
            <div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold">Vilken anställd gäller utlägget?</label>
                <select
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                  value={valdAnstalld}
                  onChange={(e) => setValdAnstalld(e.target.value)}
                >
                  <option value="">Välj anställd...</option>
                  {anstallda.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.förnamn} {a.efternamn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold">Beskriv vad utlägget gäller</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                  value={beskrivning}
                  onChange={(e) => setBeskrivning(e.target.value)}
                  placeholder="Ex: Taxi till kundmöte"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold">Belopp i SEK</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                  value={belopp}
                  onChange={(e) => setBelopp(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold">Betaldatum</label>
                <DatePicker
                  selected={datum}
                  onChange={(date) => setDatum(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 custom-datepicker"
                  placeholderText="Välj datum"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>
            <div className="flex flex-col h-full items-center justify-center">
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="mb-6 block w-3/4 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-700 file:text-white hover:file:bg-cyan-800"
              />
              <div className="flex-1 w-full flex flex-col items-center justify-center">
                <Forhandsgranskning fil={fil} pdfUrl={pdfUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

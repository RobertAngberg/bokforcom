// Sparade fakturor komponent

//#region Import
"use client";

import SparadeFakturor from "../_components/SparadeFakturor";
import MainLayout from "../../_components/MainLayout";
import Link from "next/link";
import Toast from "../../_components/Toast";
import { useSparadeFakturor, useSparadeFakturorPage } from "../_hooks/useLeverantorer";
import { useFakturaClient } from "../_hooks/useFaktura";
import { FakturaProvider } from "../_context/FakturaContext";
//#endregion

function SparadeContent({ data }: { data: any }) {
  const { toastState, clearToast } = useFakturaClient();
  const { hanteraValdFaktura } = useSparadeFakturor(data?.fakturor || []);

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute left-0 top-1">
            <Link
              href="/faktura"
              className="flex items-center gap-2 text-white font-bold px-3 py-2 rounded hover:bg-gray-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Tillbaka
            </Link>
          </div>
          <h1 className="text-3xl text-center w-full">Sparade Fakturor</h1>
        </div>

        <SparadeFakturor
          fakturor={data?.fakturor || []}
          activeInvoiceId={undefined}
          onSelectInvoice={hanteraValdFaktura}
        />
      </MainLayout>

      {toastState.isVisible && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          isVisible={toastState.isVisible}
          onClose={clearToast}
        />
      )}
    </>
  );
}

export default function Sparade() {
  const { data } = useSparadeFakturorPage();

  return (
    <FakturaProvider>
      <SparadeContent data={data} />
    </FakturaProvider>
  );
}

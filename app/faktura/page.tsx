import MainLayout from "../_components/MainLayout";
import Link from "next/link";

export default function FakturaPage() {
  return (
    <MainLayout>
      <h1 className="text-3xl mb-10 text-center text-white">Fakturor</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/faktura/Sparade"
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📄</span> Sparade fakturor
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">
            Visa och hantera tidigare skapade fakturor.
          </p>
        </Link>

        <Link
          href="/faktura/Leverantorsfakturor"
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📋</span> Leverantörsfakturor
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">
            Hantera inkommande fakturor från leverantörer.
          </p>
        </Link>

        <Link
          href="/faktura/NyFaktura"
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📝</span> Ny faktura
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">Skapa en helt ny faktura från början.</p>
        </Link>
      </div>
    </MainLayout>
  );
}

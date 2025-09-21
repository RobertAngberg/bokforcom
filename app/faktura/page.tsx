import MainLayout from "../_components/MainLayout";
import FakturaKnapp from "./FramsidaKnapp";

export default function FakturaPage() {
  return (
    <MainLayout>
      <h1 className="text-3xl mb-10 text-center text-white">Fakturor</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FakturaKnapp
          emoji="📄"
          title="Sparade fakturor"
          description="Visa och hantera tidigare skapade fakturor."
          href="/faktura/Sparade"
        />
        <FakturaKnapp
          emoji="📋"
          title="Leverantörsfakturor"
          description="Hantera inkommande fakturor från leverantörer."
          href="/faktura/Leverantorsfakturor"
        />
        <FakturaKnapp
          emoji="📝"
          title="Ny faktura"
          description="Skapa en helt ny faktura från början."
          href="/faktura/NyFaktura"
        />
      </div>
    </MainLayout>
  );
}

import MainLayout from "../_components/MainLayout";
import Anvandarprofil from "./_components/Anvandarprofil";
import Foretagsprofil from "./_components/Foretagsprofil";
import Farozon from "./_components/Farozon";

export default function AdminPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 pt-2">
        <h1 className="text-3xl mb-8 text-center">Administration</h1>
        <Anvandarprofil />
        <Foretagsprofil />
        <Farozon />
        <div className="mb-4 text-center">
          <a
            href="/sie"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg transition-colors"
          >
            📄 SIE Export/Import
          </a>
        </div>
      </div>
    </MainLayout>
  );
}

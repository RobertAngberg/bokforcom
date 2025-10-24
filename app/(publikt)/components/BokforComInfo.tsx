import ProtectedEmail from "./ProtectedEmail";

export default function BokforComInfo() {
  return (
    <div className="mt-12 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">📋 Företagsinformation</h3>
      <div className="grid md:grid-cols-2 gap-4 text-slate-300">
        <div>
          <p>
            <strong className="text-white">Organisationsnummer:</strong> 830618-6910
          </p>
          <p>
            <strong className="text-white">Momsregistreringsnummer:</strong> SE830618691001
          </p>
        </div>
        <div>
          <p>
            <strong className="text-white">Kontakt:</strong>{" "}
            <ProtectedEmail encoded="aW5mb0Bib2tmw7ZyLmNvbQ==" className="text-slate-300" />
          </p>
          <p>
            <strong className="text-white">Telefon:</strong> Tillgängligt för premiumkunder
          </p>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-4 text-center">
        Vi är registrerade för moms och innehar F-skattesedel.
      </p>
    </div>
  );
}

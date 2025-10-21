export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/Logo.png" alt="Bokför.com" className="h-12 w-auto" />
            <span className="text-white font-semibold text-2xl font-bold">Bokför.com</span>
          </div>
          <div className="flex space-x-6 text-slate-400">
            <a href="/signup" className="hover:text-white transition-colors">
              Användaravtal
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Integritet
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
        <div className="text-center text-slate-400 text-sm mt-4">
          © 2025 Bokför.com - Svensk bokföring gjord enkelt.
        </div>
      </div>
    </footer>
  );
}

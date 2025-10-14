export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-white font-semibold">Bokföringsapp</span>
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
          © 2025 Bokföringsapp. Svensk bokföring gjord enkelt.
        </div>
      </div>
    </footer>
  );
}

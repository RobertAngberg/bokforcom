export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center space-y-4">
        {/* Dual Spinner Design */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-400/30 rounded-full animate-spin" />
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-cyan-400 rounded-full animate-spin" />
        </div>

        {/* Animated Loading Text */}
        <div className="text-lg font-medium text-white">
          Laddar
          <span className="animate-bounce inline-block animation-delay-75">.</span>
          <span className="animate-bounce inline-block animation-delay-100">.</span>
          <span className="animate-bounce inline-block animation-delay-200">.</span>
        </div>
      </div>
    </div>
  );
}

import FeedbackWidget from "../feedback/FeedbackWidget";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-cyan-950 overflow-x-hidden text-slate-100">
      {/* Subtle decorative lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-950/30" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-950/30" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-950/30" />
      </div>

      {/* Content */}
      <div className="relative w-full p-4 md:p-6 lg:p-8">{children}</div>
      <FeedbackWidget />
    </main>
  );
}

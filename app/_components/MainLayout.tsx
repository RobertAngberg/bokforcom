import FeedbackWidget from "../feedback/FeedbackWidget";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-slate-950 overflow-x-hidden text-slate-100">
      {/* Mobil: liten padding, Desktop: mer utrymme */}
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        <div className="w-full max-w-6xl p-5 md:p-8 bg-cyan-950 border border-cyan-800 rounded-2xl shadow-lg">
          {children}
        </div>
      </div>
      <FeedbackWidget />
    </main>
  );
}

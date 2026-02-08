import FeedbackWidget from "../feedback/FeedbackWidget";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-cyan-950 overflow-x-hidden text-slate-100">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="border border-slate-950/40 p-4 md:p-6 lg:p-8">{children}</div>
      </div>
      <FeedbackWidget />
    </main>
  );
}

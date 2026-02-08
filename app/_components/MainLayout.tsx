import FeedbackWidget from "../feedback/FeedbackWidget";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-slate-950 overflow-x-hidden text-slate-100">
      <div className="w-full max-w-6xl mx-auto py-3 md:py-5 lg:py-6">
        <div className="bg-cyan-950 p-4 md:p-6 lg:p-8">{children}</div>
      </div>
      <FeedbackWidget />
    </main>
  );
}

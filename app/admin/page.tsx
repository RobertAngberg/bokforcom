import MainLayout from "../_components/MainLayout";
import { hamtaAnvandarInfo } from "./_actions/anvandarActions";
import { hamtaForetagsprofilAdmin } from "./_actions/foretagsActions";
import { auth } from "../auth";
import Admin from "./_components/Admin";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Du måste vara inloggad för att se denna sida.</div>
        </div>
      </MainLayout>
    );
  }

  const [initialUser, initialForetag] = await Promise.all([
    hamtaAnvandarInfo(),
    hamtaForetagsprofilAdmin(),
  ]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 pt-2">
        <h1 className="text-3xl mb-8 text-center">Administration</h1>
        <Admin session={session} initialUser={initialUser} initialForetag={initialForetag} />
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

import { redirect } from "next/navigation";
import { requireAdmin } from "./lib/adminAuth";
import { getImpersonationStatus } from "./actions/impersonation";
import AdminDashboard from "./components/AdminDashboard";
import ImpersonationBanner from "./components/ImpersonationBanner";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Not authenticated") {
      redirect("/login");
    }

    // Access denied for authenticated users
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Åtkomst nekad</h1>
          <p className="mb-2">Du har inte behörighet att komma åt admin-panelen.</p>
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  // Check impersonation status
  const impersonationStatus = await getImpersonationStatus();

  return (
    <>
      {impersonationStatus.isImpersonating && impersonationStatus.targetUser && (
        <ImpersonationBanner targetUser={impersonationStatus.targetUser} />
      )}
      <AdminDashboard />
    </>
  );
}

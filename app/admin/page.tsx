"use client";

import MainLayout from "../_components/MainLayout";
import { useAdminPageState } from "./_hooks";
import {
  AdminHeader,
  UserProfileSection,
  CompanyProfileSection,
  DeleteSection,
} from "./_components";

export default function AdminPage() {
  const { auth, userProfile, companyProfile, deleteConfirmation, isLoading } = useAdminPageState();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Laddar...</div>
        </div>
      </MainLayout>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Du måste vara inloggad för att se denna sida.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <AdminHeader />
        <UserProfileSection {...userProfile} />
        <CompanyProfileSection {...companyProfile} />
        <DeleteSection {...deleteConfirmation} />

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

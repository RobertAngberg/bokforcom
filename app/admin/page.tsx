"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import MainLayout from "../_components/MainLayout";
import { useUserProfile, useCompanyProfile, useDeleteConfirmation } from "./_hooks";
import {
  AdminHeader,
  UserProfileSection,
  CompanyProfileSection,
  DeleteSection,
} from "./_components";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const userProfile = useUserProfile();
  const companyProfile = useCompanyProfile();
  const deleteConfirmation = useDeleteConfirmation();

  useEffect(() => {
    if (session?.user?.id) {
      userProfile.fetchUserInfo();
      companyProfile.fetchCompanyProfile();
    }
  }, [session]);

  if (status === "loading" || userProfile.loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Laddar...</div>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
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

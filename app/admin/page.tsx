"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MainLayout from "../_components/MainLayout";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  skapad?: string;
  uppdaterad?: string;
  provider?: string;
}

export default function Page() {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInfo();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/admin/user-info");
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout>
        <div className="text-center text-white">Laddar...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl text-center text-white mb-6">Adminpanel</h1>

        {/* Användarinformation */}
        {session?.user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
              👤 Användarinformation
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Namn:</span>
                  <span className="text-white ml-2">{session.user.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white ml-2">{session.user.email}</span>
                </div>
                {session.user.image && (
                  <div>
                    <span className="text-gray-400">Profilbild:</span>
                    <img
                      src={session.user.image}
                      alt="Profilbild"
                      className="w-12 h-12 rounded-full ml-2 inline-block"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 text-center">
          <a
            href="/sie"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            📊 SIE Export/Import
          </a>
        </div>
      </div>
    </MainLayout>
  );
}

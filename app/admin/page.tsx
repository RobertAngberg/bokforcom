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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        setEditForm({
          name: data.name || "",
          email: data.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || "",
      email: userInfo?.email || "",
    });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage({ type: "error", text: "Namn och email får inte vara tomma" });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserInfo(updatedUser);
        setIsEditing(false);
        setMessage({ type: "success", text: "Användarinformation uppdaterad!" });

        // Uppdatera sessionen
        window.location.reload();
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Kunde inte uppdatera information" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
    } finally {
      setIsSaving(false);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white flex items-center gap-2">👤 Användarinformation</h2>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                  ✏️ Redigera
                </button>
              )}
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-md ${
                  message.type === "success"
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Namn:</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Ditt namn"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Email:</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="din@email.com"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors"
                    >
                      {isSaving ? "Sparar..." : "💾 Spara"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                    >
                      ❌ Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Namn:</span>
                    <span className="text-white ml-2">{userInfo?.name || session.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{userInfo?.email || session.user.email}</span>
                  </div>
                  {userInfo?.provider && userInfo.provider !== "credentials" && (
                    <div>
                      <span className="text-gray-400">Inloggningsmetod:</span>
                      <span className="text-white ml-2 capitalize">{userInfo.provider}</span>
                    </div>
                  )}
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
              )}
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

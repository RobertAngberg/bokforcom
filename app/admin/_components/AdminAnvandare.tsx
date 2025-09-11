// 🎯 EXEMPEL: Admin User Section Component
// Visar hur den nya hook-strukturen kan anvandas

"use client";

import { useAdminAnvandarhantering } from "../_hooks/useAdminAnvandarhantering";

export default function AdminAnvandare() {
  const {
    userInfo,
    editForm,
    isEditing,
    isSaving,
    loading,
    message,
    handleEdit,
    handleCancel,
    handleSave,
    updateEditForm,
    clearMessage,
  } = useAdminAnvandarhantering();

  if (loading) {
    return <div className="text-white">Laddar anvandarinformation...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">👤 Anvandarinformation</h2>
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
          <button onClick={clearMessage} className="ml-2 text-sm underline">
            Stang
          </button>
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
                onChange={(e) => updateEditForm("name", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ditt namn"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Email:</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => updateEditForm("email", e.target.value)}
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
              <span className="text-white ml-2">{userInfo?.name || "Ej angivet"}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="text-white ml-2">{userInfo?.email || "Ej angivet"}</span>
            </div>
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="text-white ml-2">{userInfo?.id || "Ej angivet"}</span>
            </div>
            {userInfo?.skapad && (
              <div>
                <span className="text-gray-400">Skapad:</span>
                <span className="text-white ml-2">
                  {new Date(userInfo.skapad).toLocaleDateString("sv-SE")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import type { AnvandarprofilSektionProps } from "../_types/types";

export default function Anvandarprofil({
  userInfo,
  editForm,
  state: { isEditing, isSaving, message },
  session,
  handlers: { handleEdit, handleCancel, handleSave, updateEditForm },
}: AnvandarprofilSektionProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">👤 Användarinformation</h2>
        {!isEditing && (
          <Knapp
            text="✏️ Redigera"
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700"
          />
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
            <TextFalt
              label="Namn"
              name="name"
              type="text"
              value={editForm.name}
              onChange={(e) => updateEditForm("name", e.target.value)}
              placeholder="Ditt namn"
              
            />
            <TextFalt
              label="E-post"
              name="email"
              type="email"
              value={editForm.email}
              onChange={(e) => updateEditForm("email", e.target.value)}
              placeholder="din@email.com"
              
            />

            <div className="flex gap-3 pt-2">
              <Knapp
                text="💾 Spara"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
                loadingText="Sparar..."
              />
              <Knapp
                text="❌ Avbryt"
                onClick={handleCancel}
                disabled={isSaving}
                className="bg-gray-600 hover:bg-gray-700"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Namn:</span>
              <span className="text-white ml-2">{userInfo?.name || session?.user?.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="text-white ml-2">{userInfo?.email || session?.user?.email}</span>
            </div>
            {session?.user?.image && (
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
  );
}

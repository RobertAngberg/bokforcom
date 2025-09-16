"use client";

import Knapp from "../../_components/Knapp";
import TextFalt from "../../_components/TextFalt";
import { useAnvandarprofil } from "../_hooks/useAnvandarprofil";

export default function Anvandarprofil() {
  const { state, handlers } = useAnvandarprofil();

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white flex items-center gap-2">👤 Användarinformation</h2>
        {!state.isEditing && (
          <Knapp
            text="✏️ Redigera"
            onClick={handlers.onEdit}
            className="bg-blue-600 hover:bg-blue-700"
          />
        )}
      </div>

      {state.message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            state.message.type === "success"
              ? "bg-green-600/20 text-green-400"
              : "bg-red-600/20 text-red-400"
          }`}
        >
          {state.message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {state.isEditing ? (
          <div className="space-y-4">
            <TextFalt
              label="Namn"
              name="name"
              type="text"
              value={state.editForm.name}
              onChange={(e) => handlers.onChange("name", e.target.value)}
              placeholder="Ditt namn"
            />
            <TextFalt
              label="E-post"
              name="email"
              type="email"
              value={state.editForm.email}
              onChange={(e) => handlers.onChange("email", e.target.value)}
              placeholder="din@email.com"
            />

            <div className="flex gap-3 pt-2">
              <Knapp
                text="💾 Spara"
                onClick={handlers.onSave}
                disabled={state.isSaving}
                loading={state.isSaving}
                loadingText="Sparar..."
              />
              <Knapp
                text="❌ Avbryt"
                onClick={handlers.onCancel}
                disabled={state.isSaving}
                className="bg-gray-600 hover:bg-gray-700"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Namn:</span>
              <span className="text-white ml-2">{state.userInfo?.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="text-white ml-2">{state.userInfo?.email}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

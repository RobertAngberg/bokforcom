"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MainLayout from "../_components/MainLayout";
import {
  hämtaAnvändarInfo,
  uppdateraAnvändarInfo,
  hämtaFöretagsprofilAdmin,
  uppdateraFöretagsprofilAdmin,
} from "./actions";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  skapad?: string;
  uppdaterad?: string;
  provider?: string;
}

interface FöretagsProfil {
  företagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  epost: string;
  webbplats: string;
}

export default function Page() {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [företagsProfil, setFöretagsProfil] = useState<FöretagsProfil>({
    företagsnamn: "",
    adress: "",
    postnummer: "",
    stad: "",
    organisationsnummer: "",
    momsregistreringsnummer: "",
    telefonnummer: "",
    epost: "",
    webbplats: "",
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [companyMessage, setCompanyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInfo();
      fetchCompanyProfile();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const data = await hämtaAnvändarInfo();
      if (data) {
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

  const fetchCompanyProfile = async () => {
    try {
      const data = await hämtaFöretagsprofilAdmin();
      if (data) {
        setFöretagsProfil(data);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
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
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("email", editForm.email.trim());

      const result = await uppdateraAnvändarInfo(formData);

      if (result.success) {
        setUserInfo(result.user);
        setIsEditing(false);
        setMessage({ type: "success", text: "Användarinformation uppdaterad!" });

        // Uppdatera sessionen
        window.location.reload();
      } else {
        setMessage({ type: "error", text: result.error || "Kunde inte uppdatera information" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setCompanyMessage(null);
    // Återställ till ursprungliga värden
    fetchCompanyProfile();
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const formData = new FormData();
      Object.entries(företagsProfil).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await uppdateraFöretagsprofilAdmin(formData);

      if (result.success) {
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Företagsprofil uppdaterad!" });
        await fetchCompanyProfile();
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte uppdatera företagsprofil",
        });
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCompanyInputChange = (field: keyof FöretagsProfil, value: string) => {
    setFöretagsProfil((prev) => ({
      ...prev,
      [field]: value,
    }));
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

        {/* Företagsprofil */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white flex items-center gap-2">🏢 Företagsprofil</h2>
            {!isEditingCompany && (
              <button
                onClick={handleEditCompany}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
              >
                ✏️ Redigera
              </button>
            )}
          </div>

          {companyMessage && (
            <div
              className={`mb-4 p-3 rounded-md ${
                companyMessage.type === "success"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {companyMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {isEditingCompany ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Företagsnamn:</label>
                    <input
                      type="text"
                      value={företagsProfil.företagsnamn}
                      onChange={(e) => handleCompanyInputChange("företagsnamn", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Företagsnamn AB"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Organisationsnummer:</label>
                    <input
                      type="text"
                      value={företagsProfil.organisationsnummer}
                      onChange={(e) =>
                        handleCompanyInputChange("organisationsnummer", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="556789-1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Adress:</label>
                  <input
                    type="text"
                    value={företagsProfil.adress}
                    onChange={(e) => handleCompanyInputChange("adress", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Exempel gatan 123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Postnummer:</label>
                    <input
                      type="text"
                      value={företagsProfil.postnummer}
                      onChange={(e) => handleCompanyInputChange("postnummer", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="123 45"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Stad:</label>
                    <input
                      type="text"
                      value={företagsProfil.stad}
                      onChange={(e) => handleCompanyInputChange("stad", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Stockholm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Telefonnummer:</label>
                    <input
                      type="text"
                      value={företagsProfil.telefonnummer}
                      onChange={(e) => handleCompanyInputChange("telefonnummer", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="08-123 456 78"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">E-post:</label>
                    <input
                      type="email"
                      value={företagsProfil.epost}
                      onChange={(e) => handleCompanyInputChange("epost", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="info@företag.se"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Momsregistreringsnummer:</label>
                    <input
                      type="text"
                      value={företagsProfil.momsregistreringsnummer}
                      onChange={(e) =>
                        handleCompanyInputChange("momsregistreringsnummer", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="SE556789123401"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Webbplats:</label>
                    <input
                      type="url"
                      value={företagsProfil.webbplats}
                      onChange={(e) => handleCompanyInputChange("webbplats", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="https://www.företag.se"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveCompany}
                    disabled={isSavingCompany}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors"
                  >
                    {isSavingCompany ? "Sparar..." : "💾 Spara"}
                  </button>
                  <button
                    onClick={handleCancelCompany}
                    disabled={isSavingCompany}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                  >
                    ❌ Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Företagsnamn:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.företagsnamn || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Organisationsnummer:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.organisationsnummer || "Ej angett"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Adress:</span>
                  <span className="text-white ml-2">{företagsProfil.adress || "Ej angett"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Postnummer:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.postnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stad:</span>
                    <span className="text-white ml-2">{företagsProfil.stad || "Ej angett"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Telefonnummer:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.telefonnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">E-post:</span>
                    <span className="text-white ml-2">{företagsProfil.epost || "Ej angett"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Momsregistreringsnummer:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.momsregistreringsnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Webbplats:</span>
                    <span className="text-white ml-2">
                      {företagsProfil.webbplats || "Ej angett"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

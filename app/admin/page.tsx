"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MainLayout from "../_components/MainLayout";
import Knapp from "../_components/Knapp";
import {
  hamtaAnvandarInfo,
  uppdateraAnvandarInfo,
  hamtaForetagsprofilAdmin,
  uppdateraForetagsprofilAdmin,
  raderaForetag,
} from "./_actions";
import type { UserInfo, ForetagsProfil } from "./_types/types";
import { signOut } from "next-auth/react";

export default function Page() {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [foretagsProfil, setForetagsProfil] = useState<ForetagsProfil>({
    foretagsnamn: "",
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      const data = await hamtaAnvandarInfo();
      if (data) {
        setUserInfo(data);
        setEditForm({
          name: data.name || session?.user?.name || "",
          email: data.email || session?.user?.email || "",
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
      const data = await hamtaForetagsprofilAdmin();
      if (data) {
        setForetagsProfil(data);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
    });
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
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

      const result = await uppdateraAnvandarInfo(formData);

      if (result.success) {
        setUserInfo(result.user || null);
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
      Object.entries(foretagsProfil).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const result = await uppdateraForetagsprofilAdmin(formData);

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

  const handleCompanyInputChange = (field: keyof ForetagsProfil, value: string) => {
    setForetagsProfil((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      const result = await raderaForetag();

      if (result.success) {
        // Radering lyckades - logga ut användaren
        await signOut({ callbackUrl: "/" });
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte radera företag",
        });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      setCompanyMessage({
        type: "error",
        text: "Ett fel uppstod vid radering",
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
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
                    <span className="text-white ml-2">{userInfo?.name || session.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{userInfo?.email || session.user.email}</span>
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
              )}
            </div>
          </div>
        )}

        {/* Företagsprofil */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white flex items-center gap-2">🏢 Företagsprofil</h2>
            {!isEditingCompany && (
              <Knapp
                text="✏️ Redigera"
                onClick={handleEditCompany}
                className="bg-blue-600 hover:bg-blue-700"
              />
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
                      value={foretagsProfil.foretagsnamn}
                      onChange={(e) => handleCompanyInputChange("foretagsnamn", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Företagsnamn AB"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Organisationsnummer:</label>
                    <input
                      type="text"
                      value={foretagsProfil.organisationsnummer}
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
                    value={foretagsProfil.adress}
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
                      value={foretagsProfil.postnummer}
                      onChange={(e) => handleCompanyInputChange("postnummer", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="123 45"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Stad:</label>
                    <input
                      type="text"
                      value={foretagsProfil.stad}
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
                      value={foretagsProfil.telefonnummer}
                      onChange={(e) => handleCompanyInputChange("telefonnummer", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="08-123 456 78"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">E-post:</label>
                    <input
                      type="email"
                      value={foretagsProfil.epost}
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
                      value={foretagsProfil.momsregistreringsnummer}
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
                      value={foretagsProfil.webbplats}
                      onChange={(e) => handleCompanyInputChange("webbplats", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="https://www.företag.se"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Knapp
                    text="💾 Spara"
                    onClick={handleSaveCompany}
                    disabled={isSavingCompany}
                    loading={isSavingCompany}
                    loadingText="Sparar..."
                  />
                  <Knapp
                    text="❌ Avbryt"
                    onClick={handleCancelCompany}
                    disabled={isSavingCompany}
                    className="bg-gray-600 hover:bg-gray-700"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Företagsnamn:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.foretagsnamn || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Organisationsnummer:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.organisationsnummer || "Ej angett"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Adress:</span>
                  <span className="text-white ml-2">{foretagsProfil.adress || "Ej angett"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Postnummer:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.postnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stad:</span>
                    <span className="text-white ml-2">{foretagsProfil.stad || "Ej angett"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Telefonnummer:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.telefonnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">E-post:</span>
                    <span className="text-white ml-2">{foretagsProfil.epost || "Ej angett"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Momsregistreringsnummer:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.momsregistreringsnummer || "Ej angett"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Webbplats:</span>
                    <span className="text-white ml-2">
                      {foretagsProfil.webbplats || "Ej angett"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Radera företag sektion */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">⚠️ Radera företag</h3>
          <p className="text-gray-300 mb-4">
            Radera hela företagsprofilen och all tillhörande data.
            <br />
            <strong className="text-red-400"> Detta kan inte ångras!</strong>
          </p>
          <Knapp
            text={isDeleting ? "Raderar..." : "Radera företag"}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            loading={isDeleting}
            loadingText="Raderar..."
            className="bg-red-600 hover:bg-red-700"
          />
        </div>

        {/* Bekräftelsedialog för radering */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-red-400 mb-4">⚠️ Bekräfta radering</h3>
              <p className="text-gray-300 mb-4">
                Är du säker på att du vill radera hela företagsprofilen? Detta kommer att:
              </p>
              <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-1">
                <li>Radera alla fakturor och transaktioner</li>
                <li>Radera alla anställda och lönespecifikationer</li>
                <li>Radera alla utlägg och förval</li>
                <li>Radera företagsprofilen</li>
                <li>Radera ditt användarkonto</li>
                <li>Logga ut dig automatiskt</li>
              </ul>
              <p className="text-red-400 font-semibold mb-6">Detta kan inte ångras!</p>
              <div className="flex gap-3">
                <Knapp
                  text="Avbryt"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200"
                />
                <Knapp
                  text={isDeleting ? "Raderar..." : "Ja, radera allt"}
                  onClick={handleDeleteCompany}
                  disabled={isDeleting}
                  loading={isDeleting}
                  loadingText="Raderar..."
                  className="flex-1 bg-red-600 hover:bg-red-700"
                />
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

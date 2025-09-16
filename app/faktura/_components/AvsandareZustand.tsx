"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import TextFalt from "../../_components/TextFalt";
import { hämtaFöretagsprofil, sparaFöretagsprofil, uploadLogoAction } from "../actions";
import { getProxyImageUrl } from "../_utils/imageProxy";
import { useFakturaClient } from "../_hooks/useFakturaClient";
import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";

export default function AvsandareZustand() {
  const { data: session } = useSession();
  const { formData, updateFormField, updateMultipleFields, showError, showSuccess } =
    useFakturaClient();

  const [form, setForm] = useState({
    företagsnamn: "",
    adress: "",
    postnummer: "",
    stad: "",
    organisationsnummer: "",
    momsregistreringsnummer: "",
    telefonnummer: "",
    epost: "",
    webbplats: "",
    logo: "",
    logoWidth: 200,
  });

  const [sparat, setSparat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "error" as "success" | "error" | "info",
    isVisible: false,
  });

  // Ladda företagsprofil när komponenten mountas
  useEffect(() => {
    const ladda = async () => {
      if (session?.user?.id) {
        const data = await hämtaFöretagsprofil(session.user.id);
        if (data) {
          const safeData = {
            företagsnamn: data.företagsnamn || "",
            adress: data.adress || "",
            postnummer: data.postnummer || "",
            stad: data.stad || "",
            organisationsnummer: data.organisationsnummer || "",
            momsregistreringsnummer: data.momsregistreringsnummer || "",
            telefonnummer: data.telefonnummer || "",
            epost: data.epost || "",
            webbplats: data.webbplats || "",
            logo: data.logo || "",
            logoWidth: data.logo_width || 200,
          };

          // Bara uppdatera Zustand store, inte lokal state
          updateMultipleFields(safeData);
        }
      }
    };

    ladda();
  }, [session, updateMultipleFields]);

  // Synka med Zustand store
  useEffect(() => {
    setForm({
      företagsnamn: formData.företagsnamn || "",
      adress: formData.adress || "",
      postnummer: formData.postnummer || "",
      stad: formData.stad || "",
      organisationsnummer: formData.organisationsnummer || "",
      momsregistreringsnummer: formData.momsregistreringsnummer || "",
      telefonnummer: formData.telefonnummer || "",
      epost: formData.epost || "",
      webbplats: formData.webbplats || "",
      logo: formData.logo || "",
      logoWidth: formData.logoWidth || 200,
    });
  }, [formData]);

  // Hantera ändringar i formuläret
  const hanteraTangentNer = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Uppdatera Zustand store direkt
    updateFormField(name as keyof typeof formData, value);
  };

  const hanteraLoggaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({
        message: "Bara bildfiler tillåtna (PNG, JPG, GIF, WebP).",
        type: "error",
        isVisible: true,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadLogoAction(formData);

      if (result.success && result.url) {
        setForm((prev) => ({ ...prev, logo: result.url || "" }));
        updateFormField("logo", result.url || "");

        setToast({
          message: "Logga laddades upp!",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: result.error || "Kunde inte ladda upp logga.",
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      setToast({
        message: "Fel vid uppladdning av logga.",
        type: "error",
        isVisible: true,
      });
    }
  };

  const spara = async () => {
    if (!session?.user?.id) return;

    const dataToSave = {
      företagsnamn: form.företagsnamn,
      adress: form.adress,
      postnummer: form.postnummer,
      stad: form.stad,
      organisationsnummer: form.organisationsnummer,
      momsregistreringsnummer: form.momsregistreringsnummer,
      telefonnummer: form.telefonnummer,
      epost: form.epost,
      webbplats: form.webbplats,
    };

    const res = await sparaFöretagsprofil(session.user.id, dataToSave);

    if (res.success) {
      setSparat(true);
      setTimeout(() => setSparat(false), 3000);
    } else {
      setToast({
        message: "Kunde inte spara uppgifter.",
        type: "error",
        isVisible: true,
      });
    }
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextFalt
          label="Företagsnamn"
          name="företagsnamn"
          value={form.företagsnamn}
          onChange={hanteraTangentNer}
          placeholder="Ange företagsnamn"
        />

        <TextFalt
          label="Organisationsnummer"
          name="organisationsnummer"
          value={form.organisationsnummer}
          onChange={hanteraTangentNer}
          placeholder="123456-7890"
        />

        <TextFalt
          label="Adress"
          name="adress"
          value={form.adress}
          onChange={hanteraTangentNer}
          placeholder="Gatunamn 123"
        />

        <TextFalt
          label="Postnummer"
          name="postnummer"
          value={form.postnummer}
          onChange={hanteraTangentNer}
          placeholder="12345"
        />

        <TextFalt
          label="Stad"
          name="stad"
          value={form.stad}
          onChange={hanteraTangentNer}
          placeholder="Stockholm"
        />

        <TextFalt
          label="Telefonnummer"
          name="telefonnummer"
          value={form.telefonnummer}
          onChange={hanteraTangentNer}
          placeholder="08-123 456 78"
        />

        <TextFalt
          label="E-post"
          name="epost"
          value={form.epost}
          onChange={hanteraTangentNer}
          placeholder="info@företag.se"
        />

        <TextFalt
          label="Webbplats"
          name="webbplats"
          value={form.webbplats}
          onChange={hanteraTangentNer}
          placeholder="www.företag.se"
        />

        <TextFalt
          label="Momsregistreringsnummer"
          name="momsregistreringsnummer"
          value={form.momsregistreringsnummer}
          onChange={hanteraTangentNer}
          placeholder="SE556123123401"
        />
      </div>

      {/* Logosektion */}
      <div className="mt-6 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Företagslogga</h3>
        <div className="flex items-center space-x-4">
          {form.logo && (
            <div className="shrink-0">
              <Image
                src={getProxyImageUrl(form.logo)}
                alt="Företagslogga"
                width={form.logoWidth}
                height={100}
                className="object-contain rounded"
                style={{ height: "auto", maxHeight: "100px" }}
              />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={hanteraLoggaUpload}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF eller WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Sparaknappar */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        {sparat && (
          <div className="flex items-center text-green-600 mr-4">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Sparat!
          </div>
        )}
        <Knapp text="Spara avsändare" onClick={spara} />
      </div>
    </>
  );
}

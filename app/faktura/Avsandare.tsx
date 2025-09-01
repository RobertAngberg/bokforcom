//#region Huvud
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import TextFalt from "../_components/TextFalt";
import { hämtaFöretagsprofil, sparaFöretagsprofil } from "./actions";
import { uploadCompanyLogo } from "../_utils/blobUpload";
import Knapp from "../_components/Knapp";
//#endregion

export default function Avsandare() {
  //#region Session, state och vars
  const { data: session } = useSession();

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
  //#endregion

  //#region Ladda företagsprofil
  // Ladda företagsprofil när komponenten mountas
  useEffect(() => {
    const ladda = async () => {
      if (session?.user?.id) {
        const data = await hämtaFöretagsprofil(session.user.id);
        if (data) {
          // Säkerställ att alla fält är strängar (inte null/undefined)
          setForm({
            företagsnamn: data.företagsnamn || "",
            adress: data.adress || "",
            postnummer: data.postnummer || "",
            stad: data.stad || "",
            organisationsnummer: data.organisationsnummer || "",
            momsregistreringsnummer: data.momsregistreringsnummer || "",
            telefonnummer: data.telefonnummer || "",
            epost: data.epost || "",
            webbplats: data.webbplats || "",
            logo: "", // Laddas separat från localStorage
            logoWidth: 200,
          });
        }

        // Endast logo från localStorage (inte logoWidth)
        const logo = localStorage.getItem("company_logo");
        if (logo) setForm((prev) => ({ ...prev, logo }));
      }
    };
    ladda();
  }, [session]);

  // Ladda sparad logotyp från localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem("company_logo");
    if (savedLogo) {
      setForm((prev) => ({ ...prev, logo: savedLogo }));
    }
  }, []);
  //#endregion

  //#region Hanterare
  // Hantera ändringar i formuläret
  const hanteraTangentNer = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const hanteraLoggaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SÄKERHETSVALIDERING: Filtyp
    if (!file.type.startsWith("image/")) {
      alert("❌ Bara bildfiler tillåtna (PNG, JPG, GIF, WebP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      // Ladda upp till Vercel Blob
      const result = await uploadCompanyLogo(file);

      if (result.success && result.url) {
        // Uppdatera form med URL:en från Vercel Blob
        setForm((prev) => ({ ...prev, logo: result.url || "" }));

        // Spara även i localStorage som backup/cache
        localStorage.setItem("company_logo", result.url);

        alert("✅ Logotyp uppladdad!");
      } else {
        alert(`❌ Upload misslyckades: ${result.error}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("❌ Ett fel uppstod vid uppladdning");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hanteraTaBortLogga = () => {
    setForm((prev) => ({ ...prev, logo: "" }));
    localStorage.removeItem("company_logo");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Nollställ inputen!
    }
  };

  const hanteraSubmit = async () => {
    if (!session?.user?.id) return;

    console.log("🔍 Sparar epost:", form.epost); // Debug

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

    console.log("📤 Data som skickas:", dataToSave); // Debug

    const res = await sparaFöretagsprofil(session.user.id, dataToSave);

    if (res.success) {
      setSparat(true);
      setTimeout(() => setSparat(false), 3000);
    } else {
      alert("Kunde inte spara uppgifter.");
    }
  };
  //#endregion

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextFalt
          label="Företagsnamn"
          name="företagsnamn"
          value={form.företagsnamn}
          onChange={hanteraTangentNer}
        />
        <TextFalt label="Adress" name="adress" value={form.adress} onChange={hanteraTangentNer} />
        <TextFalt
          label="Postnummer"
          name="postnummer"
          value={form.postnummer}
          onChange={hanteraTangentNer}
        />
        <TextFalt label="Stad" name="stad" value={form.stad} onChange={hanteraTangentNer} />
        <TextFalt
          label="Organisationsnummer"
          name="organisationsnummer"
          value={form.organisationsnummer}
          onChange={hanteraTangentNer}
        />
        <TextFalt
          label="Momsregistreringsnummer"
          name="momsregistreringsnummer"
          value={form.momsregistreringsnummer}
          onChange={hanteraTangentNer}
        />
        <TextFalt
          label="Telefonnummer"
          name="telefonnummer"
          value={form.telefonnummer}
          onChange={hanteraTangentNer}
        />
        <TextFalt label="E-post" name="epost" value={form.epost} onChange={hanteraTangentNer} />
        <TextFalt
          label="Webbplats"
          name="webbplats"
          value={form.webbplats}
          onChange={hanteraTangentNer}
        />
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 mb-6">
        <label className="font-semibold">Logotyp</label>
        <div className="flex items-center gap-4">
          <Knapp onClick={() => fileInputRef.current?.click()} text="Ladda upp logotyp" />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={hanteraLoggaUpload}
          />

          {form.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.logo}
              alt="Logotyp"
              style={{
                maxWidth: `${form.logoWidth}px`,
                maxHeight: "120px",
                objectFit: "contain",
                background: "#fff",
                borderRadius: 4,
                padding: 2,
              }}
            />
          )}
        </div>

        {form.logo && (
          <div className="flex flex-col gap-2">
            <label className="text-sm">Logo-storlek: {form.logoWidth}px</label>
            <input
              type="range"
              min="50"
              max="400"
              value={form.logoWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                setForm((prev) => ({ ...prev, logoWidth: newWidth }));
              }}
              className="w-64"
            />
          </div>
        )}

        {form.logo && <Knapp onClick={hanteraTaBortLogga} text="❌ Ta bort logotyp" />}
      </div>

      <Knapp onClick={hanteraSubmit} text="💾 Spara uppgifter" />

      {sparat && <p className="text-green-400 mt-4">✅ Uppgifterna sparades!</p>}
    </div>
  );
}

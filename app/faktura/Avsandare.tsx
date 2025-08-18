//#region Huvud
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import TextFalt from "../_components/TextFalt";
import { hämtaFöretagsprofil, sparaFöretagsprofil } from "./actions";
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
        if (data) setForm(data); // Inkluderar logoWidth från databas

        // Endast logo från localStorage (inte logoWidth)
        const logo = localStorage.getItem("company_logo");
        if (logo) setForm((prev) => ({ ...prev, logo }));
      }
    };
    ladda();
  }, [session]);
  //#endregion

  //#region Hanterare
  // Hantera ändringar i formuläret
  const hanteraTangentNer = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const hanteraLoggaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SÄKERHETSVALIDERING: Kontrollera filtyp
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Endast bildformat tillåtna (JPEG, PNG, GIF, WebP)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // SÄKERHETSVALIDERING: Kontrollera filstorlek (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("❌ Filen är för stor. Max 5MB tillåtet.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // SÄKERHETSVALIDERING: Kontrollera filnamn
    const filename = file.name;
    if (!/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      alert("❌ Ogiltigt filnamn. Använd bara bokstäver, siffror och punkt.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Skapa canvas för säker bildbehandling
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Sätt säkra max-gränser
      const maxWidth = 400;
      const maxHeight = 400;
      let { width, height } = img;

      // Validera bildstorlek
      if (width > 5000 || height > 5000) {
        alert("❌ Bilden är för stor. Max 5000x5000 pixlar.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Beräkna säker ny storlek
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Rita säkert komprimerad bild
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Konvertera till base64 med komprimering
      const compressedData = canvas.toDataURL("image/jpeg", 0.8); // 80% kvalitet

      setForm((prev) => ({ ...prev, logo: compressedData }));
      localStorage.setItem("company_logo", compressedData);
    };

    // Ladda bilden
    img.src = URL.createObjectURL(file);
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

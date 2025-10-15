"use client";

import Image from "next/image";
import TextFalt from "../../../_components/TextFalt";
import { getProxyImageUrl } from "../../../_utils/imageProxy";
import { useFaktura } from "../../hooks/useFaktura";
import Knapp from "../../../_components/Knapp";

export default function Avsandare() {
  const { formData, fileInputRef, hanteraTangentNer, hanteraLoggaUpload, sparaForetagsprofil } =
    useFaktura();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextFalt
          label="Företagsnamn"
          name="företagsnamn"
          value={formData.företagsnamn || ""}
          onChange={hanteraTangentNer}
          placeholder="Ange företagsnamn"
        />

        <TextFalt
          label="Organisationsnummer"
          name="organisationsnummer"
          value={formData.organisationsnummer || ""}
          onChange={hanteraTangentNer}
          placeholder="123456-7890"
        />

        <TextFalt
          label="Adress"
          name="adress"
          value={formData.adress || ""}
          onChange={hanteraTangentNer}
          placeholder="Gatunamn 123"
        />

        <TextFalt
          label="Postnummer"
          name="postnummer"
          value={formData.postnummer || ""}
          onChange={hanteraTangentNer}
          placeholder="12345"
        />

        <TextFalt
          label="Stad"
          name="stad"
          value={formData.stad || ""}
          onChange={hanteraTangentNer}
          placeholder="Stockholm"
        />

        <TextFalt
          label="Telefonnummer"
          name="telefonnummer"
          value={formData.telefonnummer || ""}
          onChange={hanteraTangentNer}
          placeholder="08-123 456 78"
        />

        <TextFalt
          label="E-post"
          name="epost"
          value={formData.epost || ""}
          onChange={hanteraTangentNer}
          placeholder="info@företag.se"
        />

        <TextFalt
          label="Webbplats"
          name="webbplats"
          value={formData.webbplats || ""}
          onChange={hanteraTangentNer}
          placeholder="www.företag.se"
        />

        <TextFalt
          label="Momsregistreringsnummer"
          name="momsregistreringsnummer"
          value={formData.momsregistreringsnummer || ""}
          onChange={hanteraTangentNer}
          placeholder="SE556123123401"
        />
      </div>

      {/* Logosektion */}
      <div className="mt-4 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Företagslogga</h3>
        <div className="flex items-center space-x-4">
          {formData.logo && (
            <div className="shrink-0">
              <Image
                src={getProxyImageUrl(formData.logo)}
                alt="Företagslogga"
                width={formData.logoWidth || 100}
                height={100}
                className="object-contain rounded"
                style={{ height: "auto", maxHeight: "100px" }}
                unoptimized
              />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={hanteraLoggaUpload}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
            <p className="text-sm text-gray-500 mt-1">PNG eller JPG. Max 3 MB.</p>
          </div>
        </div>
      </div>

      {/* Sparaknappar */}
      <div className="flex justify-end space-x-3 mt-6 pt-4">
        <Knapp text="Spara avsändare" onClick={sparaForetagsprofil} />
      </div>
    </>
  );
}

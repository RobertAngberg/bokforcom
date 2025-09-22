"use client";

import { useFaktura } from "../../../hooks/useFaktura";
import { useProdukterTjanster } from "../../../hooks/useProdukterTjanster";
import ArtikelForm from "./ArtikelForm";
import ArtiklarList from "./ArtiklarList";
import FavoritArtiklarList from "./FavoritArtiklarList";
import RotRutForm from "./RotRutForm";
import Knapp from "../../../../_components/Knapp";
import Modal from "../../../../_components/Modal";

export default function ProdukterTjanster() {
  const {
    // State från useFaktura
    formData,
    nyArtikel,
    produkterTjansterState,
    toastState,

    // Setters från useFaktura
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,

    // Handlers från useFaktura
    läggTillArtikel,
    updateFormField,
    clearToast,
  } = useFaktura();

  const {
    // ProdukterTjanster-specifika setters
    setVisaRotRutForm,
    setVisaArtikelForm,
    sparaArtikelSomFavorit,
  } = useProdukterTjanster();

  // Destructure nested state
  const {
    visaRotRutForm,
    visaArtikelForm,
    visaArtikelModal,
    redigerarIndex,
    favoritArtikelVald,
    artikelSparadSomFavorit,
    valtArtikel,
  } = produkterTjansterState;

  const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

  // Handler functions
  const handleAdd = () => {
    läggTillArtikel();
  };

  const handleToggleArtikelForm = () => {
    setVisaArtikelForm(!visaArtikelForm);
  };

  const handleSaveAsFavorite = () => {
    sparaArtikelSomFavorit();
  };

  const handleResetForm = () => {
    // TODO: Implement reset form functionality
    console.log("Reset form not implemented yet");
  };

  const handleCloseArtikelModal = () => {
    // TODO: Implement close artikel modal functionality
    console.log("Close artikel modal not implemented yet");
  };

  return (
    <div className="space-y-4">
      <FavoritArtiklarList />

      {/* ROT/RUT infobox - visas under favoriter men innan ny artikel */}
      {formData.rotRutAktiverat &&
        formData.artiklar &&
        formData.artiklar.length > 0 &&
        formData.artiklar.some((artikel: any) => artikel.rotRutTyp) && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white">
                  {formData.rotRutTyp || "ROT/RUT"} är aktiverat
                </h3>
                <div className="mt-1 text-sm text-slate-300">
                  <p>
                    Tjänster/arbete berättigar 50% avdrag. Lägg till eventuell materialkostnad som
                    en separat artikel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Knapp för att visa/dölja artikelformuläret */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        {/* Knapp som header */}
        <div className="border-b border-slate-600">
          {visaArtikelForm ? (
            <Knapp
              onClick={handleToggleArtikelForm}
              text="❌ Avsluta lägg till ny artikel"
              className="w-full rounded-none border-none"
            />
          ) : (
            <Knapp
              onClick={handleToggleArtikelForm}
              text="✚ Lägg till ny artikel"
              className="w-full rounded-none border-none"
            />
          )}
        </div>

        {/* Formulär som expanderar nedåt */}
        {visaArtikelForm && (
          <div className="p-4 space-y-4">
            <ArtikelForm
              beskrivning={beskrivning}
              antal={parseFloat(antal) || 0}
              prisPerEnhet={parseFloat(prisPerEnhet) || 0}
              moms={parseFloat(moms) || 0}
              typ={typ}
              onChangeBeskrivning={setBeskrivning}
              onChangeAntal={setAntal}
              onChangePrisPerEnhet={setPrisPerEnhet}
              onChangeMoms={setMoms}
              onChangeTyp={setTyp}
              disabled={favoritArtikelVald}
            />

            {/* ROT/RUT-knapp - alltid synlig men disabled för varor */}
            <div className="mb-4">
              <Knapp
                onClick={() => {
                  if (typ === "vara") {
                    clearToast();
                    // Visa error toast för vara + ROT/RUT
                    return;
                  }

                  const newValue = !visaRotRutForm;
                  setVisaRotRutForm(newValue);
                  if (newValue) {
                    setTyp("tjänst");
                    // Aktivera ROT/RUT i formData så att formuläret visas
                    updateFormField("rotRutAktiverat", true);
                  } else {
                    // Avaktivera ROT/RUT när formuläret stängs
                    updateFormField("rotRutAktiverat", false);
                  }
                }}
                text={
                  visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Lägg till ROT/RUT-avdrag"
                }
                disabled={typ === "vara"}
                className={typ === "vara" ? "opacity-50 cursor-not-allowed" : ""}
              />
            </div>

            {/* ROT/RUT formulär */}
            {visaRotRutForm && (
              <div className="border border-slate-500 rounded-lg mt-4">
                <RotRutForm showCheckbox={false} disabled={favoritArtikelVald} />
              </div>
            )}

            {/* Spara som favorit knapp */}
            <div className="mb-4">
              <Knapp
                onClick={handleSaveAsFavorite}
                text="📌 Lägg till som favoritartikel"
                disabled={
                  !beskrivning.trim() ||
                  !antal ||
                  !prisPerEnhet ||
                  Number(prisPerEnhet) <= 0 ||
                  favoritArtikelVald ||
                  artikelSparadSomFavorit
                }
              />
            </div>

            {/* Lägg till artikel knapp */}
            <div className="border-t border-slate-600 pt-4 flex justify-end">
              <Knapp
                onClick={handleAdd}
                text="✚ Lägg till artikel"
                disabled={!beskrivning.trim()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Visa "Lägg till artikel"-knapp när man redigerar */}
      {redigerarIndex !== null && (
        <div className="text-center">
          <Knapp onClick={handleResetForm} text="✚ Lägg till en till artikel" />
        </div>
      )}

      {/* Artikellista - visas längst ner */}
      <ArtiklarList />

      {/* Visa "Lägg till artikel"-knapp när favoritartikel är vald */}
      {favoritArtikelVald && (
        <div className="mb-4">
          <Knapp
            onClick={handleAdd}
            text="✚ Lägg till artikel"
            className="w-full bg-green-800 hover:bg-green-700"
          />
        </div>
      )}

      {/* Redigeringsformulär - visa när artikel redigeras OCH expandable form INTE visas */}
      {redigerarIndex !== null && !visaArtikelForm && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
            <h3 className="text-white font-medium">Redigera artikel {redigerarIndex + 1}</h3>
          </div>

          {/* Formulär innehåll för redigering */}
          <div className="p-4 space-y-4">
            <ArtikelForm
              beskrivning={beskrivning}
              antal={parseFloat(antal) || 0}
              prisPerEnhet={parseFloat(prisPerEnhet) || 0}
              moms={parseFloat(moms) || 0}
              typ={typ}
              onChangeBeskrivning={setBeskrivning}
              onChangeAntal={setAntal}
              onChangePrisPerEnhet={setPrisPerEnhet}
              onChangeMoms={setMoms}
              onChangeTyp={setTyp}
            />

            <div className="mb-4">
              <Knapp
                onClick={() => {
                  // Blockera ROT/RUT för varor
                  if (typ === "vara") {
                    return;
                  }

                  const newValue = !visaRotRutForm;
                  setVisaRotRutForm(newValue);
                  // Sätt automatiskt typ till "tjänst" när ROT/RUT aktiveras
                  if (newValue) {
                    setTyp("tjänst");
                  }
                }}
                text={
                  visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Aktivera ROT/RUT-avdrag"
                }
                disabled={typ === "vara" || redigerarIndex !== null}
                className={
                  typ === "vara" || redigerarIndex !== null ? "opacity-50 cursor-not-allowed" : ""
                }
              />
            </div>

            {/* Visa RotRutForm endast om användaren själv aktiverat det */}
            {visaRotRutForm && (
              <div className="border border-slate-500 rounded-lg mt-4">
                <RotRutForm showCheckbox={false} />
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-slate-600">
              <Knapp
                onClick={handleResetForm}
                text="❌ Avbryt redigering"
                className="bg-red-600 hover:bg-red-700"
              />
              <Knapp
                onClick={handleAdd}
                text="💾 Uppdatera artikel"
                disabled={!beskrivning.trim()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal för att visa artikeldetaljer */}
      <Modal
        isOpen={visaArtikelModal && !!valtArtikel}
        onClose={handleCloseArtikelModal}
        title="Artikeldetaljer"
      >
        {valtArtikel && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4 text-center">
              Detta är bara en översikt. Om du vill ändra något måste du skapa en ny artikel.
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Beskrivning</label>
                <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                  {valtArtikel.beskrivning}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Antal</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.antal}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Pris per enhet
                  </label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.prisPerEnhet} {valtArtikel.valuta}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Moms (%)</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.moms}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Typ</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.typ}
                  </div>
                </div>
              </div>

              {valtArtikel.rotRutTyp && (
                <>
                  <div className="border-t border-slate-600 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">ROT/RUT-avdrag</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Typ av avdrag
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutTyp}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Kategori
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {(valtArtikel as any).rotRutKategori || "Ej angiven"}
                      </div>
                    </div>
                  </div>

                  {(valtArtikel as any).rotRutBeskrivning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Beskrivning av arbetet
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {(valtArtikel as any).rotRutBeskrivning}
                      </div>
                    </div>
                  )}

                  {((valtArtikel as any).rotRutStartdatum ||
                    (valtArtikel as any).rotRutSlutdatum) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Startdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {(valtArtikel as any).rotRutStartdatum || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Slutdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {(valtArtikel as any).rotRutSlutdatum || "Ej angiven"}
                        </div>
                      </div>
                    </div>
                  )}

                  {(valtArtikel as any).rotRutPersonnummer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Personnummer
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {(valtArtikel as any).rotRutPersonnummer}
                      </div>
                    </div>
                  )}

                  {(valtArtikel as any).rotRutFastighetsbeteckning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Fastighetsbeteckning
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {(valtArtikel as any).rotRutFastighetsbeteckning}
                      </div>
                    </div>
                  )}

                  {((valtArtikel as any).rotRutBrfOrg ||
                    (valtArtikel as any).rotRutBrfLagenhet) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          BRF Organisationsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {(valtArtikel as any).rotRutBrfOrg || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Lägenhetsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {(valtArtikel as any).rotRutBrfLagenhet || "Ej angiven"}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Knapp onClick={handleCloseArtikelModal} text="Stäng" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

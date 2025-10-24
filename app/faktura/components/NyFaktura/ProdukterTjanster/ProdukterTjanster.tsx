"use client";
import { useFaktura } from "../../../hooks/useFaktura";
import { useProdukterTjanster } from "../../../hooks/useProdukterTjanster";
import ArtikelForm from "./ArtikelForm";
import ArtiklarList from "./ArtiklarList";
import FavoritArtiklarList from "./FavoritArtiklarList";
import RotRutForm from "./RotRutForm";
import Knapp from "../../../../_components/Knapp";
import Modal from "../../../../_components/Modal";
import AnimeradFlik from "../../../../_components/AnimeradFlik";
import { showToast } from "../../../../_components/Toast";
import { dateToYyyyMmDd } from "../../../../_utils/datum";

export default function ProdukterTjanster() {
  const {
    // State från useFaktura
    nyArtikel,
    produkterTjansterState,

    // Setters från useFaktura
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,

    // Handlers från useFaktura
    läggTillArtikel,
    avbrytRedigering,
    setVisaArtikelModal,
    setValtArtikel,
    updateFormField,
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

  const { beskrivning, antal, prisPerEnhet, moms, typ } = nyArtikel;

  const parsedAntal = Number(antal);
  const parsedPris = Number(prisPerEnhet);
  const parsedMoms = Number(moms);

  const addButtonDisabled =
    !beskrivning.trim() ||
    Number.isNaN(parsedAntal) ||
    Number.isNaN(parsedPris) ||
    Number.isNaN(parsedMoms) ||
    parsedAntal <= 0 ||
    parsedPris <= 0;

  // Handler functions
  const handleAdd = () => {
    läggTillArtikel();
  };

  const handleSaveAsFavorite = () => {
    sparaArtikelSomFavorit();
  };

  const handleResetForm = (openNewForm = false) => {
    avbrytRedigering();
    setVisaRotRutForm(false);
    if (openNewForm) {
      setVisaArtikelForm(true);
    }
  };

  const handleCloseArtikelModal = () => {
    setVisaArtikelModal(false);
    setValtArtikel(null);
  };

  return (
    <div className="space-y-4">
      {redigerarIndex === null && <FavoritArtiklarList />}

      {/* Knapp för att visa/dölja artikelformuläret */}
      {redigerarIndex === null && (
        <AnimeradFlik title="Lägg till ny artikel" icon="✚">
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
          <div className="mb-4 mt-4">
            <Knapp
              onClick={() => {
                if (typ === "vara") {
                  showToast("ROT/RUT-avdrag är endast tillåtet för tjänster, inte varor", "error");
                  return;
                }

                const newValue = !visaRotRutForm;
                setVisaRotRutForm(newValue);
                if (newValue) {
                  setTyp("tjänst");
                  setRotRutArbete(true);
                  setRotRutMaterial(false);
                  // Aktivera ROT/RUT i formData så att formuläret visas
                  updateFormField("rotRutAktiverat", true);
                } else {
                  // Avaktivera ROT/RUT när formuläret stängs
                  updateFormField("rotRutAktiverat", false);
                }
              }}
              text={visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Lägg till ROT/RUT-avdrag"}
              disabled={typ === "vara"}
              className={`w-full ${typ === "vara" ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>

          {/* ROT/RUT formulär */}
          {visaRotRutForm && (
            <div className="mt-4">
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
              className="w-full"
            />
          </div>

          {/* Lägg till artikel knapp */}
          <div className="mt-3 flex justify-end">
            <Knapp
              onClick={handleAdd}
              text="✚ Lägg till artikel"
              disabled={addButtonDisabled}
              className="w-full"
            />
          </div>
        </AnimeradFlik>
      )}

      {/* Artikellista - döljs under redigering */}
      {redigerarIndex === null && <ArtiklarList />}

      {/* Visa "Lägg till artikel"-knapp när favoritartikel är vald */}
      {favoritArtikelVald && redigerarIndex === null && (
        <div className="mb-4">
          <Knapp
            onClick={handleAdd}
            text="✚ Lägg till artikel"
            className="w-full bg-green-800 hover:bg-green-700"
            disabled={addButtonDisabled}
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

            {/* Skippa ROT/RUT-toggle-knapp i redigeringsläge */}

            {/* Visa RotRutForm endast om användaren själv aktiverat det */}
            {visaRotRutForm && (
              <div className="mt-4">
                <RotRutForm showCheckbox={false} />
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <Knapp onClick={() => handleResetForm()} text="❌ Avbryt redigering" />
              <Knapp onClick={handleAdd} text="💾 Uppdatera artikel" disabled={addButtonDisabled} />
            </div>
          </div>
        </div>
      )}

      {/* Modal för att visa artikeldetaljer */}
      <Modal
        isOpen={visaArtikelModal && !!valtArtikel}
        onClose={handleCloseArtikelModal}
        title="Artikeldetaljer"
        maxWidth="xl"
      >
        {valtArtikel && (
          <div className="space-y-4">
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
                    Pris per enhet exkl. moms
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
                        {valtArtikel.rotRutKategori || "Ej angiven"}
                      </div>
                    </div>
                  </div>

                  {valtArtikel.rotRutBeskrivning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Beskrivning av arbetet
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutBeskrivning}
                      </div>
                    </div>
                  )}

                  {(valtArtikel.rotRutStartdatum || valtArtikel.rotRutSlutdatum) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Startdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutStartdatum instanceof Date
                            ? dateToYyyyMmDd(valtArtikel.rotRutStartdatum)
                            : valtArtikel.rotRutStartdatum || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Slutdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutSlutdatum instanceof Date
                            ? dateToYyyyMmDd(valtArtikel.rotRutSlutdatum)
                            : valtArtikel.rotRutSlutdatum || "Ej angiven"}
                        </div>
                      </div>
                    </div>
                  )}

                  {valtArtikel.rotRutPersonnummer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Personnummer
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutPersonnummer}
                      </div>
                    </div>
                  )}

                  {valtArtikel.rotRutFastighetsbeteckning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Fastighetsbeteckning
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutFastighetsbeteckning}
                      </div>
                    </div>
                  )}

                  {(valtArtikel.rotRutBrfOrg || valtArtikel.rotRutBrfLagenhet) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          BRF Organisationsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutBrfOrg || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Lägenhetsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutBrfLagenhet || "Ej angiven"}
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

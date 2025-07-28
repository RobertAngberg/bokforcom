"use client";

import { useState } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";

// Exempeldata från Skatteverkets officiella exempel
export const skatteverketExempel = {
  // Exempel 1 - "vanliga" löntagare
  exempel1: {
    programnamn: "BokförCom AGI Generator",
    organisationsnummer: "556123456701", // Använd ditt eget organisationsnummer
    tekniskKontakt: {
      namn: "Valle Vadman",
      telefon: "23-2-4-244454",
      epost: "valle.vadman@dittforetag.se",
    },
    agRegistreradId: "165560269986",
    redovisningsperiod: "202501",
    summaArbAvgSlf: 26094,
    summaSkatteavdr: 25140,
    individuppgifter: [
      {
        specifikationsnummer: 1,
        betalningsmottagareId: "198202252386",
        arbetsplatsensGatuadress: "Arbetsgatan 31",
        arbetsplatsensOrt: "Jobbköping",
        kontantErsattningUlagAG: 28500,
        skatteplBilformanUlagAG: 2500,
        drivmVidBilformanUlagAG: 1200,
        betForDrivmVidBilformanUlagAG: 1000,
        avdrPrelSkatt: 9300,
      },
      {
        specifikationsnummer: 2,
        betalningsmottagareId: "198301302397",
        arbetsplatsensGatuadress: "Arbetsgatan 21",
        arbetsplatsensOrt: "Jobbköping",
        kontantErsattningUlagAG: 25350,
        avdrPrelSkatt: 7590,
        bilersattning: true,
      },
      {
        specifikationsnummer: 3,
        betalningsmottagareId: "198409102392",
        arbetsplatsensGatuadress: "Arbetsgatan 21",
        arbetsplatsensOrt: "Jobbstaden",
        kontantErsattningUlagAG: 26700,
        avdrPrelSkatt: 8250,
        traktamente: true,
      },
    ],
    franvarouppgifter: [],
  },

  // Exempel 2 - SINK-beslut (utländsk anställd)
  exempel2: {
    programnamn: "BokförCom AGI Generator",
    organisationsnummer: "556123456701",
    tekniskKontakt: {
      namn: "Ville Vessla",
      telefon: "23-2-4-244454",
      epost: "ville.vessla@dittforetag.se",
    },
    agRegistreradId: "165560269986",
    redovisningsperiod: "202501",
    individuppgifter: [
      {
        specifikationsnummer: 1,
        betalningsmottagareId: "197902802383",
        fornamn: "Per",
        efternamn: "Persson",
        gatuadress: "S.t Paris",
        postnummer: "12345",
        postort: "Paris",
        landskodPostort: "FR",
        landskodMedborgare: "FR",
        tin: "0009999999999",
        landskodTIN: "FR",
        arbetsplatsensGatuadress: "Arbetsgruvan",
        arbetsplatsensOrt: "Kiruna kommun",
        kontantErsattningUlagAG: 48100,
        avdrSkattSINK: 9620,
      },
    ],
    franvarouppgifter: [],
  },

  // Exempel 17 - Frånvarouppgifter (ny 2025-funktion)
  exempel17: {
    programnamn: "BokförCom AGI Generator",
    organisationsnummer: "556123456701",
    tekniskKontakt: {
      namn: "Valle Vadman",
      telefon: "23-2-4-244454",
      epost: "valle.vadman@dittforetag.se",
    },
    agRegistreradId: "165560269986",
    redovisningsperiod: "202507",
    individuppgifter: [],
    franvarouppgifter: [
      {
        specifikationsnummer: 1,
        betalningsmottagareId: "198202252386",
        franvaroDatum: "2025-06-12",
        franvaroTyp: "TILLFALLIG_FORALDRAPENNING" as const,
        franvaroProcentTFP: 12.5,
      },
      {
        specifikationsnummer: 2,
        betalningsmottagareId: "198301302397",
        franvaroDatum: "2025-06-12",
        franvaroTyp: "FORALDRAPENNING" as const,
        franvaroTimmarFP: 8,
      },
    ],
  },
};

export default function AGI_ExempelData() {
  const [selectedExample, setSelectedExample] = useState<keyof typeof skatteverketExempel | "">("");

  const handleLoadExample = (exampleKey: keyof typeof skatteverketExempel) => {
    const example = skatteverketExempel[exampleKey];

    // Trigger event för att uppdatera huvudkomponenten
    window.dispatchEvent(
      new CustomEvent("loadAGIExample", {
        detail: example,
      })
    );

    alert(`Exempel "${exampleKey}" har laddats!`);
  };

  return (
    <AnimeradFlik title="Exempeldata från Skatteverket" icon="📋" forcedOpen={false}>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            🎯 Officiella exempel från Skatteverket
          </h3>
          <p className="text-blue-800 text-sm">
            Dessa exempel är baserade på Skatteverkets officiella exempelfiler från dokumentationen
            "Bilaga Exempelfiler" version 1.1.17.1. Klicka på ett exempel för att ladda testdata.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Exempel 1 - Vanliga löntagare */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📝 Exempel 1: Vanliga löntagare</h4>
            <p className="text-sm text-gray-600 mb-3">
              Standard AGI med huvuduppgift och 3 individuppgifter. Inkluderar bilförmån,
              drivmedelsförmån, traktamente och bilersättning.
            </p>
            <ul className="text-xs text-gray-500 mb-3 space-y-1">
              <li>• Huvuduppgift (HU) med summor</li>
              <li>• 3 individuppgifter (IU)</li>
              <li>• Bilförmåner och traktamente</li>
              <li>• Preliminärskatteavdrag</li>
            </ul>
            <button
              onClick={() => handleLoadExample("exempel1")}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              Ladda exempel 1
            </button>
          </div>

          {/* Exempel 2 - SINK */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🌍 Exempel 2: SINK-beslut</h4>
            <p className="text-sm text-gray-600 mb-3">
              Utländsk anställd med SINK-beslut. Visar hur man hanterar namn, adress, medborgarskap
              och TIN-nummer för utländska betalningsmottagare.
            </p>
            <ul className="text-xs text-gray-500 mb-3 space-y-1">
              <li>• Fransk anställd</li>
              <li>• Fullständiga namnuppgifter</li>
              <li>• Adress i Frankrike</li>
              <li>• TIN-nummer</li>
            </ul>
            <button
              onClick={() => handleLoadExample("exempel2")}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              Ladda exempel 2
            </button>
          </div>

          {/* Exempel 17 - Frånvarouppgifter */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">👶 Exempel 17: Frånvarouppgifter</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ny 2025-funktion! Enbart frånvarouppgifter för föräldrapenning och tillfällig
              föräldrapenning utan individ- eller huvuduppgifter.
            </p>
            <ul className="text-xs text-gray-500 mb-3 space-y-1">
              <li>• Tillfällig föräldrapenning (TFP)</li>
              <li>• Föräldrapenning (FP)</li>
              <li>• Procent och timmar</li>
              <li>• Ny 2025-funktionalitet</li>
            </ul>
            <button
              onClick={() => handleLoadExample("exempel17")}
              className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
            >
              Ladda exempel 17
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Viktigt att veta</h3>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>• Ersätt alltid organisationsnummer med ditt eget</li>
            <li>• Kontrollera att personnummer är korrekta för dina anställda</li>
            <li>• Uppdatera redovisningsperiod till aktuell period</li>
            <li>• Verifiera alla belopp innan du skickar in</li>
            <li>• Testa med små belopp först</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📚 Alla 19 exempel från Skatteverket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <p className="font-medium mb-1">Grundläggande exempel:</p>
              <ul className="space-y-0.5 text-xs">
                <li>1. Vanliga löntagare</li>
                <li>2. SINK-beslut</li>
                <li>3. A-SINK beskattning</li>
                <li>4. Sociala ersättningar</li>
                <li>5. Utsändningsfall</li>
                <li>6. Sjöinkomst</li>
                <li>7. Flera typer av inkomster</li>
                <li>8. Flera redovisningsperioder</li>
                <li>9. Utan prefix (agd:)</li>
                <li>10. Borttagsmarkering</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Specialfall och 2025:</p>
              <ul className="space-y-0.5 text-xs">
                <li>11. Enbart huvuduppgift</li>
                <li>12. Utan kontaktperson</li>
                <li>13. Med födelsetid</li>
                <li>14. Avgiftspliktig ersättning</li>
                <li>15. Alla ålderskategorier</li>
                <li>16. Juridisk person</li>
                <li>17. Enbart frånvarouppgifter 🆕</li>
                <li>18. HU + IU + frånvarouppgifter 🆕</li>
                <li>19. Frånvaro med borttagning 🆕</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AnimeradFlik>
  );
}

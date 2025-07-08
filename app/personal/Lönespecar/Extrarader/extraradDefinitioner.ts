// beräknaTotalsummaAutomatiskt: true = antal × belopp per enhet (räkna ut totalsumman automatiskt)
// beräknaTotalsummaAutomatiskt: false = användaren matar in totalsumman direkt

import { beräknaKarensavdrag, beräknaDaglön, beräknaObetaldDag } from "../../löneberäkningar";

export interface RadKonfiguration {
  label: string;
  enhet: string;
  beräknaVärde?: (grundlön: number) => number;
  beräknaTotalt?: (grundlön: number, antal: number) => number;
  negativtBelopp?: boolean;
  skattepliktig?: boolean;
  läggTillINettolön?: boolean;
  läggTillIBruttolön?: boolean;
  fält: {
    antalLabel: string;
    antalPlaceholder: string;
    beloppPlaceholder?: string;
    step?: string;
    beräknaTotalsummaAutomatiskt?: boolean;
    enhetDropdown?: string[];
    skipKommentar?: boolean;
  };
}

export const RAD_KONFIGURATIONER: Record<string, RadKonfiguration> = {
  karensavdrag: {
    label: "Karensavdrag",
    enhet: "st",
    beräknaVärde: (grundlön) => beräknaKarensavdrag(grundlön),
    beräknaTotalt: (grundlön, antal) => beräknaKarensavdrag(grundlön) * antal,
    negativtBelopp: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "Vanligtvis 1",
      step: "1",
      beräknaTotalsummaAutomatiskt: true,
    },
  },

  obetaldaDagar: {
    label: "Obetalda dagar",
    enhet: "dagar",
    beräknaVärde: (grundlön) => beräknaObetaldDag(grundlön),
    beräknaTotalt: (grundlön, antal) => beräknaObetaldDag(grundlön) * antal,
    negativtBelopp: true,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  reduceradeDagar: {
    label: "Reducerade dagar",
    enhet: "dagar",
    beräknaVärde: (grundlön) => beräknaDaglön(grundlön) * 0.2,
    beräknaTotalt: (grundlön, antal) => beräknaDaglön(grundlön) * 0.2 * antal,
    negativtBelopp: true,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  vab: {
    label: "Vård av sjukt barn",
    enhet: "dagar",
    beräknaVärde: (grundlön) => beräknaDaglön(grundlön),
    beräknaTotalt: (grundlön, antal) => beräknaDaglön(grundlön) * antal,
    negativtBelopp: true,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  foraldraledighet: {
    label: "Föräldraledighet",
    enhet: "dagar",
    beräknaVärde: (grundlön) => beräknaDaglön(grundlön),
    beräknaTotalt: (grundlön, antal) => beräknaDaglön(grundlön) * antal,
    negativtBelopp: true,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  forsakring: {
    label: "Försäkring",
    enhet: "st",
    skattepliktig: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  ranteforman: {
    label: "Ränteförmån",
    enhet: "st",
    skattepliktig: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1", // (valfritt, men tydligare)
      beloppPlaceholder: "à SEK", // Lägg till denna rad
      step: "1",
      beräknaTotalsummaAutomatiskt: false, // Sätt till false!
    },
  },

  parkering: {
    label: "Parkering",
    enhet: "st",
    skattepliktig: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1", // (valfritt, men tydligare)
      beloppPlaceholder: "à SEK", // Lägg till denna rad
      step: "1",
      beräknaTotalsummaAutomatiskt: false, // Sätt till false!
    },
  },

  annanForman: {
    label: "Annan förmån",
    enhet: "st",
    skattepliktig: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1", // (valfritt, men tydligare)
      beloppPlaceholder: "à SEK", // Lägg till denna rad
      step: "1",
      beräknaTotalsummaAutomatiskt: false, // Sätt till false!
    },
  },

  gratisFrukost: {
    label: "Gratis frukost",
    enhet: "mål",
    skattepliktig: true,
    beräknaVärde: () => 61,
    beräknaTotalt: (grundlön, antal) => 61 * antal,
    fält: {
      antalLabel: "Antal mål",
      antalPlaceholder: "Ange antal mål",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  gratisLunchMiddag: {
    label: "Gratis lunch eller middag",
    enhet: "mål",
    skattepliktig: true,
    beräknaVärde: () => 122,
    beräknaTotalt: (grundlön, antal) => 122 * antal,
    fält: {
      antalLabel: "Antal mål",
      antalPlaceholder: "Ange antal mål",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  gratisMat: {
    label: "Gratis mat",
    enhet: "dagar",
    skattepliktig: true,
    beräknaVärde: () => 305,
    beräknaTotalt: (grundlön, antal) => 305 * antal,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  boende: {
    label: "Boende",
    enhet: "kvm",
    skattepliktig: true,
    beräknaVärde: () => 135,
    beräknaTotalt: (grundlön, antal) => 135 * antal,
    fält: {
      antalLabel: "Kvadratmeter",
      antalPlaceholder: "Ange antal kvm",
      step: "0.5",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  resersattning: {
    label: "Reseersättning",
    enhet: "st",
    skattepliktig: false,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  logi: {
    label: "Logi",
    enhet: "st",
    skattepliktig: false,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  uppehalleInrikes: {
    label: "Uppehälle, inrikes",
    enhet: "st",
    skattepliktig: false,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  uppehalleUtrikes: {
    label: "Uppehälle, utrikes",
    enhet: "st",
    skattepliktig: false,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  annanKompensation: {
    label: "Annan kompensation",
    enhet: "st",
    skattepliktig: false,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  privatBil: {
    label: "Privat bil",
    enhet: "km",
    skattepliktig: false,
    beräknaVärde: () => 2.5,
    beräknaTotalt: (grundlön, antal) => 2.5 * antal,
    fält: {
      antalLabel: "Kilometer",
      antalPlaceholder: "Ange antal kilometer",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  foretagsbilBensinDiesel: {
    label: "Företagsbil, bensin eller diesel",
    enhet: "km",
    skattepliktig: false,
    beräknaVärde: () => 1.2,
    beräknaTotalt: (grundlön, antal) => 1.2 * antal,
    fält: {
      antalLabel: "Kilometer",
      antalPlaceholder: "Ange antal kilometer",
      step: "0.1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  foretagsbilEl: {
    label: "Företagsbil, el",
    enhet: "km",
    skattepliktig: false,
    beräknaVärde: () => 0.95,
    beräknaTotalt: (grundlön, antal) => 0.95 * antal,
    fält: {
      antalLabel: "Kilometer",
      antalPlaceholder: "Ange antal kilometer",
      step: "0.1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  // Semestertillägg – kortfattat:

  // Vad: Ett extra tillägg (minst 0,43 % av månadslönen per semesterdag) som betalas ut när anställda tar semester.
  // Skatt: Semestertillägg är skattepliktigt och ska beskattas som vanlig lön.
  // Syfte: Ger extra pengar under semestern utöver ordinarie lön.

  // Så funkar det i koden:
  // I extrarad-konfigurationen har semestertillägg läggTillIBruttolön: true.
  // Vid löneberäkning summeras alla extrarader med denna flagga direkt till bruttolönen.
  // Skatt och sociala avgifter beräknas på bruttolönen inklusive semestertillägg.
  // Ingen hårdkodning – det styrs helt av flaggan i konfigurationen.

  semestertillagg: {
    label: "Semestertillägg",
    enhet: "dagar",
    skattepliktig: true,
    läggTillIBruttolön: true, // <-- NYTT!
    beräknaVärde: () => 150.5,
    beräknaTotalt: (grundlön, antal) => 150.5 * antal,
    fält: {
      antalLabel: "Antal dagar",
      antalPlaceholder: "Ange antal dagar",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  semesterskuld: {
    label: "Semesterskuld",
    enhet: "variabel",
    skattepliktig: true,
    läggTillIBruttolön: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false, // Visa alltid belopp manuellt
      enhetDropdown: ["Timme", "Dag", "St"],
    },
  },

  overtid: {
    label: "Övertid",
    enhet: "kr",
    skattepliktig: true,
    läggTillIBruttolön: true,
    fält: {
      antalLabel: "Summa",
      antalPlaceholder: "0",
      step: "0.01",
      beräknaTotalsummaAutomatiskt: false,
      skipKommentar: false,
    },
  },

  obTillagg: {
    label: "OB-tillägg",
    enhet: "kr",
    skattepliktig: true,
    läggTillIBruttolön: true,
    fält: {
      antalLabel: "Summa",
      antalPlaceholder: "0",
      step: "0.01",
      beräknaTotalsummaAutomatiskt: false,
      skipKommentar: false,
    },
  },

  risktillagg: {
    label: "Risktillägg",
    enhet: "kr",
    skattepliktig: true,
    läggTillIBruttolön: true,
    fält: {
      antalLabel: "Summa",
      antalPlaceholder: "0",
      step: "0.01",
      beräknaTotalsummaAutomatiskt: false,
      skipKommentar: false,
    },
  },

  obetaldFranvaro: {
    label: "Obetald frånvaro",
    enhet: "kr",
    negativtBelopp: true, // Detta gör att summan dras minus
    fält: {
      antalLabel: "Summa",
      antalPlaceholder: "0",
      step: "0.01",
      beräknaTotalsummaAutomatiskt: false,
      skipKommentar: false,
    },
  },

  foretagsbilExtra: {
    label: "Företagsbil",
    enhet: "st",
    skattepliktig: true,
    fält: {
      antalLabel: "",
      antalPlaceholder: "",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
    },
  },

  nettolönejustering: {
    label: "Nettolönejustering",
    enhet: "variabel",
    läggTillINettolön: true,
    fält: {
      antalLabel: "Antal",
      antalPlaceholder: "1",
      beloppPlaceholder: "à SEK",
      step: "1",
      beräknaTotalsummaAutomatiskt: false,
      enhetDropdown: ["Timme", "Dag", "St"],
    },
  },

  // Betald semester tas bort ur extraradlistan
  // betaldSemester: {
  //   label: "Betald semester",
  //   enhet: "dagar",
  //   skattepliktig: true,
  //   läggTillIBruttolön: true,
  //   beräknaVärde: (grundlön) => grundlön * 0.0043, // 0,43% per dag enligt semesterlagen
  //   beräknaTotalt: (grundlön, antal) => grundlön * 0.0043 * antal,
  //   fält: {
  //     antalLabel: "Antal dagar",
  //     antalPlaceholder: "Ange antal semesterdagar",
  //     step: "0.5",
  //     beräknaTotalsummaAutomatiskt: true,
  //   },
  // },
};

export type RadKonfigurationType = RadKonfiguration;

// Tom export för att säkerställa att filen behandlas som en modul
export {};

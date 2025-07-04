export interface BokföringsRegel {
  debet?: string;
  kredit?: string;
  namn: string;
  beskrivning?: string;
}

export const KONTO_MAPPNINGAR: Record<string, BokföringsRegel> = {
  // === LÖNER ===
  grundlön: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Grundlön och fast månadslön",
  },

  övertid: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Övertidsersättning",
  },

  obTillagg: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "OB-tillägg",
  },

  risktillagg: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Risktillägg",
  },

  semestertillagg: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Semestertillägg",
  },

  // === SOCIALA AVGIFTER ===
  socialaAvgifter: {
    debet: "7510",
    kredit: "2731",
    namn: "Lagstadgade sociala avgifter",
    beskrivning: "Arbetsgivaravgifter 31,42%",
  },

  // === SKATTER & AVGIFTER ===
  preliminärSkatt: {
    kredit: "2710",
    namn: "Personalskatt",
    beskrivning: "Preliminär A-skatt",
  },

  // === FÖRMÅNER ===
  bilförmån: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Bilförmån och bilersättning",
  },

  annanForman: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Övriga förmåner",
  },

  forsakring: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Försäkringsförmån",
  },

  parkering: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Parkeringsförmån",
  },

  // === MAT & BOENDE ===
  gratisFrukost: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Gratis frukost",
  },

  gratisLunchMiddag: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Gratis lunch/middag",
  },

  gratisMat: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Gratis mat",
  },

  boende: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Boendeförmån",
  },

  // === TRAKTAMENTEN ===
  resersattning: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Skattefri reseersättning",
  },

  logi: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Logi vid tjänsteresa",
  },

  uppehalleInrikes: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Uppehälle inrikes",
  },

  uppehalleUtrikes: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Uppehälle utrikes",
  },

  // === BILERSÄTTNING ===
  privatBil: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Milersättning privat bil",
  },

  foretagsbilBensinDiesel: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Företagsbil bensin/diesel",
  },

  foretagsbilEl: {
    debet: "7281",
    namn: "Reseersättningar",
    beskrivning: "Företagsbil el",
  },

  foretagsbilExtra: {
    debet: "7220",
    namn: "Förmåner till anställda",
    beskrivning: "Företagsbil förmån",
  },

  // === AVDRAG ===
  karensavdrag: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Karensavdrag sjukfrånvaro",
  },

  obetaldaDagar: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Obetalda dagar",
  },

  obetaldFranvaro: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Obetald frånvaro",
  },

  reduceradeDagar: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Reducerade dagar",
  },

  // === FÖRÄLDRALEDIGHET & VAB ===
  foraldraledighet: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Föräldraledighet",
  },

  vab: {
    kredit: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Vård av sjukt barn",
  },

  // === ÖVRIGA ===
  semesterskuld: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Semesterskuld",
  },

  nettolönejustering: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Nettolönejustering",
  },

  annanKompensation: {
    debet: "7210",
    namn: "Löner till tjänstemän",
    beskrivning: "Annan kompensation",
  },

  // === UTBETALNING ===
  nettolön: {
    kredit: "1930",
    namn: "Företagskonto / affärskonto",
    beskrivning: "Utbetalning nettolön",
  },
};

// HJÄLPFUNKTION: Hitta bokföringsregel baserat på extrarad-ID
export function hittaBokföringsregel(extraradId: string): BokföringsRegel | null {
  return KONTO_MAPPNINGAR[extraradId] || null;
}

// HJÄLPFUNKTION: Alla tillgängliga konton
export function getAllaKonton(): Array<{ konto: string; namn: string }> {
  const konton = new Set<string>();
  const kontoMap = new Map<string, string>();

  Object.values(KONTO_MAPPNINGAR).forEach((regel) => {
    if (regel.debet) {
      konton.add(regel.debet);
      kontoMap.set(regel.debet, regel.namn);
    }
    if (regel.kredit) {
      konton.add(regel.kredit);
      kontoMap.set(regel.kredit, regel.namn);
    }
  });

  return Array.from(konton)
    .sort()
    .map((konto) => ({ konto, namn: kontoMap.get(konto) || "" }));
}

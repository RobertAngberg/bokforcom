export interface RepresentationCalculationInput {
  totalAmount: number;
  numberOfPeople: number;
  foodAmountIncl?: number;
  alcoholAmountIncl?: number;
  maxDeductiblePerPerson?: number;
}

export type RepresentationCalculationMethod = "proportion" | "schablon";

export interface RepresentationCalculationResult {
  momsAvdrag: number;
  ejAvdragsgill: number;
  avdragsgillKostnad: number;
  underlagFörMoms: number;
  method: RepresentationCalculationMethod;
  proportionMoms: number;
  schablonMoms?: number;
}

const FOOD_VAT_RATE = 0.12;
const ALCOHOL_VAT_RATE = 0.25;
const DEFAULT_MAX_PER_PERSON = 300;
const SCHABLON_PER_PERSON = 46;

const roundToÖren = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const normalizeNumber = (value?: number): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
};

export function calculateRepresentation({
  totalAmount,
  numberOfPeople,
  foodAmountIncl,
  alcoholAmountIncl,
  maxDeductiblePerPerson = DEFAULT_MAX_PER_PERSON,
}: RepresentationCalculationInput): RepresentationCalculationResult {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return {
      momsAvdrag: 0,
      ejAvdragsgill: 0,
      avdragsgillKostnad: 0,
      underlagFörMoms: 0,
      method: "proportion",
      proportionMoms: 0,
    };
  }

  if (!Number.isFinite(numberOfPeople) || numberOfPeople <= 0) {
    return {
      momsAvdrag: 0,
      ejAvdragsgill: roundToÖren(totalAmount),
      avdragsgillKostnad: 0,
      underlagFörMoms: 0,
      method: "proportion",
      proportionMoms: 0,
    };
  }

  const sanitizedTotal = roundToÖren(Math.max(totalAmount, 0));

  const alcoholInput = normalizeNumber(alcoholAmountIncl) ?? 0;
  const totalAlcoholIncl = Math.min(Math.max(alcoholInput, 0), sanitizedTotal);

  const maxFoodPossible = Math.max(sanitizedTotal - totalAlcoholIncl, 0);
  const foodInput = normalizeNumber(foodAmountIncl);
  const totalFoodIncl = Math.min(
    foodInput !== undefined ? Math.max(foodInput, 0) : maxFoodPossible,
    maxFoodPossible
  );
  const totalUsed = roundToÖren(totalFoodIncl + totalAlcoholIncl);

  if (totalUsed <= 0) {
    return {
      momsAvdrag: 0,
      ejAvdragsgill: sanitizedTotal,
      avdragsgillKostnad: 0,
      underlagFörMoms: 0,
      method: "proportion",
      proportionMoms: 0,
    };
  }

  const foodExcludingVat = totalFoodIncl / (1 + FOOD_VAT_RATE);
  const alcoholExcludingVat = totalAlcoholIncl / (1 + ALCOHOL_VAT_RATE);
  const totalExcludingVat = foodExcludingVat + alcoholExcludingVat;

  if (totalExcludingVat <= 0) {
    return {
      momsAvdrag: 0,
      ejAvdragsgill: sanitizedTotal,
      avdragsgillKostnad: 0,
      underlagFörMoms: 0,
      method: "proportion",
      proportionMoms: 0,
    };
  }

  const maximaltUnderlag = numberOfPeople * maxDeductiblePerPerson;
  const ratio = Math.min(1, maximaltUnderlag / totalExcludingVat);
  const proportionUnderlag = roundToÖren(totalExcludingVat * ratio);
  const totalMomsBetald = roundToÖren(sanitizedTotal - totalExcludingVat);
  const momsAvdragProportion = roundToÖren(totalMomsBetald * ratio);

  const schablonTillgänglig =
    totalAlcoholIncl > 0 &&
    ratio < 1 &&
    numberOfPeople > 0 &&
    totalMomsBetald / numberOfPeople >= SCHABLON_PER_PERSON;

  const momsAvdragSchablon = schablonTillgänglig
    ? roundToÖren(Math.min(numberOfPeople * SCHABLON_PER_PERSON, totalMomsBetald))
    : undefined;

  const momsAvdrag = momsAvdragProportion;
  const avdragsgillKostnad = 0;
  const ejAvdragsgill = roundToÖren(sanitizedTotal - momsAvdrag - avdragsgillKostnad);

  return {
    momsAvdrag,
    ejAvdragsgill,
    avdragsgillKostnad,
    underlagFörMoms: proportionUnderlag,
    method: "proportion",
    proportionMoms: momsAvdragProportion,
    schablonMoms: momsAvdragSchablon,
  };
}

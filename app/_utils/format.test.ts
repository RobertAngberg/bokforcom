import {
  parseNumber,
  formatSEK,
  formatCurrency,
  formatAmount,
  round,
  parseNumberSafe,
} from "./format";

describe("Format utilities", () => {
  describe("parseNumber", () => {
    test("handles Swedish decimal comma", () => {
      expect(parseNumber("1,5")).toBe(1.5);
      expect(parseNumber("123,45")).toBe(123.45);
    });

    test("handles standard decimal point", () => {
      expect(parseNumber("1.5")).toBe(1.5);
      expect(parseNumber("123.45")).toBe(123.45);
    });

    test("handles empty and invalid strings", () => {
      expect(parseNumber("")).toBe(0);
      expect(parseNumber("abc")).toBe(0);
      expect(parseNumber("123abc")).toBe(123);
    });

    test("handles large numbers", () => {
      expect(parseNumber("1234,56")).toBe(1234.56);
      expect(parseNumber("1000000,99")).toBe(1000000.99);
    });
  });

  describe("parseNumberSafe", () => {
    test("handles null and undefined safely", () => {
      expect(parseNumberSafe(null)).toBe(0);
      expect(parseNumberSafe(undefined)).toBe(0);
      expect(parseNumberSafe("")).toBe(0);
    });

    test("converts various input types", () => {
      expect(parseNumberSafe("123,45")).toBe(123.45);
      expect(parseNumberSafe(123.45)).toBe(123.45);
      expect(parseNumberSafe("invalid")).toBe(0);
    });
  });

  describe("formatSEK", () => {
    test("formats integers without decimals", () => {
      expect(formatSEK(1234)).toMatch(/1[\s\u00A0]234/); // Handles both space types
      expect(formatSEK(0)).toBe("0");
      expect(formatSEK(999999)).toMatch(/999[\s\u00A0]999/);
    });

    test("rounds decimals away", () => {
      expect(formatSEK(1234.56)).toMatch(/1[\s\u00A0]235/); // Should round
      expect(formatSEK(1234.44)).toMatch(/1[\s\u00A0]234/); // Should round down
    });
  });

  describe("formatCurrency", () => {
    test("formats with kr suffix and decimals", () => {
      expect(formatCurrency(1234.56)).toMatch(/1[\s\u00A0]234,56[\s\u00A0]kr/);
      expect(formatCurrency(0)).toMatch(/0,00[\s\u00A0]kr/);
      expect(formatCurrency(999999.99)).toMatch(/999[\s\u00A0]999,99[\s\u00A0]kr/);
    });
  });

  describe("formatAmount", () => {
    test("formats Swedish style with decimals", () => {
      expect(formatAmount(1234.56)).toMatch(/1[\s\u00A0]234,56/);
      expect(formatAmount(0)).toBe("0,00");
    });

    test("handles NaN and null values", () => {
      expect(formatAmount(NaN)).toBe("0,00");
      expect(formatAmount(null as any)).toBe("0,00");
      expect(formatAmount(undefined as any)).toBe("0,00");
    });
  });

  describe("round", () => {
    test("rounds to 2 decimals correctly", () => {
      expect(round(1.234567)).toBe(1.23);
      expect(round(1.235)).toBe(1.24); // Should round up
      expect(round(1.999)).toBe(2.0);
    });

    test("handles edge cases", () => {
      expect(round(0)).toBe(0);
      expect(round(-1.235)).toBe(-1.23);
    });
  });

  // KRITISKT: Svenska momsberäkningar för bokföring!
  describe("VAT calculations (Swedish bookkeeping)", () => {
    test("calculates 25% VAT correctly", () => {
      const inclVAT = 1250; // Inkl moms
      const exclVAT = inclVAT / 1.25; // 1000
      const vat = inclVAT - exclVAT; // 250

      expect(round(exclVAT)).toBe(1000);
      expect(round(vat)).toBe(250);
    });

    test("calculates 12% VAT correctly", () => {
      const inclVAT = 1120; // Inkl moms
      const exclVAT = inclVAT / 1.12; // 1000
      const vat = inclVAT - exclVAT; // 120

      expect(round(exclVAT)).toBe(1000);
      expect(round(vat)).toBe(120);
    });

    test("calculates 6% VAT correctly", () => {
      const inclVAT = 1060; // Inkl moms
      const exclVAT = inclVAT / 1.06; // 1000
      const vat = inclVAT - exclVAT; // 60

      expect(round(exclVAT)).toBe(1000);
      expect(round(vat)).toBe(60);
    });

    // Hyrbil: endast 50% av momsen är avdragsgill
    test("calculates partial VAT deduction (Hyrbil case)", () => {
      const totalAmount = 1250;
      const fullVAT = (totalAmount / 1.25) * 0.25; // 250
      const deductibleVAT = fullVAT * 0.5; // 125 (50% avdragsgill)
      const cost = totalAmount - deductibleVAT; // 1125

      expect(round(fullVAT)).toBe(250);
      expect(round(deductibleVAT)).toBe(125);
      expect(round(cost)).toBe(1125);
    });
  });
});

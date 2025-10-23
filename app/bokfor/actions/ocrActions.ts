"use server";

import OpenAI from "openai";
import { ensureSession } from "../../_utils/session";
import { sanitizeInput } from "../../_utils/validationUtils";
import { trackEvent } from "../../analytics/actions";

function sanitizeOCRText(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Använd centraliserad sanitization med förstärkt längdbegränsning för OCR
  return sanitizeInput(text, 2000)
    .replace(/\s+/g, " ") // Normalisera whitespace
    .replace(/[{}]/g, ""); // Ta bort även klammerparenteser för OCR-säkerhet
}

export async function extractDataFromOCR(text: string) {
  await ensureSession(); // ✅ Auth check

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    // Sanitize input before sending to OpenAI
    const safeText = sanitizeOCRText(text);

    if (!safeText) {
      return { datum: "", belopp: 0 };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content:
            'Extract date and amount from OCR text. Respond with *raw* JSON only (no markdown, no triple backticks). Format: { "datum": "YYYY-MM-DD", "belopp": 1234.56 }.',
        },
        { role: "user", content: safeText },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);

      // Track OCR usage
      await trackEvent("ocr_used", {
        type: "basic",
        success: true,
      });

      return parsed;
    }

    await trackEvent("ocr_used", {
      type: "basic",
      success: false,
    });

    return { datum: "", belopp: 0 };
  } catch {
    console.error("extractDataFromOCR error"); // Mindre detaljerade loggar

    await trackEvent("ocr_used", {
      type: "basic",
      success: false,
    });

    return { datum: "", belopp: 0 };
  }
}

export async function extractDataFromOCRLevFakt(text: string) {
  await ensureSession(); // ✅ Auth check

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    // Sanitize input before sending to OpenAI
    const safeText = sanitizeOCRText(text);

    if (!safeText) {
      return {
        leverantör: "",
        fakturadatum: null,
        förfallodatum: null,
        fakturanummer: "",
        belopp: 0,
        betaldatum: null,
      };
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `Extract all relevant invoice data from OCR text. This is a supplier invoice (leverantörsfaktura). 
          
          Look for:
          - Supplier/company name (leverantör)
          - Invoice date (fakturadatum) 
          - Due date (förfallodatum)
          - Invoice number (fakturanummer)
          - Total amount (belopp)
          - Payment date if mentioned (betaldatum)
          
          Respond with *raw* JSON only (no markdown, no triple backticks). 
          Format: {
            "leverantör": "Company Name",
            "fakturadatum": "YYYY-MM-DD",
            "förfallodatum": "YYYY-MM-DD", 
            "fakturanummer": "12345",
            "belopp": 1234.56,
            "betaldatum": "YYYY-MM-DD"
          }
          
          If a field cannot be determined, use empty string "" for text fields, null for dates, or 0 for amount.`,
        },
        { role: "user", content: safeText },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);

      // Track OCR usage
      await trackEvent("ocr_used", {
        type: "supplier_invoice",
        success: true,
      });

      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);

    await trackEvent("ocr_used", {
      type: "supplier_invoice",
      success: false,
    });

    return {
      leverantör: "",
      fakturadatum: null,
      förfallodatum: null,
      fakturanummer: "",
      belopp: 0,
      betaldatum: null,
    };
  } catch (error) {
    console.error("❌ extractDataFromOCRLevFakt error:", error);

    await trackEvent("ocr_used", {
      type: "supplier_invoice",
      success: false,
    });

    return {
      leverantör: "",
      fakturadatum: null,
      förfallodatum: null,
      fakturanummer: "",
      belopp: 0,
      betaldatum: null,
    };
  }
}

export async function extractDataFromOCRKundfaktura(text: string) {
  await ensureSession(); // ✅ Auth check

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `Extract invoice data from OCR text. This is for creating a customer invoice (kundfaktura).
          
          IMPORTANT: Look specifically for:
          - Invoice date (fakturadatum) - the date when the invoice was issued
          - Due date (förfallodatum) - when payment is due 
          - Amount (belopp) - total invoice amount
          
          Do NOT confuse invoice date with payment date or transaction date.
          The invoice date is when the service/product was delivered or when the invoice was created.
          
          Respond with *raw* JSON only (no markdown, no triple backticks). 
          Format: {
            "fakturadatum": "YYYY-MM-DD",
            "förfallodatum": "YYYY-MM-DD", 
            "belopp": 1234.56
          }
          
          If a field cannot be determined, use null for dates or 0 for amount.`,
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);

      // Track OCR usage
      await trackEvent("ocr_used", {
        type: "customer_invoice",
        success: true,
      });

      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);

    await trackEvent("ocr_used", {
      type: "customer_invoice",
      success: false,
    });

    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  } catch (error) {
    console.error("❌ extractDataFromOCRKundfaktura error:", error);

    await trackEvent("ocr_used", {
      type: "customer_invoice",
      success: false,
    });

    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  }
}

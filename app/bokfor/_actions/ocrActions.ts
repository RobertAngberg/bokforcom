"use server";

import OpenAI from "openai";

function sanitizeOCRText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/[<>'"&{}]/g, "") // Ta bort potentiellt farliga tecken
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 2000); // Begränsa längd för API-anrop
}

export async function extractDataFromOCR(text: string) {
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
      return parsed;
    }

    return { datum: "", belopp: 0 };
  } catch (error) {
    console.error("extractDataFromOCR error"); // Mindre detaljerade loggar
    return { datum: "", belopp: 0 };
  }
}

export async function extractDataFromOCRLevFakt(text: string) {
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
      console.log("✅ Leverantörsfaktura OCR extracted:", parsed);
      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);
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
  console.log("🧠 Extracting kundfaktura data from OCR text:", text);

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
      console.log("✅ Kundfaktura OCR extracted:", parsed);
      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);
    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  } catch (error) {
    console.error("❌ extractDataFromOCRKundfaktura error:", error);
    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  }
}

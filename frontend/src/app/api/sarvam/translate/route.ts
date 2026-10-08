import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Map friendly language codes to Sarvam BCP-47 codes
const BCP47_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  or: "od-IN",
  od: "od-IN",
  bn: "bn-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  as: "as-IN",
  ur: "ur-IN",
  sa: "sa-IN",
  ks: "ks-IN",
  ne: "ne-IN",
  kok: "kok-IN",
  mai: "mai-IN",
  doi: "doi-IN",
  sd: "sd-IN",
  brx: "brx-IN",
  sat: "sat-IN",
  mni: "mni-IN",
};

// In-memory cache for fast repeated UI phrase translations
const translationCache = new Map<string, string>();

async function translateWithSarvam(
  text: string,
  targetCode: string,
  apiKey: string,
  sourceCode: string = "en-IN"
): Promise<string> {
  const cacheKey = `sarvam:${sourceCode}:${targetCode}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const response = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceCode,
      target_language_code: targetCode,
      speaker_gender: "Male",
      mode: "formal",
      model: "mayura:v1",
      enable_preprocessing: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam Translation error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const translated = data.translated_text || text;
  translationCache.set(cacheKey, translated);
  return translated;
}

// Fallback using Groq LLM if Sarvam AI key is pending/unconfigured
async function translateWithGroqFallback(
  texts: string[],
  targetCode: string,
  groqApiKey: string
): Promise<Record<string, string>> {
  const prompt = `You are a medical translator for an Indian healthcare system. Translate the following English UI phrases into the language with BCP-47 code "${targetCode}".
Return ONLY a valid JSON object mapping each original string to its translation, with no explanation or markdown formatting:
Phrases:
${JSON.stringify(texts)}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq fallback failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, texts, source_language_code, target_language_code } = body;

    const rawTarget = target_language_code || body.targetLanguage || "hi-IN";
    const targetCode = BCP47_MAP[rawTarget.toLowerCase()] || (rawTarget.includes("-") ? rawTarget : `${rawTarget}-IN`);

    const rawSource = source_language_code || body.sourceLanguage || "en-IN";
    const sourceCode = BCP47_MAP[rawSource.toLowerCase()] || (rawSource.includes("-") ? rawSource : "en-IN");

    // If source and target are the same language, no-op
    if (targetCode.toLowerCase().startsWith("en") && sourceCode.toLowerCase().startsWith("en")) {
      if (typeof input === "string") {
        return NextResponse.json({ success: true, translated_text: input, engine: "noop" });
      }
      const textList = Array.isArray(texts) ? texts : [];
      const map: Record<string, string> = {};
      textList.forEach((t: string) => (map[t] = t));
      return NextResponse.json({ success: true, translations: map, engine: "noop" });
    }

    const sarvamApiKey = process.env.SARVAM_API_KEY?.trim();
    const groqApiKey = process.env.GROQ_API_KEY?.trim();

    // Single string translation
    if (typeof input === "string" && input.trim()) {
      if (sarvamApiKey) {
        try {
          const translated = await translateWithSarvam(input, targetCode, sarvamApiKey, sourceCode);
          return NextResponse.json({ success: true, translated_text: translated, engine: "sarvam" });
        } catch (sarvamErr: any) {
          console.warn("Sarvam translation failed, attempting Groq fallback:", sarvamErr.message);
        }
      }

      if (groqApiKey) {
        try {
          const groqMap = await translateWithGroqFallback([input], targetCode, groqApiKey);
          const translated = groqMap[input] || input;
          return NextResponse.json({ success: true, translated_text: translated, engine: "groq-fallback" });
        } catch (groqErr: any) {
          console.warn("Groq fallback translation failed:", groqErr.message);
        }
      }

      return NextResponse.json({
        success: false,
        translated_text: input,
        error: "Translation service unavailable. Please check SARVAM_API_KEY in frontend/.env",
      });
    }

    // Batch string translation
    const textList: string[] = Array.isArray(texts) ? texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0) : [];
    if (textList.length === 0) {
      return NextResponse.json({ success: true, translations: {} });
    }

    const translations: Record<string, string> = {};
    const unCachedTexts: string[] = [];

    // Check cache first
    for (const text of textList) {
      const cacheKey = `sarvam:${sourceCode}:${targetCode}:${text}`;
      if (translationCache.has(cacheKey)) {
        translations[text] = translationCache.get(cacheKey)!;
      } else {
        unCachedTexts.push(text);
      }
    }

    if (unCachedTexts.length === 0) {
      return NextResponse.json({ success: true, translations, engine: "cache" });
    }

    if (sarvamApiKey) {
      try {
        // Concurrently translate chunks of uncached texts via Sarvam
        const CHUNK_SIZE = 5;
        for (let i = 0; i < unCachedTexts.length; i += CHUNK_SIZE) {
          const chunk = unCachedTexts.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunk.map(async (text) => {
              try {
                const res = await translateWithSarvam(text, targetCode, sarvamApiKey, sourceCode);
                translations[text] = res;
              } catch (e) {
                translations[text] = text;
              }
            })
          );
        }
        return NextResponse.json({ success: true, translations, engine: "sarvam" });
      } catch (sarvamErr: any) {
        console.warn("Sarvam batch translation failed, falling back to Groq:", sarvamErr.message);
      }
    }

    if (groqApiKey) {
      try {
        const groqMap = await translateWithGroqFallback(unCachedTexts, targetCode, groqApiKey);
        for (const t of unCachedTexts) {
          const res = groqMap[t] || t;
          translations[t] = res;
          translationCache.set(`sarvam:${sourceCode}:${targetCode}:${t}`, res);
        }
        return NextResponse.json({ success: true, translations, engine: "groq-fallback" });
      } catch (groqErr: any) {
        console.warn("Groq batch translation fallback failed:", groqErr.message);
      }
    }

    // Default return original texts
    for (const t of unCachedTexts) {
      translations[t] = t;
    }
    return NextResponse.json({
      success: true,
      translations,
      note: "Original texts returned. Add SARVAM_API_KEY to frontend/.env for live Sarvam AI translation.",
    });
  } catch (err: any) {
    console.error("Translation route handler exception:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process translation" },
      { status: 500 }
    );
  }
}

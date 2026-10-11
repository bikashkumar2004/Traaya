import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Map friendly language names or codes to Sarvam BCP-47 codes
const VALID_SARVAM_CODES = new Set([
  "unknown", "en-IN", "hi-IN", "bn-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN",
  "ta-IN", "te-IN", "gu-IN", "as-IN", "ur-IN", "ne-IN", "kok-IN", "ks-IN", "sd-IN",
  "sa-IN", "sat-IN", "mni-IN", "brx-IN", "mai-IN", "doi-IN"
]);

const LANGUAGE_CODE_MAP: Record<string, string> = {
  // English
  en: "en-IN",
  "en-in": "en-IN",
  english: "en-IN",

  // Hindi
  hi: "hi-IN",
  "hi-in": "hi-IN",
  hindi: "hi-IN",

  // Odia (ISO code 'or' maps to Sarvam's 'od-IN')
  or: "od-IN",
  "or-in": "od-IN",
  od: "od-IN",
  "od-in": "od-IN",
  odia: "od-IN",
  oriya: "od-IN",

  // Bengali
  bn: "bn-IN",
  "bn-in": "bn-IN",
  bengali: "bn-IN",
  bangla: "bn-IN",

  // Telugu
  te: "te-IN",
  "te-in": "te-IN",
  telugu: "te-IN",

  // Tamil
  ta: "ta-IN",
  "ta-in": "ta-IN",
  tamil: "ta-IN",

  // Marathi
  mr: "mr-IN",
  "mr-in": "mr-IN",
  marathi: "mr-IN",

  // Gujarati
  gu: "gu-IN",
  "gu-in": "gu-IN",
  gujarati: "gu-IN",

  // Kannada
  kn: "kn-IN",
  "kn-in": "kn-IN",
  kannada: "kn-IN",

  // Malayalam
  ml: "ml-IN",
  "ml-in": "ml-IN",
  malayalam: "ml-IN",

  // Punjabi
  pa: "pa-IN",
  "pa-in": "pa-IN",
  punjabi: "pa-IN",

  // Assamese
  as: "as-IN",
  "as-in": "as-IN",
  assamese: "as-IN",

  // Urdu
  ur: "ur-IN",
  "ur-in": "ur-IN",
  urdu: "ur-IN",

  // Sanskrit
  sa: "sa-IN",
  "sa-in": "sa-IN",
  sanskrit: "sa-IN",

  // Kashmiri
  ks: "ks-IN",
  "ks-in": "ks-IN",
  kashmiri: "ks-IN",

  // Nepali
  ne: "ne-IN",
  "ne-in": "ne-IN",
  nepali: "ne-IN",

  // Konkani
  kok: "kok-IN",
  "kok-in": "kok-IN",
  konkani: "kok-IN",

  // Maithili
  mai: "mai-IN",
  "mai-in": "mai-IN",
  maithili: "mai-IN",

  // Dogri
  doi: "doi-IN",
  "doi-in": "doi-IN",
  dogri: "doi-IN",

  // Sindhi
  sd: "sd-IN",
  "sd-in": "sd-IN",
  sindhi: "sd-IN",

  // Bodo
  brx: "brx-IN",
  "brx-in": "brx-IN",
  bodo: "brx-IN",

  // Santali
  sat: "sat-IN",
  "sat-in": "sat-IN",
  santali: "sat-IN",

  // Manipuri
  mni: "mni-IN",
  "mni-in": "mni-IN",
  manipuri: "mni-IN",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;
    const rawLanguage = (formData.get("language_code") as string) || (formData.get("language") as string) || "unknown";

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in request" },
        { status: 400 }
      );
    }

    const sarvamApiKey = process.env.SARVAM_API_KEY?.trim();
    if (!sarvamApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SARVAM_API_KEY is not set in environment. Please add your Sarvam AI API key to frontend/.env",
          fallbackRequired: true,
        },
        { status: 401 }
      );
    }

    // Resolve valid BCP-47 language code for Sarvam AI
    const normalizedKey = rawLanguage.toLowerCase().trim();
    let resolvedLanguageCode = LANGUAGE_CODE_MAP[normalizedKey];

    if (!resolvedLanguageCode) {
      // Check if it's already a valid Sarvam code
      const upperKey = rawLanguage.trim();
      if (VALID_SARVAM_CODES.has(upperKey)) {
        resolvedLanguageCode = upperKey;
      } else {
        // Fall back to auto-detect if code is unknown or unmapped
        resolvedLanguageCode = "unknown";
      }
    }

    // Build multipart payload for Sarvam API
    const fileName = (audioFile as File).name || "audio.wav";
    const primaryModel = "saaras:v3";

    const makeSarvamRequest = async (modelName: string, langCode?: string) => {
      const payload = new FormData();
      payload.append("file", audioFile, fileName);
      payload.append("model", modelName);
      payload.append("mode", "transcribe");
      if (langCode && langCode !== "unknown") {
        payload.append("language_code", langCode);
      }
      return fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamApiKey,
        },
        body: payload,
      });
    };

    let response = await makeSarvamRequest(primaryModel, resolvedLanguageCode);

    // If specific language code caused an issue (or returned 400), retry with auto-detection ('unknown')
    if (!response.ok && resolvedLanguageCode !== "unknown") {
      console.warn(`Sarvam STT failed with language ${resolvedLanguageCode} (${response.status}), retrying with auto-detect...`);
      const autoDetectResponse = await makeSarvamRequest(primaryModel, undefined);
      if (autoDetectResponse.ok) {
        response = autoDetectResponse;
      }
    }

    // Fallback to saaras:v4 if primary model returns error
    if (!response.ok && response.status >= 400) {
      console.warn(`Sarvam STT model ${primaryModel} failed (${response.status}), trying saaras:v4 fallback...`);
      const fallbackResponse = await makeSarvamRequest("saaras:v4", resolvedLanguageCode !== "unknown" ? resolvedLanguageCode : undefined);
      if (fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sarvam AI STT error:", response.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Sarvam AI STT error (${response.status}): ${errText}`,
          fallbackRequired: true,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      transcript: data.transcript || "",
      language_code: data.language_code || resolvedLanguageCode,
    });
  } catch (err: any) {
    console.error("Speech-to-text API handler exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error during speech transcription",
        fallbackRequired: true,
      },
      { status: 500 }
    );
  }
}

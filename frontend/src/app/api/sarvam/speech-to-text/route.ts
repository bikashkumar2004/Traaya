import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Map friendly language names or codes to Sarvam BCP-47 codes
const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en-IN",
  english: "en-IN",
  hi: "hi-IN",
  hindi: "hi-IN",
  or: "od-IN",
  od: "od-IN",
  odia: "od-IN",
  bn: "bn-IN",
  bengali: "bn-IN",
  te: "te-IN",
  telugu: "te-IN",
  ta: "ta-IN",
  tamil: "ta-IN",
  mr: "mr-IN",
  marathi: "mr-IN",
  gu: "gu-IN",
  gujarati: "gu-IN",
  kn: "kn-IN",
  kannada: "kn-IN",
  ml: "ml-IN",
  malayalam: "ml-IN",
  pa: "pa-IN",
  punjabi: "pa-IN",
  as: "as-IN",
  assamese: "as-IN",
  ur: "ur-IN",
  urdu: "ur-IN",
  sa: "sa-IN",
  sanskrit: "sa-IN",
  ks: "ks-IN",
  kashmiri: "ks-IN",
  ne: "ne-IN",
  nepali: "ne-IN",
  kok: "kok-IN",
  konkani: "kok-IN",
  mai: "mai-IN",
  maithili: "mai-IN",
  doi: "doi-IN",
  dogri: "doi-IN",
  sd: "sd-IN",
  sindhi: "sd-IN",
  brx: "brx-IN",
  bodo: "brx-IN",
  sat: "sat-IN",
  santali: "sat-IN",
  mni: "mni-IN",
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

    // Resolve BCP-47 language code
    const normalizedKey = rawLanguage.toLowerCase().trim();
    const languageCode = LANGUAGE_CODE_MAP[normalizedKey] || (rawLanguage.includes("-") ? rawLanguage : "unknown");

    // Build multipart payload for Sarvam API
    const outgoingFormData = new FormData();
    const fileName = (audioFile as File).name || "audio.wav";
    outgoingFormData.append("file", audioFile, fileName);
    outgoingFormData.append("model", "saaras:v2");
    if (languageCode && languageCode !== "unknown") {
      outgoingFormData.append("language_code", languageCode);
    }

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": sarvamApiKey,
      },
      body: outgoingFormData,
    });

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
      language_code: data.language_code || languageCode,
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

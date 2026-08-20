import { callSarvamJson } from "../brain/providers/sarvam-client"

export interface TranslationResult {
  translated_text: string
  source_language_detected: string
  confidence: number
}

const translationSchema = {
  name: "translation_output",
  schema: {
    type: "object",
    properties: {
      translated_text: { type: "string", description: "Standardized English translation of the technical statement" },
      source_language_detected: { type: "string", description: "ISO language code of input (e.g., hi, te, ta, en)" },
      confidence: { type: "number" }
    },
    required: ["translated_text", "source_language_detected", "confidence"],
    additionalProperties: false
  }
}

export async function detectLanguage(text: string): Promise<string> {
  // Simple heuristic for non-ASCII Indian language scripts before calling API
  const isIndic = /[\u0900-\u0D7F]/.test(text)
  if (isIndic) {
    if (/[\u0900-\u097F]/.test(text)) return "hi" // Devanagari / Hindi
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta" // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return "te" // Telugu
    if (/[\u0C80-\u0CFF]/.test(text)) return "kn" // Kannada
  }
  return "en"
}

export async function translateEntry(
  text: string,
  targetLang: string = "en"
): Promise<TranslationResult> {
  const detected = await detectLanguage(text)
  if (detected === "en" && targetLang === "en") {
    return {
      translated_text: text,
      source_language_detected: "en",
      confidence: 1.0
    }
  }

  const prompt = `Translate this engineering knowledge entry into canonical English for global AI agent consumption while preserving technical terms (APIs, SQL, variables, functions):

Input text: "${text}"
Source Language: ${detected}
Target Language: ${targetLang}`

  const result = await callSarvamJson<TranslationResult>(
    [
      {
        role: "system",
        content: "You are the Sarvam Multilingual Normalizer for AgentHelm. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    translationSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  if (!result || !result.translated_text) {
    return {
      translated_text: text,
      source_language_detected: detected,
      confidence: 0.5
    }
  }

  return result
}

import { logger } from "@/lib/observability";

export interface SarvamTextResult {
  text: string;
  tokens: number;
}

/**
 * Single LLM entry point for the whole product.
 *
 * AgentHelm uses ONLY Sarvam (SARVAM_API_KEY) for any generative task.
 * This replaces the old Gemini/NVIDIA callers that were removed.
 *
 * Returns null on any error/timeout so callers can fall back gracefully
 * (deterministic message, queued reply, etc.).
 */
export async function callSarvamText(
  prompt: string,
  opts: { system?: string; fast?: boolean; maxTokens?: number; timeoutMs?: number } = {}
): Promise<SarvamTextResult | null> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    logger.warn("SARVAM_API_KEY is not set. Skipping generative call.");
    return null;
  }

  const timeoutMs = opts.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const messages = [
    ...(opts.system
      ? [{ role: "system" as const, content: opts.system }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      logger.warn(`Sarvam API error (status ${response.status}): ${errText}.`);
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const tokens = data?.usage?.total_tokens ?? 0;
    return { text, tokens };
  } catch (err: any) {
    logger.warn(
      `Sarvam text call failed: ${err?.name === "AbortError" ? "timeout" : err?.message || String(err)}.`
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

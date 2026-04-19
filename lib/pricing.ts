/**
 * Unified token cost pricing table for AgentHelm.
 * Used by both /api/sdk/log and /api/sdk/output routes.
 * Single source of truth for per-token cost calculations.
 */

export function getCostPerToken(model: string | null): number {
  if (!model) return 0
  const m = model.toLowerCase()

  // Google Gemini
  if (m.includes('gemini-2.0-flash-lite'))  return 0.0000000375
  if (m.includes('gemini-2.0-flash'))        return 0.0000001
  if (m.includes('gemini-1.5-flash-8b'))     return 0.0000000375
  if (m.includes('gemini-1.5-flash'))        return 0.000000075
  if (m.includes('gemini-1.5-pro'))          return 0.0000035
  if (m.includes('gemini'))                  return 0.0000001

  // OpenAI
  if (m.includes('gpt-4o-mini'))             return 0.00000015
  if (m.includes('gpt-4o'))                  return 0.000005
  if (m.includes('gpt-4'))                   return 0.00003
  if (m.includes('gpt-3.5'))                 return 0.0000005

  // Anthropic Claude
  if (m.includes('claude-3-5-sonnet'))       return 0.000003
  if (m.includes('claude-3-5-haiku'))        return 0.0000008
  if (m.includes('sonnet'))                  return 0.000015
  if (m.includes('haiku'))                   return 0.00000025
  if (m.includes('opus'))                    return 0.000015

  // NVIDIA NIM / Meta Llama
  if (m.includes('llama-3.1-8b'))            return 0.0000002
  if (m.includes('llama-3.1-70b'))           return 0.00000095
  if (m.includes('llama-3.3-70b'))           return 0.00000095
  if (m.includes('llama-3.1-405b'))          return 0.000005
  if (m.includes('llama'))                   return 0.0000002

  // Mistral
  if (m.includes('mistral-7b'))              return 0.0000002
  if (m.includes('mixtral'))                 return 0.0000006
  if (m.includes('mistral'))                 return 0.0000002

  // Moonshot Kimi
  if (m.includes('kimi-k2'))                 return 0.000002
  if (m.includes('kimi'))                    return 0.000002

  // Default
  return 0.000001
}

/**
 * Validate that a token count is a safe positive integer.
 */
export function validateTokenCount(tokens: number): boolean {
  return Number.isInteger(tokens) && tokens > 0
}

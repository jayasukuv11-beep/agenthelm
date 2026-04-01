type UpstashConfig = { url: string; token: string }
export function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
}
export async function upstashRest(cmdPath: string): Promise<any | null> {
  const cfg = getUpstashConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/${cmdPath}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.token}` },
    })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}
/**
 * Tries to acquire a lock using Upstash SET NX EX command.
 * If UPSTASH_REDIS_REST_URL is not set, this defaults to `failOpen`.
 * If failOpen is false (default), it will block (return false) if Redis is unavailable.
 * If failOpen is true, it will proceed (return true) if Redis is unavailable.
 */
export async function acquireLock(
  key: string,
  ttlSeconds: number,
  failOpen: boolean = false
): Promise<boolean> {
  const cfg = getUpstashConfig()
  if (!cfg) return failOpen // If no redis, either block all requests or allow all
  try {
    const res = await upstashRest(`set/${encodeURIComponent(key)}/1/NX/EX/${ttlSeconds}`)
    return res?.result === 'OK'
  } catch {
    return failOpen
  }
}

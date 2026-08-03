import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolves a project by UUID or Name (case-insensitive).
 * Avoids Postgres syntax errors when looking up non-UUID string names.
 */
export async function resolveProject(supabase: SupabaseClient, projectInput: string) {
  if (!projectInput || typeof projectInput !== 'string') {
    return { data: null, error: 'Project input is required' }
  }

  const trimmed = projectInput.trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)

  if (isUuid) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', trimmed)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return { data: null, error: error?.message || 'Project not found' }
    }
    return { data, error: null }
  }

  // Look up by name (case-insensitive)
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', trimmed)
    .limit(1)
    .maybeSingle()

  if (data) {
    return { data, error: null }
  }

  // Fallback to exact match
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('projects')
    .select('*')
    .eq('name', trimmed)
    .limit(1)
    .maybeSingle()

  if (fallbackData) {
    return { data: fallbackData, error: null }
  }

  return { data: null, error: fallbackError?.message || 'Project not found' }
}

'use server'

import { createClient } from '@/app/lib/supabase'
import { revalidatePath } from 'next/cache'

/**
 * Permanently deletes a project and all related records (brain versions,
 * brain entries, knowledge proposals, timeline events, etc.) via Postgres
 * ON DELETE CASCADE. Agents linked to the project get project_id set to NULL.
 *
 * Requires the authenticated user to own the project (enforced by RLS + explicit check).
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  if (!projectId || typeof projectId !== 'string') {
    return { success: false, error: 'Invalid project ID' }
  }

  const supabase = await createClient()

  // 1. Verify current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized — you must be logged in.' }
  }

  // 2. Verify ownership explicitly before delete (defense-in-depth beyond RLS)
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id, name')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    return { success: false, error: 'Project not found.' }
  }

  if (project.user_id !== user.id) {
    return { success: false, error: 'You do not own this project.' }
  }

  // 3. Delete the project — cascades remove all related brain_versions,
  //    brain_entries, knowledge_proposals, ai_timeline_events, etc.
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id) // Belt-and-suspenders: ensure RLS + explicit user check

  if (deleteError) {
    console.error('Project deletion failed:', deleteError)
    return { success: false, error: `Deletion failed: ${deleteError.message}` }
  }

  // 4. Revalidate dashboard pages so UI reflects the change immediately
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Creates a new project for the authenticated user and initializes its brain.
 */
export async function createProject(data: {
  name: string
  description?: string
  repo_url?: string
}): Promise<{ success: boolean; project?: any; error?: string }> {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: 'Project name is required' }
  }

  const supabase = await createClient()

  // 1. Verify current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized — you must be logged in.' }
  }

  // 2. Insert project record
  const { data: project, error: createError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      repo_url: data.repo_url?.trim() || null,
      brain_version: 0,
    })
    .select()
    .single()

  if (createError) {
    console.error('Project creation failed:', createError)
    return { success: false, error: `Creation failed: ${createError.message}` }
  }

  // 3. Create initial brain version snapshot (version 1)
  const { error: versionError } = await supabase
    .from('brain_versions')
    .insert({
      project_id: project.id,
      version: 1,
      evolution_reason: 'Project initialized',
      files_changed_count: 0,
      apis_changed_count: 0,
    })

  if (versionError) {
    console.error('Initial brain version creation warning:', versionError)
  }

  // 4. Revalidate dashboard pages
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')

  return { success: true, project }
}


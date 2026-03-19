import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function validateServiceKey(request: NextRequest): boolean {
  const key = request.headers.get('x-service-key')
  return key === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function POST(request: NextRequest) {
  if (!validateServiceKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { agent_id, results } = body

  if (!agent_id || !Array.isArray(results)) {
    return NextResponse.json(
      { error: 'agent_id and results[] are required' },
      { status: 400 }
    )
  }

  type InstalledSkillRelation =
    | { name?: string | null }
    | Array<{ name?: string | null }>
    | null

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  // Update each agent_skill status
  for (const result of results) {
    const { assignment_id, status, error: installError } = result
    const validStatuses = ['installed', 'failed', 'removed', 'uninstall_failed']
    if (!assignment_id || !validStatuses.includes(status)) continue

    const updates: Record<string, unknown> = {
      status,
      last_attempted_at: now,
    }
    if (status === 'installed') {
      updates.installed_at = now
      updates.last_error = null
    }
    if (status === 'failed' || status === 'uninstall_failed') {
      updates.last_error = installError || 'Unknown error'
    }
    if (status === 'removed') {
      updates.installed_at = null
      updates.last_error = null
    }

    await supabase
      .from('agent_skills')
      .update(updates)
      .eq('id', assignment_id)
  }

  // v1.5.1: Build skills snapshot from installed skills only
  const { data: installedSkills } = await supabase
    .from('agent_skills')
    .select('skills (name)')
    .eq('agent_id', agent_id)
    .eq('status', 'installed')
    .eq('desired_state', 'present')

  const skillNames = (installedSkills ?? [])
    .flatMap((assignment: { skills?: InstalledSkillRelation }) => {
      if (Array.isArray(assignment.skills)) {
        return assignment.skills
          .map((skill) => skill?.name?.trim())
          .filter((name): name is string => Boolean(name))
      }

      const name = assignment.skills?.name?.trim()
      return name ? [name] : []
    })

  // v1.5.1: Check FULL convergence — desired_state must match status for ALL skills
  // Only clear soul_dirty if every skill has converged
  const { data: allAgentSkills } = await supabase
    .from('agent_skills')
    .select('desired_state, status')
    .eq('agent_id', agent_id)

  const converged = (allAgentSkills ?? []).every((as: { desired_state: string; status: string }) => {
    if (as.desired_state === 'present') return as.status === 'installed'
    if (as.desired_state === 'absent') return as.status === 'removed'
    return false
  })

  const agentUpdates: Record<string, unknown> = {
    skills: skillNames,
  }
  if (converged) {
    agentUpdates.soul_dirty = false
  }

  await supabase
    .from('agents')
    .update(agentUpdates)
    .eq('agent_id', agent_id)

  // Clean up fully removed rows (desired_state=absent, status=removed)
  // v1.5.3: Also check if any skills now have zero assignments and can be hard deleted
  const deletedSkillIds: string[] = []
  if (converged) {
    // Get skill_ids of removed assignments before deleting them
    const { data: removedAssignments } = await supabase
      .from('agent_skills')
      .select('skill_id')
      .eq('agent_id', agent_id)
      .eq('desired_state', 'absent')
      .eq('status', 'removed')

    const affectedSkillIds = [...new Set((removedAssignments ?? []).map(a => a.skill_id))]

    // Delete the removed assignment rows
    await supabase
      .from('agent_skills')
      .delete()
      .eq('agent_id', agent_id)
      .eq('desired_state', 'absent')
      .eq('status', 'removed')

    // Check if any affected skills now have zero remaining assignments
    for (const skillId of affectedSkillIds) {
      const { count } = await supabase
        .from('agent_skills')
        .select('id', { count: 'exact', head: true })
        .eq('skill_id', skillId)

      if (count === 0) {
        // No agents use this skill anymore — safe to hard delete
        await supabase.from('skills').delete().eq('id', skillId)
        deletedSkillIds.push(skillId)
      }
    }
  }

  return NextResponse.json({
    agent_id,
    skills_snapshot: skillNames,
    converged,
    soul_dirty_cleared: converged,
    results_processed: results.length,
    skills_deleted: deletedSkillIds,
  })
}

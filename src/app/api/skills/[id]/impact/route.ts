import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  // Get skill info
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('id, name, icon')
    .eq('id', id)
    .single()

  if (skillError || !skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  }

  // Get all agents with this skill assigned
  const { data: assignments } = await supabase
    .from('agent_skills')
    .select(`
      id,
      agent_id,
      status,
      desired_state,
      installed_at
    `)
    .eq('skill_id', id)

  const agents = assignments ?? []
  const installedCount = agents.filter(a => a.status === 'installed').length
  const pendingCount = agents.filter(a => a.status === 'pending' || a.status === 'installing').length
  const canDelete = agents.length === 0

  return NextResponse.json({
    skill_id: id,
    skill_name: skill.name,
    skill_icon: skill.icon,
    affected_agents: agents.map(a => ({
      agent_id: a.agent_id,
      status: a.status,
      desired_state: a.desired_state,
    })),
    summary: {
      total: agents.length,
      installed: installedCount,
      pending: pendingCount,
      can_delete_immediately: canDelete,
    },
  })
}

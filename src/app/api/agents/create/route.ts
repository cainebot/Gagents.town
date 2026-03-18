import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase'
import type { AgentRole, AgentBadge } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const VALID_ROLES: AgentRole[] = ['lead', 'specialist', 'intern']

function roleToBadge(role: AgentRole): AgentBadge {
  switch (role) {
    case 'lead': return 'LEAD'
    case 'specialist': return 'SPC'
    case 'intern': return 'INT'
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate required fields
  const { agent_id, name, node_id, role } = body

  if (!agent_id || typeof agent_id !== 'string' || agent_id.trim() === '') {
    return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
  }

  // agent_id must be alphanumeric + hyphens, no spaces
  if (!/^[a-zA-Z0-9-]+$/.test(agent_id)) {
    return NextResponse.json({ error: 'agent_id must be alphanumeric with hyphens only (no spaces)' }, { status: 400 })
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (name.trim().length > 50) {
    return NextResponse.json({ error: 'name must be 1-50 characters' }, { status: 400 })
  }

  if (!node_id || typeof node_id !== 'string' || node_id.trim() === '') {
    return NextResponse.json({ error: 'node_id is required' }, { status: 400 })
  }

  if (!role || !VALID_ROLES.includes(role as AgentRole)) {
    return NextResponse.json({ error: `role is required and must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
  }

  // Validate node exists
  const readClient = createServerClient()
  const { data: node, error: nodeError } = await readClient
    .from('nodes')
    .select('node_id, status')
    .eq('node_id', node_id)
    .single()

  if (nodeError || !node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 400 })
  }

  // Generate and hash API key
  const apiKey = crypto.randomUUID()
  const apiKeyHash = await hash(apiKey, 10)

  const badge = roleToBadge(role as AgentRole)
  const emoji = (body.emoji as string) || agent_id.charAt(0).toUpperCase()

  const supabase = createServiceRoleClient()

  const { data: agent, error: insertError } = await supabase
    .from('agents')
    .insert({
      agent_id: agent_id.trim(),
      node_id: node_id.trim(),
      name: name.trim(),
      emoji,
      status: 'offline',
      department_id: (body.department_id as string) || null,
      role: role as AgentRole,
      badge,
      skills: (body.skills as string[]) || [],
      about: (body.about as string) || null,
      soul_config: (body.soul_config as Record<string, unknown>) || {},
      soul_dirty: true,
      api_key_hash: apiKeyHash,
      metadata: {
        avatar_type: (body.avatar_type as string) || 'emoji',
        avatar_bg_color: (body.avatar_bg_color as string) || '#475569',
      },
    })
    .select('*')
    .single()

  if (insertError) {
    // 23505 = unique_violation (duplicate primary key / unique constraint)
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Agent ID already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const response: Record<string, unknown> = { ...agent, api_key: apiKey }

  // Warn if node is offline, but still allow creation per spec A-001
  if (node.status === 'offline') {
    response.warning = 'Node is currently offline'
  }

  return NextResponse.json(response, { status: 201 })
}

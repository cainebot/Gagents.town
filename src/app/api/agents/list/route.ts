import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/agents/list — lightweight list of all agents (for dropdowns)
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('agents')
    .select('agent_id, name, emoji, status, role, badge, about, skills')
    .order('name')

  if (error) {
    return NextResponse.json([], { status: 200 }) // graceful fallback
  }

  return NextResponse.json(data)
}

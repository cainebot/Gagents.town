import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/nodes/list — returns all nodes for workspace/node dropdown
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('nodes')
    .select('node_id, status, agent_count, ram_usage_mb, ram_total_mb, last_heartbeat')
    .order('node_id')

  if (error) {
    return NextResponse.json([], { status: 200 }) // graceful fallback
  }

  return NextResponse.json(data)
}

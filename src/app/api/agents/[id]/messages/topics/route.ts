import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  // Fetch all messages for this agent (sent or received), grouped by topic with unread count
  const { data: allMessages, error } = await supabase
    .from('agent_messages')
    .select('topic, read_at')
    .or(`recipient_agent_id.eq.${id},and(sender_type.eq.agent,sender_id.eq.${id})`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by topic and count unreads
  const topicMap = new Map<string, { name: string; unread_count: number }>()

  // Always include 'general' as the baseline topic
  topicMap.set('general', { name: 'general', unread_count: 0 })

  for (const row of allMessages ?? []) {
    const existing = topicMap.get(row.topic)
    if (existing) {
      if (!row.read_at) existing.unread_count++
    } else {
      topicMap.set(row.topic, { name: row.topic, unread_count: row.read_at ? 0 : 1 })
    }
  }

  const topics = Array.from(topicMap.values()).sort((a, b) => {
    if (a.name === 'general') return -1
    if (b.name === 'general') return 1
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json({ topics })
}

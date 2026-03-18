import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import type { AgentMessageRow } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'general'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  const supabase = createServerClient()

  let query = supabase
    .from('agent_messages')
    .select('*')
    .or(`recipient_agent_id.eq.${id},and(sender_type.eq.agent,sender_id.eq.${id})`)
    .eq('topic', topic)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    // Fetch cursor's created_at for keyset pagination
    const { data: cursorRow } = await supabase
      .from('agent_messages')
      .select('created_at')
      .eq('message_id', cursor)
      .single()

    if (cursorRow) {
      query = query.lt('created_at', cursorRow.created_at)
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const messages = (data as AgentMessageRow[]) ?? []
  const next_cursor = messages.length === limit ? messages[messages.length - 1].message_id : null

  return NextResponse.json({ data: messages, next_cursor })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const topic = body.topic || 'general'
  const sender_type = body.sender_type || 'user'
  const sender_id = body.sender_id || 'joan'
  const channel = body.channel || 'web'

  // Parse @mentions from message text
  const mentionRegex = /@(\w+)/g
  const mentionUsernames: string[] = []
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    mentionUsernames.push(match[1])
  }

  let mentions: Array<{ agent_id: string; username: string }> = []
  if (mentionUsernames.length > 0) {
    const supabaseRead = createServerClient()
    const { data: agents } = await supabaseRead
      .from('agents')
      .select('agent_id, name')
      .in('name', mentionUsernames)

    if (agents) {
      mentions = agents.map((a: { agent_id: string; name: string }) => ({
        agent_id: a.agent_id,
        username: a.name,
      }))
    }
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      sender_type,
      sender_id,
      recipient_agent_id: id,
      topic,
      text,
      channel,
      mentions,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

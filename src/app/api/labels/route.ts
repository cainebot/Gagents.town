import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/labels — distinct labels used across all cards (for autocomplete)
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('cards')
    .select('labels')
    .not('labels', 'eq', '[]')

  if (error) {
    return NextResponse.json([], { status: 200 })
  }

  // Extract unique labels from all cards
  const labelSet = new Set<string>()
  for (const row of data ?? []) {
    const labels = row.labels as string[] | null
    if (Array.isArray(labels)) {
      labels.forEach((l: string) => labelSet.add(l))
    }
  }

  return NextResponse.json([...labelSet].sort())
}

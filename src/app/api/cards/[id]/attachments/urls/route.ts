import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/cards/[id]/attachments/urls — generate signed URLs for a list of storage paths
// Body: { paths: Record<string, string> }  →  { attachment_id: storage_path }
// Returns: Record<string, string>  →  { attachment_id: signedUrl }
export async function POST(request: NextRequest, { params }: RouteParams) {
  await params // consume params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const paths = body.paths as Record<string, string> | undefined
  if (!paths || typeof paths !== 'object') {
    return NextResponse.json(
      { message: 'paths is required (object: { attachment_id: storage_path })' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()
  const result: Record<string, string> = {}

  const entries = Object.entries(paths)
  // Generate all signed URLs in parallel
  const promises = entries.map(async ([attId, storagePath]) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .createSignedUrl(storagePath, 3600)
      if (data?.signedUrl && !error) {
        result[attId] = data.signedUrl
      }
    } catch {
      // Skip broken paths
    }
  })

  await Promise.all(promises)

  return NextResponse.json(result)
}

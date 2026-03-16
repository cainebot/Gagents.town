import { NextRequest, NextResponse } from 'next/server'
import { getBoards, createBoard } from '@/lib/boards'

function errorResponse(
  status: number,
  message: string,
  details?: string,
  hint?: string,
  code?: string
) {
  return NextResponse.json({ message, details, hint, code }, { status })
}

// GET /api/boards — return all boards, optionally filtered by workflow_id
// Query: ?workflow_id=<uuid>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workflowId = searchParams.get('workflow_id') ?? undefined

  try {
    const boards = await getBoards(workflowId)
    return NextResponse.json(boards)
  } catch (err) {
    const e = err as Error & { code?: string; details?: string; hint?: string }
    return errorResponse(500, e.message, e.details, e.hint, e.code)
  }
}

// POST /api/boards — create a new board
// Body: { name: string, workflow_id: string, description?: string, card_type_filter?: CardType, state_filter?: string[] }
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'Invalid JSON body')
  }

  const { name, workflow_id, description, card_type_filter, state_filter } = body as {
    name?: string
    workflow_id?: string
    description?: string
    card_type_filter?: string
    state_filter?: string[]
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return errorResponse(400, 'name is required', undefined, undefined, 'VALIDATION_ERROR')
  }

  if (!workflow_id || typeof workflow_id !== 'string' || !workflow_id.trim()) {
    return errorResponse(400, 'workflow_id is required', undefined, undefined, 'VALIDATION_ERROR')
  }

  try {
    const board = await createBoard({
      name: name.trim(),
      workflow_id: workflow_id.trim(),
      ...(description ? { description } : {}),
      ...(card_type_filter ? { card_type_filter: card_type_filter as import('@/types/workflow').CardType } : {}),
      ...(state_filter ? { state_filter } : {}),
    })
    return NextResponse.json(board, { status: 201 })
  } catch (err) {
    const e = err as Error & { code?: string; details?: string; hint?: string }
    return errorResponse(500, e.message, e.details, e.hint, e.code)
  }
}

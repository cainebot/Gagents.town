import { NextRequest, NextResponse } from 'next/server'
import { getWorkflows, createWorkflow } from '@/lib/workflows'

function err(status: number, message: string) {
  return NextResponse.json({ message }, { status })
}

// GET /api/board-groups — list all board groups (workflows)
export async function GET() {
  try {
    const workflows = await getWorkflows()
    return NextResponse.json(workflows)
  } catch (e) {
    const error = e as Error
    return err(500, error.message)
  }
}

// POST /api/board-groups — create a new board group
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err(400, 'Invalid JSON body')
  }

  const { name, description } = body as { name?: string; description?: string }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return err(400, 'name is required')
  }

  try {
    const workflow = await createWorkflow({ name: name.trim(), description: description?.trim() || undefined })
    return NextResponse.json(workflow, { status: 201 })
  } catch (e) {
    const error = e as Error
    return err(500, error.message)
  }
}

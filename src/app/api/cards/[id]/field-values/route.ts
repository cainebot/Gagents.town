import { NextRequest, NextResponse } from 'next/server'
import { getCardFieldValues, upsertCardFieldValues } from '@/lib/custom-fields'

type RouteParams = { params: Promise<{ id: string }> }

function errorResponse(
  status: number,
  message: string,
  details?: string,
  hint?: string,
  code?: string
) {
  return NextResponse.json({ message, details, hint, code }, { status })
}

// GET /api/cards/[id]/field-values — return all custom field values for a card
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const values = await getCardFieldValues(id)
    return NextResponse.json(values)
  } catch (err) {
    const e = err as Error & { code?: string; details?: string; hint?: string }
    return errorResponse(500, e.message, e.details, e.hint, e.code)
  }
}

// PATCH /api/cards/[id]/field-values — upsert custom field values for a card
// Body: { values: { field_id: string, value: unknown }[] }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'Invalid JSON body')
  }

  const { values } = body as { values?: unknown }

  if (!Array.isArray(values)) {
    return errorResponse(400, 'values must be an array', undefined, undefined, 'VALIDATION_ERROR')
  }

  // Validate each entry
  for (const item of values) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Record<string, unknown>).field_id !== 'string' ||
      (item as Record<string, unknown>).value === undefined
    ) {
      return errorResponse(
        400,
        'Each value entry must have a field_id (string) and a value',
        undefined,
        undefined,
        'VALIDATION_ERROR'
      )
    }
  }

  try {
    const updated = await upsertCardFieldValues(
      id,
      values as { field_id: string; value: unknown }[]
    )
    return NextResponse.json(updated)
  } catch (err) {
    const e = err as Error & { code?: string; details?: string; hint?: string }
    return errorResponse(500, e.message, e.details, e.hint, e.code)
  }
}

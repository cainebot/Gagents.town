import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import type {
  WorkflowRow,
  WorkflowStateRow,
  WorkflowWithStates,
} from '@/types/workflow'

// ---- Workflow reads (server client) ----

export async function getWorkflows(): Promise<WorkflowRow[]> {
  const client = createServerClient()
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .order('name')

  if (error) throw error
  return data as WorkflowRow[]
}

export async function getWorkflow(id: string): Promise<WorkflowWithStates> {
  const client = createServerClient()

  const { data: workflow, error: wErr } = await client
    .from('workflows')
    .select('*')
    .eq('workflow_id', id)
    .single()

  if (wErr) throw wErr

  const states = await getWorkflowStates(id)

  return { ...(workflow as WorkflowRow), states }
}

export async function getWorkflowStates(
  workflowId: string
): Promise<WorkflowStateRow[]> {
  const client = createServerClient()
  const { data, error } = await client
    .from('workflow_states')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('position')

  if (error) throw error
  return data as WorkflowStateRow[]
}

// ---- Workflow writes (service role client) ----

export async function createWorkflow(
  data: Pick<WorkflowRow, 'name'> & Partial<Pick<WorkflowRow, 'description'>>
): Promise<WorkflowRow> {
  const client = createServiceRoleClient()
  const { data: row, error } = await client
    .from('workflows')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return row as WorkflowRow
}

export async function updateWorkflow(
  id: string,
  data: Partial<Pick<WorkflowRow, 'name' | 'description'>>
): Promise<WorkflowRow> {
  const client = createServiceRoleClient()
  const { data: row, error } = await client
    .from('workflows')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('workflow_id', id)
    .select()
    .single()

  if (error) throw error
  return row as WorkflowRow
}

export async function deleteWorkflow(id: string): Promise<void> {
  const client = createServiceRoleClient()
  const { error } = await client
    .from('workflows')
    .delete()
    .eq('workflow_id', id)

  if (error) throw error
}

// ---- State writes (service role client) ----

export async function createState(
  workflowId: string,
  data: Pick<WorkflowStateRow, 'name' | 'category' | 'color' | 'position'>
): Promise<WorkflowStateRow> {
  const client = createServiceRoleClient()
  const { data: row, error } = await client
    .from('workflow_states')
    .insert({ ...data, workflow_id: workflowId })
    .select()
    .single()

  if (error) throw error
  return row as WorkflowStateRow
}

export async function updateState(
  stateId: string,
  data: Partial<Pick<WorkflowStateRow, 'name' | 'category' | 'color' | 'position'>>
): Promise<WorkflowStateRow> {
  const client = createServiceRoleClient()
  const { data: row, error } = await client
    .from('workflow_states')
    .update(data)
    .eq('state_id', stateId)
    .select()
    .single()

  if (error) throw error
  return row as WorkflowStateRow
}

export async function deleteState(stateId: string): Promise<void> {
  const client = createServiceRoleClient()
  const { error } = await client
    .from('workflow_states')
    .delete()
    .eq('state_id', stateId)

  if (error) throw error
}

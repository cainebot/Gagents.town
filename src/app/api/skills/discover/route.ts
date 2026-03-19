import { NextRequest, NextResponse } from 'next/server'
import type { DiscoveredSkill } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const CLAWHUB_BASE = 'https://clawhub.ai'

interface ClawHubResult {
  score: number;
  slug?: string;
  displayName?: string;
  summary?: string | null;
  version?: string;
  updatedAt?: number;
}

interface ClawHubSearchResponse {
  results?: ClawHubResult[];
}

async function searchClawHub(query: string): Promise<DiscoveredSkill[] | null> {
  try {
    const url = `${CLAWHUB_BASE}/api/v1/skills/?q=${encodeURIComponent(query)}&limit=12&nonSuspicious=true`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'openclaw-office/1.0' },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data: ClawHubSearchResponse = await res.json()
    return (data.results ?? []).map((r) => ({
      slug: r.slug ?? '',
      displayName: r.displayName ?? r.slug ?? 'Unknown',
      summary: r.summary ?? null,
      version: r.version ?? null,
      updatedAt: r.updatedAt ?? 0,
      source: 'clawhub' as const,
    }))
  } catch {
    return null
  }
}

async function searchGitHubTree(query: string): Promise<DiscoveredSkill[]> {
  try {
    const token = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'openclaw-office/1.0',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(
      'https://api.github.com/repos/openclaw/skills/git/trees/main?recursive=1',
      { headers, next: { revalidate: 300 } },
    )
    if (!res.ok) return []

    const data = await res.json()
    const lowerQuery = query.toLowerCase()
    return ((data.tree ?? []) as Array<{ path: string; type: string }>)
      .filter(
        (item) =>
          item.type === 'blob' &&
          item.path.endsWith('.md') &&
          item.path.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 12)
      .map((item) => {
        const parts = item.path.replace('.md', '').split('/')
        const slug = parts.slice(0, 2).join('/')
        return {
          slug,
          displayName: parts[parts.length - 1].replace(/-/g, ' '),
          summary: null,
          version: null,
          updatedAt: 0,
          source: 'github_tree' as const,
        }
      })
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  // Try ClawHub first
  const clawhubResults = await searchClawHub(q)
  if (clawhubResults !== null) {
    return NextResponse.json({ results: clawhubResults })
  }

  // Fallback to GitHub tree
  console.warn('[discover] ClawHub unavailable — using GitHub tree fallback')
  const fallbackResults = await searchGitHubTree(q)
  return NextResponse.json({ results: fallbackResults })
}

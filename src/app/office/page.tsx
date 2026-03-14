'use client'

import { RealtimeProvider } from '@/components/RealtimeProvider'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Phaser (accesses window)
const PhaserGame = dynamic(
  () => import('@/components/Office2D/PhaserGame').then(mod => ({ default: mod.default })),
  { ssr: false, loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-primary)' }}>Loading office...</div> }
)

export default function OfficePage() {
  return (
    <RealtimeProvider>
      <div style={{ width: '100%', height: 'calc(100vh - 80px)', position: 'relative' }}>
        <PhaserGame />
      </div>
    </RealtimeProvider>
  )
}

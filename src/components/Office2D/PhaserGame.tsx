'use client'

/**
 * React wrapper component that creates and destroys a Phaser.Game instance.
 *
 * - Dynamically imports Phaser to avoid SSR breakage (Phaser accesses `window`)
 * - Bridges Supabase Realtime data into the Phaser scene via EventBridge
 * - Uses ResizeObserver for container-responsive canvas sizing
 * - Cleans up WebGL context on unmount
 */

import { useEffect, useRef } from 'react'
import { useRealtimeStatus } from '@/components/RealtimeProvider'
import { eventBridge } from './EventBridge'

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const { agents, nodes, connectionStatus } = useRealtimeStatus()

  // Push Supabase Realtime data into EventBridge whenever it changes
  useEffect(() => {
    eventBridge.emit('agents-updated', agents)
  }, [agents])

  useEffect(() => {
    eventBridge.emit('nodes-updated', nodes)
  }, [nodes])

  useEffect(() => {
    eventBridge.emit('connection-status', connectionStatus)
  }, [connectionStatus])

  // Create and destroy Phaser game
  useEffect(() => {
    if (!containerRef.current) return

    let game: Phaser.Game | null = null
    let resizeObserver: ResizeObserver | null = null
    let destroyed = false

    async function initGame() {
      // Dynamic import — Phaser accesses `window` at module level
      const Phaser = await import('phaser')
      const { OfficeScene } = await import('./scenes/OfficeScene')

      if (destroyed || !containerRef.current) return

      const container = containerRef.current
      const { clientWidth: width, clientHeight: height } = container

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width,
        height,
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        // Don't auto-start scenes — we need to set registry BEFORE scene.create()
        scene: [],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.NO_CENTER,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
          },
        },
      })

      gameRef.current = game

      // Expose for debugging (dev only)
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).__PHASER_GAME__ = game
      }

      // Pass EventBridge to the scene via registry BEFORE scene starts
      game.registry.set('eventBridge', eventBridge)

      // Now add and start the scene (bridge is available in create())
      game.scene.add('OfficeScene', OfficeScene, true)

      // Responsive resize
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          if (w > 0 && h > 0 && game) {
            game.scale.resize(w, h)
          }
        }
      })
      resizeObserver.observe(container)
    }

    initGame()

    return () => {
      destroyed = true
      resizeObserver?.disconnect()
      if (game) {
        game.destroy(true)
        gameRef.current = null
      }
      eventBridge.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

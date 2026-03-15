/**
 * ZoneManager — draws colored department zone rectangles in the Phaser OfficeScene
 * and provides zone-aware agent placement via grid packing.
 *
 * Depth layering:
 *   - Graphics (fill + border): depth 1 — above floor/wall layers (depth 0), below workers (depth 4+)
 *   - Labels: depth 2
 */

import * as Phaser from 'phaser'
import type { DepartmentRow } from '@/types/supabase'

export interface ZoneBounds {
  x: number
  y: number
  width: number
  height: number
  departmentId: string
}

export class ZoneManager {
  private scene: Phaser.Scene
  private graphics: Phaser.GameObjects.Graphics
  private labels: Phaser.GameObjects.Text[] = []
  zones: ZoneBounds[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(1)
  }

  /**
   * Redraws all zone rectangles. Called on 'departments-updated'.
   * Divides tilemap width equally by department count, sorted by sort_order.
   * The last zone absorbs any rounding remainder to avoid edge gaps (Pitfall 3).
   */
  updateZones(departments: DepartmentRow[], mapWidth: number, mapHeight: number): void {
    this.graphics.clear()
    this.labels.forEach((l) => l.destroy())
    this.labels = []
    this.zones = []

    const sorted = [...departments].sort((a, b) => a.sort_order - b.sort_order)
    if (sorted.length === 0) return

    const zoneWidth = Math.floor(mapWidth / sorted.length)

    sorted.forEach((dept, index) => {
      const x = index * zoneWidth
      const y = 0
      // Last zone absorbs any rounding remainder
      const w = index === sorted.length - 1 ? mapWidth - x : zoneWidth
      const h = mapHeight

      // Parse '#rrggbb' to integer — NOT Number() which returns NaN for hex strings (Pitfall 6)
      const colorInt = parseInt(dept.color.replace('#', ''), 16)

      // Semi-transparent fill
      this.graphics.fillStyle(colorInt, 0.08)
      this.graphics.fillRect(x, y, w, h)

      // Solid border
      this.graphics.lineStyle(2, colorInt, 0.4)
      this.graphics.strokeRect(x, y, w, h)

      // Zone label at top-left of zone
      const label = this.scene.add.text(x + 8, y + 8, dept.display_name, {
        fontSize: '11px',
        color: dept.color,
        backgroundColor: 'rgba(0,0,0,0.55)',
        padding: { x: 4, y: 2 },
      })
      label.setDepth(2)
      this.labels.push(label)

      this.zones.push({ x, y, width: w, height: h, departmentId: dept.id })
    })
  }

  /**
   * Returns zone bounds for the given department_id, or null if not found.
   */
  getZoneForDepartment(departmentId: string): ZoneBounds | null {
    return this.zones.find((z) => z.departmentId === departmentId) ?? null
  }

  /**
   * Computes the (x, y) center position for an agent at slotIndex within a zone.
   * Uses a 2-column grid with a 48px top offset for the zone label.
   */
  getPositionInZone(
    zone: ZoneBounds,
    slotIndex: number,
    totalSlots: number,
  ): { x: number; y: number } {
    const cols = 2
    const col = slotIndex % cols
    const row = Math.floor(slotIndex / cols)
    const cellW = zone.width / cols
    const rows = Math.ceil(totalSlots / cols)
    const availableHeight = zone.height - 48
    const cellH = availableHeight / (rows > 0 ? rows : 1)
    return {
      x: zone.x + cellW * col + cellW / 2,
      y: zone.y + 48 + cellH * row + cellH / 2,
    }
  }

  /** Clean up graphics and labels. */
  destroy(): void {
    this.graphics.destroy()
    this.labels.forEach((l) => l.destroy())
    this.labels = []
    this.zones = []
  }
}

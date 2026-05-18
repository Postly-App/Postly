/**
 * Analytics insights — calculs partagés entre l'IA et le dashboard.
 *
 * Centralisé pour qu'on n'ait pas deux versions de "meilleur créneau" qui
 * dérivent. Les composants Server/Client consomment les mêmes helpers.
 */

import { prisma } from "@/lib/prisma"

export const WEEKDAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
export const WEEKDAYS_FR_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]

/** Heatmap : 7 jours × 24 heures avec reach cumulé par bucket. */
export type HeatmapMatrix = number[][] // [day 0..6][hour 0..23]

export interface BestSlot {
  weekday: number // 0..6 (Sunday..Saturday)
  hour: number // 0..23
  reach: number
  posts: number
}

export interface TopPlatform {
  platform: string
  reach: number
}

export function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}h`
}

/**
 * Construit la matrice 7×24 de reach cumulé à partir des lignes Analytics.
 * Tous les buckets vides restent à 0.
 */
export function computeHeatmap(
  rows: Array<{ reach: number; recordedAt: Date }>
): HeatmapMatrix {
  const matrix: HeatmapMatrix = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  )
  for (const r of rows) {
    const d = r.recordedAt
    const wd = d.getDay()
    const h = d.getHours()
    matrix[wd][h] += r.reach
  }
  return matrix
}

/**
 * Top N créneaux de la heatmap (par reach desc).
 */
export function bestSlotsFromHeatmap(
  matrix: HeatmapMatrix,
  limit = 3
): BestSlot[] {
  const slots: BestSlot[] = []
  for (let wd = 0; wd < 7; wd++) {
    for (let h = 0; h < 24; h++) {
      const reach = matrix[wd][h]
      if (reach > 0) {
        slots.push({ weekday: wd, hour: h, reach, posts: 1 })
      }
    }
  }
  slots.sort((a, b) => b.reach - a.reach)
  return slots.slice(0, limit)
}

/**
 * Top plateformes par reach cumulé sur la fenêtre passée.
 */
export function computeTopPlatforms(
  rows: Array<{ platform: string; reach: number }>,
  limit = 4
): TopPlatform[] {
  const totals = new Map<string, number>()
  for (const r of rows) {
    totals.set(r.platform, (totals.get(r.platform) ?? 0) + r.reach)
  }
  return Array.from(totals.entries())
    .map(([platform, reach]) => ({ platform, reach }))
    .sort((a, b) => b.reach - a.reach)
    .slice(0, limit)
}

/**
 * Fenêtre rolling 30 jours, source des insights utilisés à la fois côté
 * dashboard et côté chat IA. Une seule requête DB pour les deux.
 */
export interface UserAnalyticsInsights {
  heatmap: HeatmapMatrix
  bestSlots: BestSlot[]
  topPlatforms: TopPlatform[]
  hasData: boolean
}

export async function loadUserAnalyticsInsights(
  userId: string,
  windowDays = 30
): Promise<UserAnalyticsInsights> {
  const since = new Date()
  since.setDate(since.getDate() - windowDays)

  const rows = await prisma.analytics.findMany({
    where: { userId, recordedAt: { gte: since } },
    select: { platform: true, reach: true, recordedAt: true },
    take: 2_000,
  })

  const heatmap = computeHeatmap(rows)
  const bestSlots = bestSlotsFromHeatmap(heatmap, 3)
  const topPlatforms = computeTopPlatforms(rows, 4)

  return {
    heatmap,
    bestSlots,
    topPlatforms,
    hasData: rows.length > 0,
  }
}

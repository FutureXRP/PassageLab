// lib/study-engine.ts
// Kept for compatibility — main generation now happens in the API route via streaming
import type { StudyData } from '@/types'
import { Role, getTabsForRoles } from './prompts'

export async function generateStudy(passage: string, roles: Role[]): Promise<StudyData> {
  const tabs = getTabsForRoles(roles)
  return { passage, roles, tabs } as unknown as StudyData
}
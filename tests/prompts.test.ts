import { describe, it, expect } from 'vitest'
import {
  getTabsForRoles,
  getTabModel,
  isDeepTab,
  getTabPrice,
  getStudyPrice,
  buildTabPrompt,
  TAB_MODELS,
  ROLE_TABS,
  DEEP_TABS,
  type Role,
} from '../lib/prompts'

describe('model routing / pricing rule', () => {
  it('quick tabs are $5, deep tabs are $10, academic tabs are $20', () => {
    expect(getTabPrice('overview')).toBe(5.00)
    expect(getTabPrice('language')).toBe(10.00)
    expect(getTabPrice('exegesis')).toBe(20.00)
  })

  it('isDeepTab matches sonnet routing exactly', () => {
    for (const [tabId, model] of Object.entries(TAB_MODELS)) {
      expect(isDeepTab(tabId)).toBe(model === 'sonnet')
    }
  })

  it('a study is priced at its highest tier (quick < deep < academic)', () => {
    expect(getStudyPrice(['overview', 'history'])).toBe(5.00)
    expect(getStudyPrice(['overview', 'language'])).toBe(10.00)
    expect(getStudyPrice(['overview', 'language', 'exegesis'])).toBe(20.00)
  })

  it('unknown tabs default to haiku / $5', () => {
    expect(getTabModel('nonexistent')).toBe('haiku')
    expect(getTabPrice('nonexistent')).toBe(5.00)
  })
})

describe('getTabsForRoles', () => {
  it('splits tabs by model tier', () => {
    const { quick, deep } = getTabsForRoles(['pastor'])
    expect(quick).toContain('overview')
    expect(deep).toContain('language')
    for (const t of quick) expect(isDeepTab(t)).toBe(false)
    for (const t of deep) expect(isDeepTab(t)).toBe(true)
  })

  it('merges tabs across two roles without duplicates', () => {
    const { quick, deep } = getTabsForRoles(['youth', 'children'])
    const all = [...quick, ...deep]
    expect(new Set(all).size).toBe(all.length)
    expect(quick).toContain('youth')
    expect(quick).toContain('children')
  })

  it('every role tab has a prompt builder', () => {
    const roles = Object.keys(ROLE_TABS) as Role[]
    for (const role of roles) {
      for (const tabId of [...ROLE_TABS[role], ...DEEP_TABS[role]]) {
        const prompt = buildTabPrompt(tabId, 'John 3:16', { kjv: 'For God so loved…' })
        expect(prompt, `missing prompt for tab "${tabId}" (role ${role})`).not.toBe('')
      }
    }
  })
})

describe('buildTabPrompt', () => {
  it('labels injected text as KJV', () => {
    const prompt = buildTabPrompt('overview', 'John 3:16', { kjv: 'For God so loved the world' })
    expect(prompt).toContain('Text (KJV):')
    expect(prompt).toContain('For God so loved the world')
  })

  it('returns empty string for unknown tabs', () => {
    expect(buildTabPrompt('nope', 'John 3:16')).toBe('')
  })
})

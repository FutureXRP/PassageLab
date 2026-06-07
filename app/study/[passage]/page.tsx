'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getTabsForRoles, Role } from '@/lib/prompts'

// ─── Design tokens ────────────────────────────────────────────────────────
const SERIF     = "'Playfair Display', Georgia, serif"
const SANS      = "'DM Sans', system-ui, sans-serif"
const GOLD      = '#C9973A'
const PARCHMENT = '#F5F0E8'
const SLATE     = '#8892A4'
const INK       = '#0D1117'
const PURPLE    = '#A78BFA'

// ─── Tab metadata ─────────────────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  overview:        'Overview',
  scripture:       'Scripture',
  language:        'Language',
  history:         'Historical',
  hermeneutics:    'Hermeneutics',
  theology:        'Theology',
  crossrefs:       'Cross-Refs',
  christ:          'Christ',
  apologetics:     'Apologetics',
  conflicts:       'Interpretive Conflicts',
  illustrations:   'Illustrations',
  outline:         'Outline',
  smallgroup:      'Small Group',
  youth:           'Youth',
  children:        'Children',
  essayoutline:    'Essay Outline',
  commentary:      'Commentary',
  fathers:         'Church Fathers',
  archaeology:     'Archaeology',
  apologetics_deep:'Apologetics+',
  books:           'Book List',
  citations:       'Citations',
}

// ─── Tab state types ──────────────────────────────────────────────────────
type TabStatus = 'idle' | 'generating' | 'done' | 'error'

interface TabState {
  status: TabStatus
  data:   Record<string, unknown> | null
  cached: boolean
}

// ─── Styles ───────────────────────────────────────────────────────────────
const S = {
  page: {
    background: INK,
    minHeight:  '100vh',
    color:      PARCHMENT,
    fontFamily: SANS,
  } as React.CSSProperties,

  nav: {
    position:       'sticky' as const,
    top:            0,
    zIndex:         100,
    background:     'rgba(13,17,23,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom:   '1px solid rgba(255,255,255,0.08)',
    padding:        '0 24px',
    height:         52,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  logo: {
    fontFamily: SERIF,
    fontSize:   18,
    fontWeight: 700,
    color:      PARCHMENT,
  } as React.CSSProperties,

  badge: (color: string): React.CSSProperties => ({
    fontSize:        11,
    color,
    background:      `${color}18`,
    border:          `1px solid ${color}40`,
    borderRadius:    4,
    padding:         '2px 10px',
    fontFamily:      SANS,
  }),

  tabRow: {
    display:         'flex',
    overflowX:       'auto' as const,
    scrollbarWidth:  'none' as const,
    padding:         '0 16px',
    background:      'rgba(255,255,255,0.02)',
    borderBottom:    '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,

  tabRowLabel: {
    fontSize:       10,
    color:          SLATE,
    textTransform:  'uppercase' as const,
    letterSpacing:  '1px',
    fontWeight:     600,
    padding:        '8px 20px 0',
    fontFamily:     SANS,
  } as React.CSSProperties,

  content: {
    maxWidth: 860,
    margin:   '0 auto',
    padding:  '28px 24px 80px',
  } as React.CSSProperties,

  hl: {
    background:   'rgba(201,151,58,0.08)',
    border:       '0.5px solid rgba(201,151,58,0.2)',
    borderRadius: 8,
    padding:      '14px 18px',
    marginBottom: 20,
  } as React.CSSProperties,

  hlLabel: {
    fontSize:      10,
    color:         GOLD,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight:    600,
    marginBottom:  6,
    fontFamily:    SANS,
  } as React.CSSProperties,

  hlText: {
    fontFamily:  SERIF,
    fontSize:    15,
    color:       PARCHMENT,
    lineHeight:  1.75,
    fontStyle:   'italic' as const,
  } as React.CSSProperties,

  secTitle: {
    fontSize:      10,
    color:         GOLD,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.2px',
    fontWeight:    600,
    marginBottom:  10,
    fontFamily:    SANS,
  } as React.CSSProperties,

  bodyTxt: {
    fontSize:    14,
    color:       PARCHMENT,
    lineHeight:  1.85,
    marginBottom:16,
    fontFamily:  SANS,
  } as React.CSSProperties,

  info: {
    marginBottom: 16,
    paddingBottom:16,
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,

  infoLabel: {
    fontSize:      11,
    color:         SLATE,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    fontWeight:    600,
    marginBottom:  6,
    fontFamily:    SANS,
  } as React.CSSProperties,

  deepBanner: {
    background:   'rgba(167,139,250,0.08)',
    border:       '0.5px solid rgba(167,139,250,0.2)',
    borderRadius: 8,
    padding:      '10px 14px',
    marginBottom: 20,
    display:      'flex',
    alignItems:   'center',
    gap:          10,
  } as React.CSSProperties,

  card: {
    background:   'rgba(255,255,255,0.03)',
    border:       '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding:      '18px 20px',
    marginBottom: 16,
  } as React.CSSProperties,

  themes: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap:                 8,
    marginTop:           8,
    marginBottom:        20,
  } as React.CSSProperties,

  pill: {
    background:   'rgba(255,255,255,0.04)',
    border:       '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding:      '8px 12px',
    fontSize:     13,
    color:        PARCHMENT,
    fontFamily:   SANS,
  } as React.CSSProperties,

  illus: {
    borderLeft:   `3px solid ${GOLD}`,
    background:   'rgba(255,255,255,0.03)',
    padding:      '14px 16px',
    marginBottom: 14,
  } as React.CSSProperties,

  illusCat: {
    fontSize:        10,
    fontWeight:      600,
    color:           GOLD,
    textTransform:   'uppercase' as const,
    letterSpacing:   '1px',
    background:      'rgba(201,151,58,0.1)',
    borderRadius:    4,
    padding:         '2px 8px',
    display:         'inline-block',
    marginBottom:    8,
  } as React.CSSProperties,

  bridge: {
    background:   'rgba(201,151,58,0.06)',
    borderRadius: 6,
    padding:      '10px 12px',
    marginTop:    10,
  } as React.CSSProperties,

  pt: {
    display:      'flex',
    gap:          14,
    padding:      '16px 0',
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,

  ptNum: {
    fontFamily: SERIF,
    fontSize:   28,
    fontWeight: 700,
    color:      'rgba(201,151,58,0.3)',
    minWidth:   26,
    lineHeight: '1.2',
  } as React.CSSProperties,

  app: {
    background:   'rgba(201,151,58,0.05)',
    borderRadius: 6,
    padding:      '10px 12px',
    marginTop:    10,
  } as React.CSSProperties,

  wordCard: {
    background:   'rgba(255,255,255,0.03)',
    border:       '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding:      '18px 20px',
    marginBottom: 16,
  } as React.CSSProperties,

  word: {
    fontFamily: SERIF,
    fontSize:   26,
    color:      GOLD,
    fontWeight: 600,
  } as React.CSSProperties,

  preach: {
    background:  'rgba(201,151,58,0.06)',
    borderLeft:  '3px solid rgba(201,151,58,0.5)',
    padding:     '10px 14px',
    marginTop:   12,
  } as React.CSSProperties,

  archCard: {
    background:   'rgba(255,255,255,0.03)',
    border:       '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding:      '18px 20px',
    marginBottom: 16,
  } as React.CSSProperties,

  sig: {
    background:  'rgba(201,151,58,0.06)',
    borderLeft:  '3px solid rgba(201,151,58,0.4)',
    padding:     '10px 14px',
    marginTop:   10,
  } as React.CSSProperties,
}

// ─── Small reusable components ─────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <div style={S.secTitle}>{text}</div>
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={S.bodyTxt}>{children}</p>
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <Label text={title} />
      {children}
    </div>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.info}>
      <div style={S.infoLabel}>{label}</div>
      <p style={{ ...S.bodyTxt, margin: 0 }}>{children}</p>
    </div>
  )
}

function Hl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.hl}>
      <div style={S.hlLabel}>{label}</div>
      <div style={S.hlText}>{children}</div>
    </div>
  )
}

function DeepBanner({ tabId }: { tabId: string }) {
  return (
    <div style={S.deepBanner}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: PURPLE }}>Deep Dive — {TAB_LABELS[tabId] || tabId}</span>
    </div>
  )
}

// ─── Tab content renderers ─────────────────────────────────────────────────

function OverviewTab({ data }: { data: any }) {
  const o = data?.overview
  if (!o) return null
  return (
    <>
      <Hl label="Main Idea">{o.main_idea}</Hl>
      <Info label="Summary">{o.summary}</Info>
      <Info label="Setting">{o.setting}</Info>
      <Info label="Literary Structure">{o.literary_structure}</Info>
      <Sec title="Key Themes">
        <div style={S.themes}>
          {(o.themes || []).map((t: string, i: number) => (
            <div key={i} style={S.pill}>{t}</div>
          ))}
        </div>
      </Sec>
      <Sec title="Teaching Opportunities">
        {(o.teaching_opportunities || []).map((t: string, i: number) => (
          <Body key={i}>→ {t}</Body>
        ))}
      </Sec>
    </>
  )
}

function ScriptureTab({ data, bibleText, bibleVersion }: { data: any; bibleText: any; bibleVersion: string }) {
  const s = data?.scripture
  return (
    <>
      {bibleText && (
        <div style={{ fontFamily: SERIF, fontSize: 14, lineHeight: 2.1, color: PARCHMENT, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '20px 22px', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
          {bibleText[bibleVersion] || bibleText.kjv}
        </div>
      )}
      {s && (
        <>
          <Hl label="Key Verse">{s.key_verse}</Hl>
          <Label text="Verse-by-Verse Notes" />
          {(s.verse_by_verse || []).map((v: any, i: number) => (
            <div key={i} style={{ ...S.info, borderBottom: i < s.verse_by_verse.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6, fontFamily: SERIF, fontStyle: 'italic' }}>{v.verse}</div>
              <p style={{ ...S.bodyTxt, margin: 0 }}>{v.notes}</p>
            </div>
          ))}
        </>
      )}
    </>
  )
}

function LanguageTab({ data }: { data: any }) {
  const words = data?.language || []
  return (
    <>
      {words.map((w: any, i: number) => (
        <div key={i} style={S.wordCard}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' as const }}>
            <span style={S.word}>{w.word}</span>
            <span style={{ fontSize: 13, color: SLATE, fontStyle: 'italic' as const }}>{w.transliteration}</span>
            <span style={{ fontSize: 11, color: SLATE, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 8px' }}>{w.strongs}</span>
            <span style={{ fontSize: 11, color: GOLD, background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 4, padding: '2px 8px' }}>{w.pos}</span>
          </div>
          {w.parsing && <div style={{ fontSize: 12, color: SLATE, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>{w.parsing}</div>}
          <Info label="Definition">{w.definition}</Info>
          <Info label="Canonical Usage">{w.usage}</Info>
          <Info label="Cognates">{w.cognates}</Info>
          <div style={S.preach}>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Preaching Note</div>
            <p style={{ ...S.bodyTxt, margin: 0 }}>{w.preaching_note}</p>
          </div>
        </div>
      ))}
    </>
  )
}

function HistoryTab({ data }: { data: any }) {
  const h = data?.history
  if (!h) return null
  return (
    <>
      {Object.entries(h).map(([key, val]: [string, any], i, arr) => (
        <div key={key} style={{ ...S.info, borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={S.infoLabel}>{key.replace(/_/g, ' ')}</div>
          <p style={{ ...S.bodyTxt, margin: 0 }}>{val}</p>
        </div>
      ))}
    </>
  )
}

function HermeneuticsTab({ data }: { data: any }) {
  const h = data?.hermeneutics
  if (!h) return null
  return (
    <>
      <Info label="Genre Rules">{h.genre_rules}</Info>
      <Info label="Authorial Intent">{h.authorial_intent}</Info>
      <Info label="Context Levels">{h.context_levels}</Info>
      <Sec title="Common Mistakes">
        {(h.common_mistakes || []).map((m: string, i: number) => <Body key={i}>→ {m}</Body>)}
      </Sec>
      <Sec title="Key Questions">
        {(h.key_questions || []).map((q: string, i: number) => <Body key={i}>{i + 1}. {q}</Body>)}
      </Sec>
      <Info label="Faithful Reading">{h.faithful_reading}</Info>
      <Info label="Application Principles">{h.application_principles}</Info>
      <Info label="Interpretive Tradition">{h.interpretive_tradition}</Info>
    </>
  )
}

function ChristTab({ data }: { data: any }) {
  const c = data?.christ
  if (!c) return null
  return (
    <>
      <Hl label="Christological Title">{c.title}</Hl>
      <Info label="Christ's Presence">{c.presence}</Info>
      <Info label="Old Testament Foreshadowing">{c.foreshadowing}</Info>
      <Info label="Fulfillment">{c.fulfillment}</Info>
      <Info label="Gospel Thread">{c.gospel_thread}</Info>
      <Info label="Path from Text to Christ">{c.christocentric_preaching}</Info>
    </>
  )
}

function TheologyTab({ data, isDeep }: { data: any; isDeep?: boolean }) {
  const t = data?.theology
  if (!t) return null
  return (
    <>
      {isDeep && <DeepBanner tabId="theology" />}
      <Info label="God">{t.god}</Info>
      <Info label="Christology">{t.christ}</Info>
      <Info label="Holy Spirit">{t.holy_spirit}</Info>
      <Info label="Salvation">{t.salvation}</Info>
      <Info label="Humanity">{t.humanity}</Info>
      <Info label="Kingdom">{t.kingdom}</Info>
      <Info label="Covenant">{t.covenant}</Info>
      <Info label="Church">{t.church}</Info>
      <Info label="Eschatology">{t.eschatology}</Info>
      <Info label="Biblical Theology Arc">{t.biblical_theology}</Info>
      <Info label="Systematic Connections">{t.systematic_connections}</Info>
      {t.doctrinal_issues && (
        <Sec title="Doctrinal Issues">
          {t.doctrinal_issues.map((d: string, i: number) => <Body key={i}>→ {d}</Body>)}
        </Sec>
      )}
    </>
  )
}

function CrossRefsTab({ data }: { data: any }) {
  const c = data?.crossrefs
  if (!c) return null
  const renderList = (items: string[], label: string) => items?.length > 0 && (
    <Sec title={label}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((r: string, i: number) => (
          <li key={i} style={{ ...S.bodyTxt, padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.05)', marginBottom: 0 }}>{r}</li>
        ))}
      </ul>
    </Sec>
  )
  return (
    <>
      {renderList(c.direct, 'Direct References')}
      {renderList(c.prophetic, 'Prophetic Connections')}
      {renderList(c.typological, 'Typological Connections')}
      {renderList(c.thematic, 'Thematic Connections')}
      {renderList(c.parallel_passages, 'Parallel Passages')}
      <Info label="Old Testament Backdrop">{c.ot_backdrop}</Info>
      <Info label="NT Development">{c.nt_development}</Info>
    </>
  )
}

function ApologeticsTab({ data, isDeep }: { data: any; isDeep?: boolean }) {
  const a = isDeep ? data?.apologetics_deep : data?.apologetics
  if (!a) return null

  if (isDeep) {
    return (
      <>
        <DeepBanner tabId="apologetics_deep" />
        <Info label="Manuscript Evidence">{a.manuscript_evidence}</Info>
        <Info label="Historical Corroboration">{a.historical_corroboration}</Info>
        <Info label="Source Criticism">{a.source_criticism}</Info>
        <Sec title="Major Scholarly Objections">
          {(a.major_scholarly_objections || []).map((obj: any, i: number) => (
            <div key={i} style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: PARCHMENT, marginBottom: 8 }}>{obj.objection}</div>
              <div style={{ fontSize: 12, color: SLATE, marginBottom: 10 }}>{obj.scholar}</div>
              <Info label="Response">{obj.evangelical_response}</Info>
              {obj.remaining_tensions && <Info label="Remaining Tensions">{obj.remaining_tensions}</Info>}
            </div>
          ))}
        </Sec>
        <Info label="Cumulative Case">{a.cumulative_case}</Info>
        <Info label="What Critics Get Right">{a.what_critics_get_right}</Info>
      </>
    )
  }

  return (
    <>
      <Info label="Historical Reliability">{a.historical_reliability}</Info>
      <Info label="Textual Criticism">{a.textual_criticism}</Info>
      <Sec title="Critical Objections">
        {(a.critical_objections || []).map((obj: any, i: number) => (
          <div key={i} style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: PARCHMENT, marginBottom: 6 }}>{obj.objection}</div>
            <div style={{ fontSize: 12, color: SLATE, marginBottom: 10 }}>Source: {obj.source}</div>
            <Info label="Response">{obj.response}</Info>
          </div>
        ))}
      </Sec>
      <Info label="Philosophical Challenges">{a.philosophical_challenges}</Info>
      <Sec title="Conversational Responses">
        {(a.conversational_responses || []).map((r: string, i: number) => (
          <Body key={i}>→ {r}</Body>
        ))}
      </Sec>
      <Info label="What Critics Get Right">{a.what_critics_get_right}</Info>
      <Info label="Strongest Evidence">{a.strongest_evidence}</Info>
    </>
  )
}

function IllustrationsTab({ data }: { data: any }) {
  const items = data?.illustrations || []
  return (
    <>
      {items.map((ill: any, i: number) => (
        <div key={i} style={S.illus}>
          <div style={S.illusCat}>{ill.category}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: PARCHMENT, marginBottom: 10 }}>{ill.title}</div>
          <div style={{ fontFamily: SERIF, fontSize: 14, color: PARCHMENT, fontStyle: 'italic' as const, lineHeight: 1.9, marginBottom: 12 }}>{ill.content}</div>
          <div style={S.bridge}>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Bridge</div>
            <p style={{ ...S.bodyTxt, margin: 0, fontSize: 13 }}>{ill.bridge}</p>
          </div>
        </div>
      ))}
    </>
  )
}

function OutlineTab({ data }: { data: any }) {
  const o = data?.outline
  if (!o) return null
  return (
    <>
      <Hl label="Sermon Title">{o.title}</Hl>
      <Hl label="Big Idea">{o.big_idea}</Hl>
      <Info label="Introduction">{o.introduction}</Info>
      {(o.points || []).map((pt: any, i: number) => (
        <div key={i} style={{ ...S.pt, borderBottom: i < o.points.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={S.ptNum}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: PARCHMENT, marginBottom: 8 }}>{pt.point}</div>
            {(pt.subpoints || []).map((s: string, j: number) => (
              <div key={j} style={{ fontSize: 13, color: SLATE, lineHeight: 1.75, paddingLeft: 12, marginBottom: 4 }}>· {s}</div>
            ))}
            <div style={S.app}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Application</div>
              <p style={{ ...S.bodyTxt, margin: 0, fontSize: 13 }}>{pt.application}</p>
            </div>
          </div>
        </div>
      ))}
      <Info label="Conclusion">{o.conclusion}</Info>
      {o.invitation && <Info label="Invitation">{o.invitation}</Info>}
    </>
  )
}

function SmallGroupTab({ data }: { data: any }) {
  const sg = data?.smallgroup
  if (!sg) return null
  const typeColor: Record<string, string> = { Observation: '#60A5FA', Interpretation: GOLD, Application: '#34D399', Prayer: PURPLE }
  return (
    <>
      <Hl label="Icebreaker">{sg.icebreaker}</Hl>
      <Info label="Context Setter">{sg.context_setter}</Info>
      <Sec title="Discussion Questions">
        {(sg.questions || []).map((q: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: typeColor[q.type] || SLATE, textTransform: 'uppercase' as const, letterSpacing: '0.8px', fontWeight: 600, marginBottom: 4 }}>{q.type}</div>
            <p style={{ ...S.bodyTxt, margin: 0 }}>{q.question}</p>
          </div>
        ))}
      </Sec>
      {sg.activity && <Info label="Group Activity">{sg.activity}</Info>}
      <Hl label="Weekly Takeaway">{sg.takeaway}</Hl>
    </>
  )
}

function YouthTab({ data }: { data: any }) {
  const y = data?.youth
  if (!y) return null
  return (
    <>
      <Hl label="Big Truth">{y.big_truth}</Hl>
      <Info label="Cultural Hook">{y.cultural_hook}</Info>
      {y.game && <Info label={`Game: ${y.game.name}`}>{y.game.instructions} — {y.game.connection}</Info>}
      {y.object_lesson && <Info label={`Object Lesson: ${y.object_lesson.object}`}>{y.object_lesson.lesson}</Info>}
      <Sec title="Discussion Questions">
        {(y.discussion_questions || []).map((q: string, i: number) => <Body key={i}>{i + 1}. {q}</Body>)}
      </Sec>
      <Info label="Weekly Challenge">{y.challenge}</Info>
      <Hl label="Memory Verse">{y.memory_verse}</Hl>
    </>
  )
}

function ChildrenTab({ data }: { data: any }) {
  const c = data?.children
  if (!c) return null
  return (
    <>
      <Hl label="Big Truth">{c.big_truth}</Hl>
      <Hl label="Memory Verse">{c.memory_verse}</Hl>
      <Info label="Story Retelling">{c.story_retelling}</Info>
      {c.object_lesson && <Info label={`Object Lesson: ${c.object_lesson.object}`}>{c.object_lesson.lesson}</Info>}
      {c.craft_idea && <Info label="Craft Idea">{c.craft_idea}</Info>}
      {c.activity && <Info label="Activity">{c.activity}</Info>}
      {c.snack_idea && <Info label="Snack Idea">{c.snack_idea}</Info>}
      <Sec title="Discussion Questions">
        {(c.discussion_questions || []).map((q: string, i: number) => <Body key={i}>{i + 1}. {q}</Body>)}
      </Sec>
      <Info label="Parent Connection">{c.parent_connection}</Info>
    </>
  )
}

function EssayOutlineTab({ data }: { data: any }) {
  const e = data?.essay_outline
  if (!e) return null
  return (
    <>
      <Hl label="Suggested Title">{e.suggested_title}</Hl>
      <Hl label="Thesis">{e.thesis}</Hl>
      <Info label="Abstract">{e.abstract}</Info>
      <Sec title="Paper Structure">
        {(e.sections || []).map((s: any, i: number) => (
          <div key={i} style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: GOLD, marginBottom: 6 }}>{s.section}</div>
            <p style={{ ...S.bodyTxt, margin: 0 }}>{s.content}</p>
          </div>
        ))}
      </Sec>
      <Sec title="Key Arguments">
        {(e.key_arguments || []).map((a: string, i: number) => <Body key={i}>{i + 1}. {a}</Body>)}
      </Sec>
      <Info label="Research Starting Points">{(e.research_starting_points || []).join(' · ')}</Info>
    </>
  )
}

function CommentaryTab({ data }: { data: any }) {
  const c = data?.commentary
  if (!c) return null
  const scholars = [
    ['Matthew Henry', c.matthew_henry],
    ['Spurgeon', c.spurgeon],
    ['Calvin', c.calvin],
    ['Augustine', c.augustine],
    ['Luther', c.luther],
    ['Modern Reformed', c.modern_reformed],
    ['Modern Evangelical', c.modern_evangelical],
  ]
  return (
    <>
      <DeepBanner tabId="commentary" />
      {scholars.filter(([, v]) => v).map(([name, val]: any, i) => (
        <Info key={i} label={name}>{val}</Info>
      ))}
      <Info label="Areas of Agreement">{c.areas_of_agreement}</Info>
      <Info label="Areas of Debate">{c.areas_of_debate}</Info>
      <Hl label="Best Single Insight">{c.best_insight}</Hl>
    </>
  )
}

function FathersTab({ data }: { data: any }) {
  const fathers = data?.church_fathers || []
  return (
    <>
      <DeepBanner tabId="fathers" />
      {fathers.map((f: any, i: number) => (
        <div key={i} style={S.card}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: PARCHMENT }}>{f.father}</span>
            <span style={{ fontSize: 11, color: SLATE }}>{f.dates}</span>
            {f.tradition && <span style={{ fontSize: 11, color: SLATE }}>{f.tradition}</span>}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 14, color: PARCHMENT, fontStyle: 'italic' as const, lineHeight: 1.85, borderLeft: `3px solid rgba(201,151,58,0.4)`, paddingLeft: 16, marginBottom: 14 }}>{f.quote}</div>
          <p style={{ ...S.bodyTxt, margin: 0 }}>{f.context}</p>
        </div>
      ))}
    </>
  )
}

function ArchaeologyTab({ data }: { data: any }) {
  const items = data?.archaeology || []
  return (
    <>
      <DeepBanner tabId="archaeology" />
      {items.map((a: any, i: number) => (
        <div key={i} style={S.archCard}>
          <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: PARCHMENT, marginBottom: 4 }}>{a.discovery}</div>
          <div style={{ fontSize: 11, color: SLATE, marginBottom: 14 }}>{a.location} · {a.date_found}</div>
          <Info label="Relevance">{a.relevance}</Info>
          <Info label="Details">{a.details}</Info>
          <div style={S.sig}>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>For Preachers</div>
            <p style={{ ...S.bodyTxt, margin: 0 }}>{a.significance}</p>
          </div>
        </div>
      ))}
    </>
  )
}

function BooksTab({ data, passage }: { data: any; passage?: string }) {
  const books = data?.books || []
  const levelColor: Record<string, string> = {
    Beginner:     '#34D399',
    Intermediate: GOLD,
    Advanced:     '#60A5FA',
    Scholar:      PURPLE,
  }

  const amazonTag  = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'passagelab-20'
  const logosRef   = process.env.NEXT_PUBLIC_LOGOS_AFFILIATE_REF  || 'passagelab'
  const cbdAff     = process.env.NEXT_PUBLIC_CBD_AFFILIATE_ID     || 'passagelab'

  function amazonLink(title: string, author: string, isbn?: string) {
    if (isbn) return `https://www.amazon.com/dp/${isbn.replace(/-/g,'')}?tag=${amazonTag}`
    return `https://www.amazon.com/s?k=${encodeURIComponent(title + ' ' + author)}&tag=${amazonTag}`
  }
  function logosLink(title: string, author: string) {
    return `https://www.logos.com/search#q=${encodeURIComponent(title + ' ' + author)}&ref=${logosRef}`
  }
  function cbdLink(title: string, author: string) {
    return `https://www.christianbook.com/page/search?q=${encodeURIComponent(title + ' ' + author)}&af=${cbdAff}`
  }

  return (
    <>
      <DeepBanner tabId="books" />
      {books.map((b: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', ...S.card }}>
          <div style={{ width: 4, flexShrink: 0, alignSelf: 'stretch', borderRadius: 2, background: levelColor[b.level] || SLATE }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: GOLD, marginBottom: 4 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: SLATE, marginBottom: 10 }}>{b.author}</div>
            <p style={{ ...S.bodyTxt, marginBottom: 12 }}>{b.description}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: levelColor[b.level] || SLATE, background: `${levelColor[b.level] || SLATE}18`, border: `1px solid ${levelColor[b.level] || SLATE}40`, borderRadius: 4, padding: '2px 8px' }}>{b.level}</span>
              <span style={{ fontSize: 10, color: SLATE, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 8px' }}>{b.type}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {[
                { label: 'Amazon ↗', href: amazonLink(b.title, b.author, b.isbn) },
                { label: 'Logos ↗',  href: logosLink(b.title, b.author) },
                { label: 'CBD ↗',    href: cbdLink(b.title, b.author) },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize:     12,
                    color:        GOLD,
                    background:   'rgba(201,151,58,0.08)',
                    border:       '1px solid rgba(201,151,58,0.25)',
                    borderRadius: 4,
                    padding:      '4px 10px',
                    textDecoration: 'none',
                    fontWeight:   500,
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function CitationsTab({ data }: { data: any }) {
  const c = data?.citations
  if (!c) return null
  return (
    <>
      <DeepBanner tabId="citations" />
      <div style={{ ...S.deepBanner, background: 'rgba(251,191,36,0.06)', border: '0.5px solid rgba(251,191,36,0.2)', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#FBBF24' }}>⚠ {c.disclaimer}</span>
      </div>
      {c.commentaries?.length > 0 && (
        <Sec title="Commentaries">
          {c.commentaries.map((r: any, i: number) => (
            <div key={i} style={S.card}>
              <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: PARCHMENT, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: SLATE, marginBottom: 10 }}>{r.author_first} {r.author_last} · {r.publisher}, {r.year}</div>
              <div style={{ fontSize: 12, color: SLATE, marginBottom: 4 }}><span style={{ color: GOLD }}>SBL:</span> {r.sbl}</div>
              <div style={{ fontSize: 12, color: SLATE }}><span style={{ color: GOLD }}>Turabian:</span> {r.turabian}</div>
            </div>
          ))}
        </Sec>
      )}
      {c.free_online_resources?.length > 0 && (
        <Sec title="Free Online Resources">
          {c.free_online_resources.map((r: any, i: number) => (
            <div key={i} style={{ ...S.info, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontWeight: 600, marginBottom: 4, display: 'block' }}>{r.name} ↗</a>
              <p style={{ ...S.bodyTxt, margin: 0, fontSize: 13 }}>{r.description}</p>
            </div>
          ))}
        </Sec>
      )}
    </>
  )
}

function ConflictsTab({ data }: { data: any }) {
  const c = data?.conflicts
  if (!c) return null
  return (
    <>
      <Hl label="Central Interpretive Question">{c.central_question}</Hl>
      <Info label="Why It Matters">{c.why_it_matters}</Info>
      <Sec title="Major Interpretive Positions">
        {(c.positions || []).map((pos: any, i: number) => (
          <div key={i} style={S.card}>
            <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: PARCHMENT, marginBottom: 4 }}>{pos.name}</div>
            <div style={{ fontSize: 12, color: SLATE, marginBottom: 12 }}>Held by: {pos.held_by}</div>
            <Info label="Argument">{pos.argument}</Info>
            <Info label="Key Texts">{pos.key_texts}</Info>
            <div style={{ ...S.preach, borderLeft: '3px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.04)' }}>
              <div style={{ fontSize: 10, color: '#F87171', textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Point of Tension</div>
              <p style={{ ...S.bodyTxt, margin: 0 }}>{pos.weakness}</p>
            </div>
          </div>
        ))}
      </Sec>
      <Info label="Common Ground — Where All Sides Agree">{c.common_ground}</Info>
      <Info label="Historical Development">{c.historical_development}</Info>
      {c.secondary_disputes?.length > 0 && (
        <Sec title="Secondary Disputes">
          {c.secondary_disputes.map((d: string, i: number) => <Body key={i}>→ {d}</Body>)}
        </Sec>
      )}
      <div style={S.preach}>
        <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Pastoral Wisdom</div>
        <p style={{ ...S.bodyTxt, margin: 0 }}>{c.pastoral_wisdom}</p>
      </div>
    </>
  )
}

// ─── Tab content router ────────────────────────────────────────────────────

function TabContent({ tabId, data, bibleText, bibleVersion }: {
  tabId: string
  data:  Record<string, unknown> | null
  bibleText: any
  bibleVersion: string
}) {
  if (!data) return null
  switch (tabId) {
    case 'overview':        return <OverviewTab data={data} />
    case 'scripture':       return <ScriptureTab data={data} bibleText={bibleText} bibleVersion={bibleVersion} />
    case 'language':        return <LanguageTab data={data} />
    case 'history':         return <HistoryTab data={data} />
    case 'hermeneutics':    return <HermeneuticsTab data={data} />
    case 'christ':          return <ChristTab data={data} />
    case 'theology':        return <TheologyTab data={data} />
    case 'crossrefs':       return <CrossRefsTab data={data} />
    case 'apologetics':     return <ApologeticsTab data={data} />
    case 'apologetics_deep':return <ApologeticsTab data={data} isDeep />
    case 'conflicts':       return <ConflictsTab data={data} />
    case 'illustrations':   return <IllustrationsTab data={data} />
    case 'outline':         return <OutlineTab data={data} />
    case 'smallgroup':      return <SmallGroupTab data={data} />
    case 'youth':           return <YouthTab data={data} />
    case 'children':        return <ChildrenTab data={data} />
    case 'essayoutline':    return <EssayOutlineTab data={data} />
    case 'commentary':      return <CommentaryTab data={data} />
    case 'fathers':         return <FathersTab data={data} />
    case 'archaeology':     return <ArchaeologyTab data={data} />
    case 'books':           return <BooksTab data={data} passage={tabId} />
    case 'citations':       return <CitationsTab data={data} />
    default:                return <pre style={{ color: PARCHMENT, fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>
  }
}

// ─── Tab button ────────────────────────────────────────────────────────────

function TabButton({ tabId, status, isDeep, isActive, onClick, cached }: {
  tabId:    string
  status:   TabStatus
  isDeep:   boolean
  isActive: boolean
  onClick:  () => void
  cached:   boolean
}) {
  const activeColor = isDeep ? PURPLE : GOLD
  const color = isActive ? activeColor : status === 'done' ? (isDeep ? '#8B7CF8' : '#B8892A') : SLATE

  return (
    <button
      onClick={onClick}
      style={{
        padding:       '11px 15px',
        fontSize:      13,
        fontWeight:    500,
        color,
        cursor:        'pointer',
        border:        'none',
        borderBottom:  isActive ? `2px solid ${activeColor}` : '2px solid transparent',
        whiteSpace:    'nowrap' as const,
        background:    'none',
        transition:    'color 0.2s',
        display:       'flex',
        alignItems:    'center',
        gap:           5,
        fontFamily:    SANS,
        opacity:       status === 'generating' ? 0.7 : 1,
      }}
    >
      {isDeep && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? PURPLE : '#6B7A9F', flexShrink: 0, display: 'inline-block' }} />}
      {status === 'generating' && <span style={{ width: 10, height: 10, border: `2px solid ${activeColor}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />}
      {status === 'done' && cached && <span title="Served from cache" style={{ fontSize: 9, color: activeColor }}>⚡</span>}
      {TAB_LABELS[tabId] || tabId}
      {status === 'idle' && <span style={{ fontSize: 10, color: SLATE }}>+</span>}
    </button>
  )
}

// ─── Idle tab placeholder ──────────────────────────────────────────────────

function IdlePlaceholder({ tabId, onGenerate, isDeep }: {
  tabId:       string
  onGenerate:  () => void
  isDeep:      boolean
}) {
  const color = isDeep ? PURPLE : GOLD
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.3 }}>
        {isDeep ? '🔬' : '📖'}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 18, color: PARCHMENT, marginBottom: 8 }}>
        {TAB_LABELS[tabId] || tabId}
      </div>
      <div style={{ fontSize: 14, color: SLATE, marginBottom: 24, maxWidth: 300 }}>
        {isDeep ? 'Deep Dive content — click to generate a full scholarly analysis' : 'Click to generate this section of your study'}
      </div>
      <button
        onClick={onGenerate}
        style={{
          background:   color,
          color:        INK,
          border:       'none',
          borderRadius: 8,
          padding:      '12px 28px',
          fontSize:     14,
          fontWeight:   600,
          cursor:       'pointer',
          fontFamily:   SANS,
        }}
      >
        Generate {isDeep ? `Deep Dive` : 'Study'} {isDeep ? '($2)' : '($1)'}
      </button>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function StudyPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const passage      = decodeURIComponent(params.passage as string)
  const rolesParam   = searchParams.get('roles') || 'pastor'
  const roles        = rolesParam.split(',').filter(Boolean) as Role[]

  const { quick: quickTabs, deep: deepTabs } = getTabsForRoles(roles)
  const allTabs = [...quickTabs, ...deepTabs]

  const [tabStates, setTabStates]     = useState<Record<string, TabState>>({})
  const [bibleText, setBibleText]     = useState<any>(null)
  const [bibleVersion, setBibleVersion] = useState('kjv')
  const [activeTab, setActiveTab]     = useState('')
  const hasInit                        = useRef(false)

  // Auto-generate Overview + Scripture on load
  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    generateTab('overview')
    generateTab('scripture')
    setActiveTab('overview')
  }, [])

  async function generateTab(tabId: string) {
    setTabStates(prev => ({
      ...prev,
      [tabId]: { status: 'generating', data: null, cached: false }
    }))

    try {
      const res = await fetch('/api/tab', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ passage, roles, tabId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setTabStates(prev => ({
          ...prev,
          [tabId]: { status: 'error', data: null, cached: false }
        }))
        return
      }

      // Extract bible text from scripture response
      if (tabId === 'scripture' && json.bibleText) {
        setBibleText(json.bibleText)
      }

      setTabStates(prev => ({
        ...prev,
        [tabId]: { status: 'done', data: json.data, cached: json.cached }
      }))
    } catch {
      setTabStates(prev => ({
        ...prev,
        [tabId]: { status: 'error', data: null, cached: false }
      }))
    }
  }

  function handleTabClick(tabId: string) {
    setActiveTab(tabId)
    const state = tabStates[tabId]
    if (!state || state.status === 'idle') {
      generateTab(tabId)
    }
  }

  const activeState  = tabStates[activeTab]
  const isDeepActive = deepTabs.includes(activeTab)

  // This month's spend — placeholder until auth is wired
  const studiesDone = Object.values(tabStates).filter(s => s.status === 'done').length

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } button:hover { opacity: 0.85 }`}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>
          Passage<span style={{ color: GOLD }}>Lab</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic' as const, color: PARCHMENT }}>{passage}</span>
          {roles.map(r => (
            <span key={r} style={S.badge(GOLD)}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: SLATE }}>
            {Object.values(tabStates).filter(s => s.status === 'generating').length > 0 ? 'Generating…' : `${Object.values(tabStates).filter(s => s.status === 'done').length} tabs ready`}
          </span>
        </div>
      </nav>

      {/* Quick Study tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={S.tabRowLabel}>Quick Study</div>
        <div style={S.tabRow}>
          {quickTabs.map(tabId => (
            <TabButton
              key={tabId}
              tabId={tabId}
              status={tabStates[tabId]?.status || 'idle'}
              isDeep={false}
              isActive={activeTab === tabId}
              cached={tabStates[tabId]?.cached || false}
              onClick={() => handleTabClick(tabId)}
            />
          ))}
        </div>

        {/* Deep Dive tabs */}
        {deepTabs.length > 0 && (
          <>
            <div style={S.tabRowLabel}>Deep Dive</div>
            <div style={S.tabRow}>
              {deepTabs.map(tabId => (
                <TabButton
                  key={tabId}
                  tabId={tabId}
                  status={tabStates[tabId]?.status || 'idle'}
                  isDeep={true}
                  isActive={activeTab === tabId}
                  cached={tabStates[tabId]?.cached || false}
                  onClick={() => handleTabClick(tabId)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Generating spinner */}
        {activeState?.status === 'generating' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${isDeepActive ? PURPLE : GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: SLATE, fontSize: 14 }}>
              {isDeepActive ? 'Running deep analysis…' : 'Generating study content…'}
            </span>
          </div>
        )}

        {/* Error state */}
        {activeState?.status === 'error' && (
          <div style={{ padding: '40px 0', textAlign: 'center' as const }}>
            <div style={{ color: '#F87171', marginBottom: 16 }}>Generation failed. Please try again.</div>
            <button
              onClick={() => generateTab(activeTab)}
              style={{ background: GOLD, color: INK, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Idle state — not yet generated */}
        {(!activeState || activeState.status === 'idle') && activeTab && (
          <IdlePlaceholder
            tabId={activeTab}
            onGenerate={() => generateTab(activeTab)}
            isDeep={isDeepActive}
          />
        )}

        {/* No tab selected */}
        {!activeTab && (
          <div style={{ padding: '60px 0', textAlign: 'center' as const, color: SLATE }}>
            Select a tab above to begin your study
          </div>
        )}

        {/* Done — render content */}
        {activeState?.status === 'done' && activeState.data && (
          <>
            {activeState.cached && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: GOLD }}>⚡</span>
                <span style={{ fontSize: 11, color: SLATE }}>Served from PassageLab library — instant</span>
              </div>
            )}
            <TabContent
              tabId={activeTab}
              data={activeState.data}
              bibleText={bibleText}
              bibleVersion={bibleVersion}
            />
          </>
        )}
      </div>
    </div>
  )
}
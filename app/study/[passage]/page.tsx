'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const ALL_TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'scripture',     label: 'Scripture' },
  { id: 'language',      label: 'Language' },
  { id: 'history',       label: 'Historical' },
  { id: 'archaeology',   label: 'Archaeology' },
  { id: 'theology',      label: 'Theology' },
  { id: 'crossref',      label: 'Cross-refs' },
  { id: 'christ',        label: 'Christ' },
  { id: 'commentary',    label: 'Commentary' },
  { id: 'fathers',       label: 'Church Fathers' },
  { id: 'quotes',        label: 'Quotes' },
  { id: 'books',         label: 'Book List' },
  { id: 'illustrations', label: 'Illustrations' },
  { id: 'news',          label: 'News & Research' },
  { id: 'outline',       label: 'Outline' },
  { id: 'manuscript',    label: 'Manuscript' },
  { id: 'smallgroup',    label: 'Small Group' },
  { id: 'youth',         label: 'Youth' },
  { id: 'children',      label: 'Children' },
]

const ROLE_LABELS: Record<string, string> = {
  pastor: 'Pastor', theologian: 'Theologian', teacher: 'Teacher',
  smallgroup: 'Small Group', youth: 'Youth Worker', children: "Children's Worker",
}

type TabState = 'pending' | 'generating' | 'done' | 'error'

interface TabData {
  state: TabState
  data: any
}

export default function StudyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const passage = decodeURIComponent(params.passage as string)
  const rolesParam = searchParams.get('roles') || 'pastor'
  const roles = rolesParam.split(',').filter(Boolean)

  const [visibleTabs, setVisibleTabs] = useState<string[]>([])
  const [tabStates, setTabStates] = useState<Record<string, TabData>>({})
  const [bibleText, setBibleText] = useState<any>(null)
  const [bibleVersion, setBibleVersion] = useState('kjv')
  const [activeTab, setActiveTab] = useState('')
  const [overviewData, setOverviewData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    async function stream() {
      try {
        const res = await fetch('/api/study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passage, roles }),
        })

        if (!res.ok) throw new Error('Failed to start study generation')
        if (!res.body) throw new Error('No response body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'init') {
                setVisibleTabs(event.tabs)
                setLoading(false)
                const initial: Record<string, TabData> = {}
                event.tabs.forEach((t: string) => { initial[t] = { state: 'pending', data: null } })
                setTabStates(initial)
                setActiveTab(event.tabs[0] || 'overview')
              }

              if (event.type === 'bible') {
                setBibleText(event.data)
              }

              if (event.type === 'tab_start') {
                setTabStates(prev => ({
                  ...prev,
                  [event.tabId]: { ...prev[event.tabId], state: 'generating' }
                }))
              }

              if (event.type === 'tab_done') {
                setTabStates(prev => ({
                  ...prev,
                  [event.tabId]: { state: 'done', data: event.data }
                }))
                if (event.tabId === 'overview') {
                  setOverviewData(event.data)
                }
              }

              if (event.type === 'error') {
                setError(event.message)
              }

            } catch {}
          }
        }
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }

    stream()
  }, [passage])

  const allDone = visibleTabs.length > 0 && visibleTabs.every(t => tabStates[t]?.state === 'done')
  const doneCount = visibleTabs.filter(t => tabStates[t]?.state === 'done').length

  return (
    <div style={{ minHeight:'100vh', background:'#0D1117', color:'#F5F0E8', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .tab-bar::-webkit-scrollbar { display:none; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:56, background:'rgba(13,17,23,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <a href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#F5F0E8', textDecoration:'none' }}>Passage<span style={{ color:'#C9973A' }}>Lab</span></a>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#F5F0E8', fontStyle:'italic' }}>{passage}</div>
          <div style={{ display:'flex', gap:6 }}>
            {roles.map(r => (
              <span key={r} style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'#C9973A', background:'rgba(201,151,58,0.1)', border:'1px solid rgba(201,151,58,0.2)', borderRadius:4, padding:'2px 8px' }}>{ROLE_LABELS[r] || r}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {!allDone && visibleTabs.length > 0 && (
            <div style={{ fontSize:12, color:'#8892A4', fontFamily:"'DM Mono',monospace" }}>
              {doneCount}/{visibleTabs.length} tabs ready
            </div>
          )}
          <a href="/" style={{ fontSize:13, color:'#8892A4', textDecoration:'none' }}>← New study</a>
        </div>
      </nav>

      {/* INITIAL LOADING */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'85vh', gap:20 }}>
          <div style={{ width:40, height:40, border:'2.5px solid rgba(255,255,255,0.08)', borderTopColor:'#C9973A', borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
          <div style={{ fontSize:16, fontWeight:500, color:'#F5F0E8' }}>Starting your research dossier…</div>
          <div style={{ fontSize:13, color:'#8892A4' }}>Tailored for: {roles.map(r => ROLE_LABELS[r]).filter(Boolean).join(' + ')}</div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ maxWidth:600, margin:'80px auto', padding:'0 24px' }}>
          <div style={{ background:'rgba(139,26,26,0.15)', border:'1px solid rgba(139,26,26,0.3)', borderRadius:12, padding:'24px 28px' }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Something went wrong</div>
            <div style={{ fontSize:13, color:'#8892A4', marginBottom:16 }}>{error}</div>
            <a href="/" style={{ fontSize:13, color:'#C9973A', textDecoration:'none' }}>← Try again</a>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {!loading && !error && visibleTabs.length > 0 && (
        <div style={{ maxWidth:880, margin:'0 auto', padding:'32px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:'#F5F0E8', marginBottom:6 }}>{passage}</div>
            {overviewData?.overview?.author && (
              <div style={{ fontSize:13, color:'#8892A4', marginBottom:20, fontFamily:"'DM Mono',monospace" }}>
                {overviewData.overview.author} · {overviewData.overview.date}
              </div>
            )}
            {overviewData?.overview?.main_idea ? (
              <div style={{ background:'linear-gradient(135deg,rgba(201,151,58,0.1),rgba(201,151,58,0.04))', border:'1px solid rgba(201,151,58,0.2)', borderRadius:12, padding:'18px 22px', animation:'fadeIn 0.5s ease' }}>
                <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>Big Idea</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'#F5F0E8', fontStyle:'italic', lineHeight:1.65 }}>{overviewData.overview.main_idea}</div>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'18px 22px', animation:'pulse 1.5s ease infinite' }}>
                <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>Big Idea</div>
                <div style={{ height:20, background:'rgba(255,255,255,0.06)', borderRadius:4, width:'70%' }} />
              </div>
            )}
          </div>

          {/* TABS */}
          <div className="tab-bar" style={{ overflowX:'auto', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:32, scrollbarWidth:'none' }}>
            <div style={{ display:'flex', whiteSpace:'nowrap' }}>
              {visibleTabs.map(tabId => {
                const tabInfo = ALL_TABS.find(t => t.id === tabId)
                const state = tabStates[tabId]?.state || 'pending'
                const isActive = activeTab === tabId
                const isDone = state === 'done'
                const isGenerating = state === 'generating'

                return (
                  <button
                    key={tabId}
                    onClick={() => isDone && setActiveTab(tabId)}
                    disabled={!isDone}
                    style={{
                      padding:'10px 14px', fontSize:12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#C9973A' : isDone ? '#8892A4' : 'rgba(136,146,164,0.35)',
                      background:'none', border:'none',
                      borderBottom:`2px solid ${isActive ? '#C9973A' : 'transparent'}`,
                      marginBottom:-1, cursor: isDone ? 'pointer' : 'not-allowed',
                      fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
                      display:'flex', alignItems:'center', gap:6,
                      transition:'color 0.2s',
                    }}
                  >
                    {tabInfo?.label}
                    {isGenerating && (
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#C9973A', display:'inline-block', animation:'pulse 0.8s ease infinite' }} />
                    )}
                    {isDone && !isActive && (
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'rgba(29,158,117,0.8)', display:'inline-block' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* TAB CONTENT */}
          {activeTab && tabStates[activeTab] && (
            <div style={{ animation:'fadeIn 0.3s ease' }}>
              {tabStates[activeTab].state === 'done' ? (
                <TabContent
                  tab={activeTab}
                  data={tabStates[activeTab].data}
                  bibleText={bibleText}
                  bibleVersion={bibleVersion}
                  setBibleVersion={setBibleVersion}
                />
              ) : (
                <TabSkeleton />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabSkeleton() {
  return (
    <div style={{ animation:'pulse 1.5s ease infinite' }}>
      {[100, 70, 85, 60, 90].map((w, i) => (
        <div key={i} style={{ height:14, background:'rgba(255,255,255,0.06)', borderRadius:4, width:`${w}%`, marginBottom:14 }} />
      ))}
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:'1.75rem' }}>
      <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:10 }}>{title}</div>
      {children}
    </div>
  )
}
function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:14, color:'#F5F0E8', lineHeight:1.85, margin:0 }}>{children}</p>
}
function InfoBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div style={{ borderLeft:'2px solid rgba(201,151,58,0.25)', paddingLeft:16, marginBottom:22 }}>
      <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>{label}</div>
      <Body>{text}</Body>
    </div>
  )
}
function Highlight({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div style={{ background:'linear-gradient(135deg,rgba(201,151,58,0.08),rgba(201,151,58,0.03))', border:'1px solid rgba(201,151,58,0.18)', borderRadius:10, padding:'14px 18px', marginBottom:18 }}>
      <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'#F5F0E8', fontStyle:'italic', lineHeight:1.65 }}>{text}</div>
    </div>
  )
}
function Pills({ items=[] }: { items?: string[] }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
      {items.map((r,i) => <span key={i} style={{ background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'5px 14px', fontSize:12, color:'#8892A4' }}>{r}</span>)}
    </div>
  )
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, marginBottom:14, ...style }}>{children}</div>
}
function PreachNote({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div style={{ background:'rgba(201,151,58,0.06)', border:'1px solid rgba(201,151,58,0.15)', borderRadius:8, padding:'12px 16px', marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Preaching Note</div>
      <Body>{text}</Body>
    </div>
  )
}

function TabContent({ tab, data, bibleText, bibleVersion, setBibleVersion }: any) {
  if (!data) return <TabSkeleton />

  if (tab === 'overview') {
    const o = data.overview || {}
    return (
      <div>
        <Sec title="Summary"><Body>{o.summary}</Body></Sec>
        <Sec title="Author's Purpose"><Body>{o.purpose}</Body></Sec>
        <Sec title="Literary Genre"><Body>{o.literary_genre}</Body></Sec>
        <Sec title="Literary Structure"><Body>{o.literary_structure}</Body></Sec>
        <Sec title="Historical Setting"><Body>{o.setting}</Body></Sec>
        <Sec title="Key Themes">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:8, marginTop:8 }}>
            {(o.themes||[]).map((t:string,i:number) => <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:500, color:'#F5F0E8' }}>{t}</div>)}
          </div>
        </Sec>
        <Sec title="Teaching Opportunities">
          {(o.teaching_opportunities||[]).map((t:string,i:number) => <div key={i} style={{ fontSize:14, color:'#F5F0E8', padding:'5px 0', lineHeight:1.7 }}>→ {t}</div>)}
        </Sec>
      </div>
    )
  }

  if (tab === 'scripture') {
    const sc = data.scripture || {}
    const bt = bibleText || {}
    const versions = ['kjv','web','asv','ylt']
    const labels: Record<string,string> = { kjv:'KJV', web:'WEB', asv:'ASV', ylt:'YLT' }
    return (
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {versions.map(v => (
            <button key={v} onClick={() => setBibleVersion(v)} style={{ padding:'6px 18px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background:bibleVersion===v?'#C9973A':'none', color:bibleVersion===v?'#0D1117':'#8892A4', border:bibleVersion===v?'none':'1px solid rgba(255,255,255,0.1)' }}>{labels[v]}</button>
          ))}
        </div>
        {bt[bibleVersion] && (
          <div style={{ fontFamily:'Georgia,serif', fontSize:15, lineHeight:2.2, color:'#F5F0E8', background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 28px', marginBottom:20, whiteSpace:'pre-wrap' }}>{bt[bibleVersion]}</div>
        )}
        <div style={{ fontSize:11, color:'rgba(136,146,164,0.6)', marginBottom:24, fontStyle:'italic' }}>KJV, WEB, ASV, and YLT are public domain translations.</div>
        <Highlight label="Key Verse" text={sc.key_verse} />
        {(sc.verse_by_verse||[]).length > 0 && (
          <Sec title="Verse-by-Verse Exegetical Notes">
            {sc.verse_by_verse.map((v:any,i:number) => (
              <div key={i} style={{ borderBottom:'0.5px solid rgba(255,255,255,0.06)', paddingBottom:18, marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#C9973A', fontFamily:"'DM Mono',monospace", marginBottom:7 }}>{v.verse}</div>
                <Body>{v.notes}</Body>
              </div>
            ))}
          </Sec>
        )}
      </div>
    )
  }

  if (tab === 'language') {
    return (
      <div>
        {(data.language||[]).map((w:any,i:number) => (
          <Card key={i}>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:14, flexWrap:'wrap' }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:'#C9973A', fontWeight:600 }}>{w.word}</span>
              <span style={{ fontSize:13, color:'#8892A4', fontStyle:'italic' }}>{w.transliteration}</span>
              <span style={{ fontSize:11, color:'#8892A4', background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'2px 8px', fontFamily:"'DM Mono',monospace" }}>{w.strongs}</span>
              {w.pos && <span style={{ fontSize:11, color:'#C9973A', background:'rgba(201,151,58,0.08)', border:'1px solid rgba(201,151,58,0.2)', borderRadius:4, padding:'2px 8px', fontFamily:"'DM Mono',monospace" }}>{w.pos}</span>}
            </div>
            {w.parsing && <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:'#8892A4', marginBottom:12, background:'rgba(255,255,255,0.03)', padding:'4px 10px', borderRadius:4, display:'inline-block' }}>{w.parsing}</div>}
            <InfoBlock label="Definition" text={w.definition} />
            <InfoBlock label="Usage Across Scripture" text={w.usage} />
            {w.cognates && <InfoBlock label="Cognate Words" text={w.cognates} />}
            <PreachNote text={w.preaching_note} />
          </Card>
        ))}
      </div>
    )
  }

  if (tab === 'history') {
    const h = data.history || {}
    return (
      <div>
        <InfoBlock label="Political Environment" text={h.political} />
        <InfoBlock label="Religious Climate" text={h.religious} />
        <InfoBlock label="Economic Conditions" text={h.economic} />
        <InfoBlock label="Social Customs" text={h.social} />
        <InfoBlock label="Geography" text={h.geographical} />
        <InfoBlock label="What the Original Audience Understood" text={h.original_audience} />
        <InfoBlock label="Modern Blind Spots" text={h.blind_spots} />
        <InfoBlock label="Jewish Background" text={h.jewish_background} />
        <InfoBlock label="Greco-Roman Context" text={h.greco_roman} />
        <InfoBlock label="Marriage & Family Customs" text={h.marriage_family} />
        <InfoBlock label="Intertestamental Background" text={h.intertestamental} />
      </div>
    )
  }

  if (tab === 'archaeology') {
    return (
      <div>
        {(data.archaeology||[]).map((a:any,i:number) => (
          <Card key={i}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:600, color:'#F5F0E8', marginBottom:4 }}>{a.discovery}</div>
            <div style={{ fontSize:11, color:'#8892A4', fontFamily:"'DM Mono',monospace", marginBottom:16 }}>{a.location} · Found: {a.date_found}</div>
            <InfoBlock label="Relevance to Passage" text={a.relevance} />
            <InfoBlock label="Archaeological Details" text={a.details} />
            <PreachNote text={a.significance} />
          </Card>
        ))}
      </div>
    )
  }

  if (tab === 'theology') {
    const t = data.theology || {}
    return (
      <div>
        <InfoBlock label="God — What This Reveals" text={t.god} />
        <InfoBlock label="Christology" text={t.christ} />
        <InfoBlock label="Holy Spirit" text={t.holy_spirit} />
        <InfoBlock label="Salvation" text={t.salvation} />
        <InfoBlock label="Humanity" text={t.humanity} />
        <InfoBlock label="Kingdom of God" text={t.kingdom} />
        <InfoBlock label="Covenant" text={t.covenant} />
        <InfoBlock label="Church & Community" text={t.church} />
        <InfoBlock label="Eschatology" text={t.eschatology} />
        <InfoBlock label="Biblical Theology Arc" text={t.biblical_theology} />
        <InfoBlock label="Systematic Connections" text={t.systematic_connections} />
        <InfoBlock label="Practical Theology" text={t.practical_theology} />
        {(t.doctrinal_issues||[]).length > 0 && (
          <Sec title="Doctrinal Issues">
            {t.doctrinal_issues.map((d:string,i:number) => <div key={i} style={{ fontSize:14, color:'#F5F0E8', padding:'6px 0', lineHeight:1.7 }}>→ {d}</div>)}
          </Sec>
        )}
      </div>
    )
  }

  if (tab === 'crossref') {
    const cr = data.crossrefs || {}
    return (
      <div>
        <Sec title="Direct References"><Pills items={cr.direct} /></Sec>
        <Sec title="Prophetic Connections"><Pills items={cr.prophetic} /></Sec>
        <Sec title="Typological Connections"><Pills items={cr.typological} /></Sec>
        <Sec title="Thematic Parallels"><Pills items={cr.thematic} /></Sec>
        <Sec title="Parallel Passages"><Pills items={cr.parallel_passages} /></Sec>
        <InfoBlock label="Old Testament Backdrop" text={cr.ot_backdrop} />
        <InfoBlock label="NT Development" text={cr.nt_development} />
      </div>
    )
  }

  if (tab === 'christ') {
    const c = data.christ || {}
    return (
      <div>
        <Highlight label="Christological Title" text={c.title} />
        <InfoBlock label="Christ's Presence in This Text" text={c.presence} />
        <InfoBlock label="Foreshadowing" text={c.foreshadowing} />
        <InfoBlock label="Fulfillment" text={c.fulfillment} />
        <InfoBlock label="Gospel Thread" text={c.gospel_thread} />
        <InfoBlock label="Redemptive-Historical Location" text={c.redemptive_historical} />
        <PreachNote text={c.christocentric_preaching} />
      </div>
    )
  }

  if (tab === 'commentary') {
    const c = data.commentary || {}
    return (
      <div>
        <InfoBlock label="Matthew Henry" text={c.matthew_henry} />
        <InfoBlock label="Spurgeon" text={c.spurgeon} />
        <InfoBlock label="Calvin" text={c.calvin} />
        <InfoBlock label="Augustine" text={c.augustine} />
        <InfoBlock label="Luther" text={c.luther} />
        <InfoBlock label="Modern Reformed" text={c.modern_reformed} />
        <InfoBlock label="Modern Evangelical Scholarship" text={c.modern_evangelical} />
        <InfoBlock label="Where Commentators Agree" text={c.areas_of_agreement} />
        <InfoBlock label="Where Commentators Disagree" text={c.areas_of_debate} />
        <Highlight label="Best Insight from the Commentary Tradition" text={c.best_insight} />
      </div>
    )
  }

  if (tab === 'fathers') {
    return (
      <div>
        <div style={{ fontSize:13, color:'#8892A4', marginBottom:20, lineHeight:1.7 }}>What the early church said about this passage.</div>
        {(data.church_fathers||[]).map((f:any,i:number) => (
          <Card key={i}>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:'#F5F0E8' }}>{f.father}</span>
              <span style={{ fontSize:11, color:'#8892A4', fontFamily:"'DM Mono',monospace" }}>{f.dates}</span>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:'#F5F0E8', fontStyle:'italic', lineHeight:1.85, borderLeft:'3px solid rgba(201,151,58,0.4)', paddingLeft:14, marginBottom:12 }}>"{f.quote}"</div>
            <Body>{f.context}</Body>
          </Card>
        ))}
      </div>
    )
  }

  if (tab === 'quotes') {
    return (
      <div>
        {(data.quotes||[]).map((q:any,i:number) => (
          <div key={i} style={{ borderBottom:'0.5px solid rgba(255,255,255,0.06)', paddingBottom:20, marginBottom:20 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'#F5F0E8', fontStyle:'italic', lineHeight:1.85, marginBottom:10 }}>"{q.quote}"</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#C9973A' }}>— {q.author}</span>
              <span style={{ fontSize:12, color:'#8892A4', fontStyle:'italic' }}>{q.source}</span>
            </div>
            <div style={{ fontSize:12, color:'#8892A4', lineHeight:1.6 }}>{q.relevance}</div>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'books') {
    const lc: Record<string,string> = { Beginner:'#1D9E75', Intermediate:'#C9973A', Advanced:'#B22222', Scholar:'#534AB7' }
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG || 'passagelab-20'
    return (
      <div>
        <div style={{ fontSize:13, color:'#8892A4', marginBottom:20, lineHeight:1.7 }}>Curated resources for deeper study. Links open Amazon search.</div>
        {(data.books||[]).map((b:any,i:number) => (
          <Card key={i} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <div style={{ width:4, flexShrink:0, alignSelf:'stretch', borderRadius:2, background:lc[b.level]||'#C9973A' }} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <div>
                  <a href={`https://www.amazon.com/s?k=${encodeURIComponent(b.title+' '+b.author)}&tag=${tag}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#C9973A', textDecoration:'none', marginBottom:2, display:'block' }}>{b.title} ↗</a>
                  <div style={{ fontSize:12, color:'#8892A4' }}>{b.author}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'#C9973A', background:'rgba(201,151,58,0.1)', border:'1px solid rgba(201,151,58,0.2)', borderRadius:4, padding:'2px 8px' }}>{b.type}</span>
                  <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:lc[b.level]||'#C9973A', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'2px 8px' }}>{b.level}</span>
                </div>
              </div>
              <Body>{b.description}</Body>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (tab === 'illustrations') {
    return (
      <div>
        {(data.illustrations||[]).map((il:any,i:number) => (
          <div key={i} style={{ borderLeft:'3px solid #C9973A', borderRadius:'0 12px 12px 0', background:'rgba(255,255,255,0.03)', padding:'18px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, fontWeight:600, color:'#C9973A', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'1px', background:'rgba(201,151,58,0.1)', borderRadius:4, padding:'3px 10px' }}>{il.category}</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#F5F0E8' }}>{il.title}</span>
            </div>
            <p style={{ fontSize:14, color:'#F5F0E8', lineHeight:1.9, fontStyle:'italic', marginBottom:14 }}>{il.content}</p>
            <div style={{ background:'rgba(201,151,58,0.06)', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5 }}>Bridge to Passage</div>
              <Body>{il.bridge}</Body>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'news') {
    return (
      <div>
        {(data.news||[]).map((n:any,i:number) => (
          <Card key={i}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:600, color:'#C9973A', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'1px', background:'rgba(201,151,58,0.1)', borderRadius:4, padding:'3px 10px' }}>{n.type}</span>
              {n.date && <span style={{ fontSize:11, color:'#8892A4', fontFamily:"'DM Mono',monospace" }}>{n.date}</span>}
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:'#F5F0E8', marginBottom:4, lineHeight:1.5 }}>{n.headline}</div>
            <div style={{ fontSize:11, color:'#8892A4', fontFamily:"'DM Mono',monospace", marginBottom:14 }}>{n.source}</div>
            <InfoBlock label="Why This Matters for Preaching" text={n.relevance} />
            <Body>{n.summary}</Body>
          </Card>
        ))}
      </div>
    )
  }

  if (tab === 'outline') {
    const ol = data.outline || {}
    return (
      <div>
        <Highlight label="Sermon Title" text={ol.title} />
        <Highlight label="Big Idea" text={ol.big_idea} />
        <InfoBlock label="Introduction" text={ol.introduction} />
        {(ol.points||[]).map((p:any,i:number) => (
          <div key={i} style={{ display:'flex', gap:16, padding:'18px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'rgba(201,151,58,0.4)', minWidth:28, lineHeight:1.2 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'#F5F0E8', marginBottom:10 }}>{p.point}</div>
              {(p.subpoints||[]).map((sp:string,j:number) => <div key={j} style={{ fontSize:13, color:'#8892A4', lineHeight:1.75, paddingLeft:14, marginBottom:5 }}>· {sp}</div>)}
              {p.illustration && <div style={{ marginTop:12, background:'rgba(201,151,58,0.05)', borderRadius:8, padding:'10px 14px' }}><div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5 }}>Illustration</div><Body>{p.illustration}</Body></div>}
              {p.application && <div style={{ marginTop:10 }}><div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5 }}>Application</div><Body>{p.application}</Body></div>}
            </div>
          </div>
        ))}
        <div style={{ marginTop:24 }}>
          <InfoBlock label="Conclusion" text={ol.conclusion} />
          <InfoBlock label="Invitation" text={ol.invitation} />
        </div>
        <Sec title="Alternative Structures">
          {(ol.alternative_structures||[]).map((a:string,i:number) => <div key={i} style={{ fontSize:14, color:'#F5F0E8', padding:'7px 0', lineHeight:1.7, borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>→ {a}</div>)}
        </Sec>
      </div>
    )
  }

  if (tab === 'manuscript') {
    const m = data.manuscript || {}
    return (
      <div>
        {[['Introduction',m.intro],['Body',m.body],['Conclusion',m.conclusion]].map(([label,text]) => (
          <div key={label as string} style={{ marginBottom:32 }}>
            <div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:14 }}>{label}</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:15, lineHeight:2.2, color:'#F5F0E8', background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 28px' }}>{text}</div>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'smallgroup') {
    const sg = data.smallgroup || {}
    return (
      <div>
        <Highlight label="Icebreaker" text={sg.icebreaker} />
        {sg.context_setter && <InfoBlock label="Context Setter" text={sg.context_setter} />}
        <Sec title="Discussion Questions">
          {(sg.questions||[]).map((q:any,i:number) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 18px', marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:600, color:'#C9973A', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'1px', marginBottom:7 }}>{q.type}</div>
              <Body>{q.question}</Body>
            </div>
          ))}
        </Sec>
        <InfoBlock label="Group Activity" text={sg.activity} />
        {(sg.deeper_study||[]).length > 0 && <Sec title="For Deeper Study">{sg.deeper_study.map((d:string,i:number) => <div key={i} style={{ fontSize:14, color:'#F5F0E8', padding:'5px 0', lineHeight:1.7 }}>→ {d}</div>)}</Sec>}
        <Highlight label="Key Takeaway" text={sg.takeaway} />
      </div>
    )
  }

  if (tab === 'youth') {
    const y = data.youth || {}
    return (
      <div>
        <Highlight label="The Big Truth" text={y.big_truth} />
        <InfoBlock label="Cultural Hook" text={y.cultural_hook} />
        <InfoBlock label="Memory Verse" text={y.memory_verse} />
        {y.game && <Card><div style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'#C9973A', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Opening Game</div><Body>{y.game}</Body></Card>}
        {y.object_lesson && <Card><div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Object Lesson: {y.object_lesson.object}</div><Body>{y.object_lesson.lesson}</Body></Card>}
        <Sec title="Discussion Questions">{(y.discussion_questions||[]).map((q:string,i:number) => <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 16px', marginBottom:8 }}><Body>{q}</Body></div>)}</Sec>
        <InfoBlock label="Weekly Challenge" text={y.challenge} />
      </div>
    )
  }

  if (tab === 'children') {
    const ch = data.children || {}
    return (
      <div>
        <Highlight label="The Big Truth (Ages 6–10)" text={ch.big_truth} />
        <InfoBlock label="Memory Verse" text={ch.memory_verse} />
        {ch.story_retelling && <Sec title="Story Retelling"><div style={{ fontFamily:'Georgia,serif', fontSize:15, lineHeight:2.1, color:'#F5F0E8', fontStyle:'italic' }}>{ch.story_retelling}</div></Sec>}
        {ch.object_lesson && <Card><div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Object Lesson: {ch.object_lesson.object}</div><Body>{ch.object_lesson.lesson}</Body></Card>}
        <InfoBlock label="Craft Idea" text={ch.craft_idea} />
        <InfoBlock label="Activity / Game" text={ch.activity} />
        <InfoBlock label="Snack Idea" text={ch.snack_idea} />
        {(ch.discussion_questions||[]).length > 0 && <Sec title="Discussion Questions">{ch.discussion_questions.map((q:string,i:number) => <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 16px', marginBottom:8 }}><Body>{q}</Body></div>)}</Sec>}
        <Highlight label="Parent Connection" text={ch.parent_connection} />
      </div>
    )
  }

  return null
}
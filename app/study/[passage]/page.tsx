'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'language', label: 'Language' },
  { id: 'history', label: 'Historical' },
  { id: 'archaeology', label: 'Archaeology' },
  { id: 'theology', label: 'Theology' },
  { id: 'crossref', label: 'Cross-refs' },
  { id: 'christ', label: 'Christ' },
  { id: 'commentary', label: 'Commentary' },
  { id: 'illustrations', label: 'Illustrations' },
  { id: 'news', label: 'News & Research' },
  { id: 'outline', label: 'Outline' },
  { id: 'manuscript', label: 'Manuscript' },
  { id: 'smallgroup', label: 'Small Group' },
  { id: 'children', label: 'Children' },
]

export default function StudyPage() {
  const params = useParams()
  const passage = decodeURIComponent(params.passage as string)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [bibleVersion, setBibleVersion] = useState('esv')

  useEffect(() => {
    async function fetchStudy() {
      try {
        const res = await fetch('/api/study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passage }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to generate study')
        setData(json.study)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStudy()
  }, [passage])

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#F5F0E8', textDecoration: 'none' }}>
          Passage<span style={{ color: '#C9973A' }}>Lab</span>
        </a>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#F5F0E8', fontStyle: 'italic' }}>
          {passage}
        </div>
        <a href="/" style={{ fontSize: 13, color: '#8892A4', textDecoration: 'none' }}>← New study</a>
      </nav>

      {/* LOADING */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 20 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: '2.5px solid rgba(255,255,255,0.1)', borderTopColor: '#C9973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 500, color: '#F5F0E8' }}>Assembling your research dossier…</div>
          <div style={{ fontSize: 13, color: '#8892A4', textAlign: 'center', maxWidth: 400 }}>
            Analyzing original languages · Historical context · Archaeology · Theology · Illustrations · Commentary
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px' }}>
          <div style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.4)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: '#8892A4' }}>{error}</div>
            <a href="/" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#C9973A' }}>← Try again</a>
          </div>
        </div>
      )}

      {/* STUDY CONTENT */}
      {data && !loading && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

          {/* Passage title + big idea */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#F5F0E8', marginBottom: 8 }}>{data.passage}</div>
            {data.overview?.author && (
              <div style={{ fontSize: 13, color: '#8892A4', marginBottom: 20 }}>
                {data.overview.author} · {data.overview.audience} · {data.overview.date}
              </div>
            )}
            {data.overview?.main_idea && (
              <div style={{ background: 'linear-gradient(135deg, rgba(201,151,58,0.12), rgba(201,151,58,0.05))', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>Big Idea</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#F5F0E8', fontStyle: 'italic', lineHeight: 1.65 }}>{data.overview.main_idea}</div>
              </div>
            )}
          </div>

          {/* TAB BAR */}
          <div style={{ overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 32 }}>
            <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '10px 14px', fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? '#C9973A' : '#8892A4',
                  background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#C9973A' : 'transparent'}`,
                  marginBottom: -1, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap'
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT */}
          <TabContent tab={activeTab} data={data} bibleVersion={bibleVersion} setBibleVersion={setBibleVersion} />
        </div>
      )}
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function InfoBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div style={{ borderLeft: '2px solid rgba(201,151,58,0.3)', paddingLeft: 16, marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{text}</div>
    </div>
  )
}

function Highlight({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(201,151,58,0.1), rgba(201,151,58,0.04))', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F5F0E8', fontStyle: 'italic', lineHeight: 1.65 }}>{text}</div>
    </div>
  )
}

function Pills({ items = [] }: { items?: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {items.map((r, i) => (
        <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#8892A4' }}>{r}</span>
      ))}
    </div>
  )
}

function TabContent({ tab, data, bibleVersion, setBibleVersion }: any) {
  if (tab === 'overview') {
    const o = data.overview || {}
    return (
      <div>
        <Sec title="Summary"><p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{o.summary}</p></Sec>
        <Sec title="Author's Purpose"><p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{o.purpose}</p></Sec>
        <Sec title="Literary Genre"><p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{o.literary_genre}</p></Sec>
        <Sec title="Historical Setting"><p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{o.setting}</p></Sec>
        <Sec title="Key Themes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 8 }}>
            {(o.themes || []).map((t: string, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>{t}</div>
            ))}
          </div>
        </Sec>
        <Sec title="Teaching Opportunities">
          {(o.teaching_opportunities || []).map((t: string, i: number) => (
            <div key={i} style={{ fontSize: 14, color: '#F5F0E8', padding: '6px 0', lineHeight: 1.7 }}>→ {t}</div>
          ))}
        </Sec>
      </div>
    )
  }

  if (tab === 'scripture') {
    const sc = data.scripture || {}
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['esv', 'niv'].map(v => (
            <button key={v} onClick={() => setBibleVersion(v)} style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              background: bibleVersion === v ? '#C9973A' : 'none',
              color: bibleVersion === v ? '#0D1117' : '#8892A4',
              border: bibleVersion === v ? 'none' : '1px solid rgba(255,255,255,0.12)',
            }}>{v.toUpperCase()}</button>
          ))}
        </div>
        {sc[bibleVersion] && (
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 2.1, color: '#F5F0E8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
            {sc[bibleVersion]}
          </div>
        )}
        <Highlight label="Key Verse" text={sc.key_verse} />
        {(sc.verse_by_verse || []).length > 0 && (
          <Sec title="Verse-by-Verse Exegetical Notes">
            {sc.verse_by_verse.map((v: any, i: number) => (
              <div key={i} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9973A', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{v.verse}</div>
                <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{v.notes}</div>
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
        {(data.language || []).map((w: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#C9973A', fontWeight: 700 }}>{w.word}</span>
              <span style={{ fontSize: 13, color: '#8892A4', fontStyle: 'italic' }}>{w.transliteration}</span>
              <span style={{ fontSize: 11, color: '#8892A4', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono', monospace" }}>{w.strongs}</span>
            </div>
            <InfoBlock label="Definition" text={w.definition} />
            <InfoBlock label="Usage Across Scripture" text={w.usage} />
            <div style={{ background: 'rgba(201,151,58,0.07)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Preaching Note</div>
              <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{w.preaching_note}</div>
            </div>
          </div>
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
        <InfoBlock label="Social Customs & Dynamics" text={h.social} />
        <InfoBlock label="Geography" text={h.geographical} />
        <InfoBlock label="What the Original Audience Understood" text={h.original_audience} />
        <InfoBlock label="Modern Blind Spots" text={h.blind_spots} />
        <InfoBlock label="Jewish Background" text={h.jewish_background} />
        <InfoBlock label="Greco-Roman Context" text={h.greco_roman} />
      </div>
    )
  }

  if (tab === 'archaeology') {
    return (
      <div>
        {(data.archaeology || []).map((a: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: '#F5F0E8', marginBottom: 4 }}>{a.discovery}</div>
            <div style={{ fontSize: 12, color: '#8892A4', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>{a.location} · Found: {a.date_found}</div>
            <InfoBlock label="Relevance to Passage" text={a.relevance} />
            <InfoBlock label="Details" text={a.details} />
            <div style={{ background: 'rgba(201,151,58,0.07)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Why This Matters for Preachers</div>
              <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{a.significance}</div>
            </div>
          </div>
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
        <InfoBlock label="Humanity & Human Nature" text={t.humanity} />
        <InfoBlock label="Kingdom of God" text={t.kingdom} />
        <InfoBlock label="Covenant" text={t.covenant} />
        <InfoBlock label="Biblical Theology Arc" text={t.biblical_theology} />
        <InfoBlock label="Systematic Connections" text={t.systematic_connections} />
        {(t.doctrinal_issues || []).length > 0 && (
          <Sec title="Doctrinal Issues">
            {t.doctrinal_issues.map((d: string, i: number) => (
              <div key={i} style={{ fontSize: 14, color: '#F5F0E8', padding: '6px 0', lineHeight: 1.7 }}>→ {d}</div>
            ))}
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
        <InfoBlock label="OT ↔ NT Connection" text={cr.nt_connection} />
        <InfoBlock label="Old Testament Backdrop" text={cr.ot_backdrop} />
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
        <div style={{ background: 'rgba(201,151,58,0.07)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>How to Preach Christ from This Text</div>
          <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{c.christocentric_preaching}</div>
        </div>
      </div>
    )
  }

  if (tab === 'commentary') {
    const c = data.commentary || {}
    return (
      <div>
        <InfoBlock label="Spurgeon / 19th Century" text={c.spurgeon} />
        <InfoBlock label="Matthew Henry" text={c.matthew_henry} />
        <InfoBlock label="Calvin" text={c.calvin} />
        <InfoBlock label="Modern Evangelical Scholarship" text={c.modern_evangelical} />
        <InfoBlock label="Where Commentators Agree" text={c.areas_of_agreement} />
        <InfoBlock label="Where Commentators Disagree" text={c.areas_of_debate} />
        <Highlight label="Best Insight from the Commentary Tradition" text={c.best_insight} />
      </div>
    )
  }

  if (tab === 'illustrations') {
    return (
      <div>
        {(data.illustrations || []).map((il: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #C9973A', borderRadius: '0 12px 12px 0', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C9973A', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(201,151,58,0.12)', borderRadius: 4, padding: '3px 10px' }}>{il.category}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8' }}>{il.title}</span>
            </div>
            <p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.85, fontStyle: 'italic', marginBottom: 12 }}>{il.content}</p>
            <div style={{ background: 'rgba(201,151,58,0.07)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>Bridge to Passage</div>
              <div style={{ fontSize: 13, color: '#F5F0E8', lineHeight: 1.7 }}>{il.bridge}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'news') {
    return (
      <div>
        <div style={{ fontSize: 12, color: '#8892A4', marginBottom: 20, fontFamily: "'DM Mono', monospace" }}>Representative findings and cultural connections relevant to this passage</div>
        {(data.news || []).map((n: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#C9973A', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(201,151,58,0.12)', borderRadius: 4, padding: '3px 10px', display: 'inline-block', marginBottom: 10 }}>{n.type}</span>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#F5F0E8', marginBottom: 4, lineHeight: 1.5 }}>{n.headline}</div>
            <div style={{ fontSize: 11, color: '#8892A4', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>{n.source}</div>
            <InfoBlock label="Why This Matters for Preaching" text={n.relevance} />
            <p style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{n.summary}</p>
          </div>
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
        {(ol.points || []).map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: 'rgba(201,151,58,0.5)', minWidth: 28, lineHeight: 1.2 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', marginBottom: 8 }}>{p.point}</div>
              {(p.subpoints || []).map((sp: string, j: number) => (
                <div key={j} style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, paddingLeft: 12, marginBottom: 4 }}>· {sp}</div>
              ))}
              {p.illustration && <div style={{ marginTop: 10 }}><InfoBlock label="Illustration" text={p.illustration} /></div>}
              {p.application && <div><InfoBlock label="Application" text={p.application} /></div>}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 24 }}>
          <InfoBlock label="Conclusion" text={ol.conclusion} />
          <InfoBlock label="Invitation" text={ol.invitation} />
        </div>
        <Sec title="Alternative Sermon Structures">
          {(ol.alternative_structures || []).map((a: string, i: number) => (
            <div key={i} style={{ fontSize: 14, color: '#F5F0E8', padding: '6px 0', lineHeight: 1.7 }}>→ {a}</div>
          ))}
        </Sec>
      </div>
    )
  }

  if (tab === 'manuscript') {
    const m = data.manuscript || {}
    return (
      <div>
        {[['Introduction', m.intro], ['Body', m.body], ['Conclusion', m.conclusion]].map(([label, text]) => (
          <div key={label} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#C9973A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>{label}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 2.1, color: '#F5F0E8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px 28px' }}>{text}</div>
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
        <Sec title="Discussion Questions">
          {(sg.questions || []).map((q: any, i: number) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C9973A', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{q.type}</div>
              <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.75 }}>{q.question}</div>
            </div>
          ))}
        </Sec>
        <InfoBlock label="Group Activity" text={sg.activity} />
        <Highlight label="Key Takeaway" text={sg.takeaway} />
      </div>
    )
  }

  if (tab === 'children') {
    const ch = data.children || {}
    return (
      <div>
        <Highlight label="The Big Truth (Ages 6-10)" text={ch.big_truth} />
        <InfoBlock label="Memory Verse" text={ch.memory_verse} />
        {ch.story_retelling && (
          <Sec title="Story Retelling">
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 2, color: '#F5F0E8', fontStyle: 'italic' }}>{ch.story_retelling}</div>
          </Sec>
        )}
        {ch.object_lesson && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#F5F0E8', marginBottom: 8 }}>Object Lesson: {ch.object_lesson.object}</div>
            <div style={{ fontSize: 14, color: '#F5F0E8', lineHeight: 1.8 }}>{ch.object_lesson.lesson}</div>
          </div>
        )}
        <InfoBlock label="Craft Idea" text={ch.craft_idea} />
        <InfoBlock label="Activity / Game" text={ch.activity} />
        {(ch.discussion_questions || []).length > 0 && (
          <Sec title="Discussion Questions">
            {ch.discussion_questions.map((q: string, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, fontSize: 14, color: '#F5F0E8', lineHeight: 1.7 }}>{q}</div>
            ))}
          </Sec>
        )}
        <Highlight label="Parent Connection" text={ch.parent_connection} />
      </div>
    )
  }

  return null
}

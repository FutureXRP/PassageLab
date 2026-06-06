'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = ['John 3:16', 'Romans 8:1-11', 'Psalm 23', 'Genesis 22:1-14', 'Isaiah 53']

const ROLES = [
  {
    id: 'pastor',
    label: 'Pastor / Preacher',
    icon: '✝️',
    desc: 'Sermon prep, manuscript, illustrations, outline',
  },
  {
    id: 'theologian',
    label: 'Theologian / Scholar',
    icon: '📚',
    desc: 'Deep exegesis, church fathers, books, language',
  },
  {
    id: 'teacher',
    label: 'Bible Teacher',
    icon: '🎓',
    desc: 'Lesson outline, commentary, application',
  },
  {
    id: 'smallgroup',
    label: 'Small Group Leader',
    icon: '👥',
    desc: 'Discussion questions, icebreaker, activity',
  },
  {
    id: 'youth',
    label: 'Youth Worker',
    icon: '⚡',
    desc: 'Teen-focused content, games, challenges',
  },
  {
    id: 'children',
    label: "Children's Worker",
    icon: '🌟',
    desc: 'Story, object lesson, craft, parent connection',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [passage, setPassage] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['pastor'])
  const [email, setEmail] = useState('')
  const [waitlistMsg, setWaitlistMsg] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function toggleRole(id: string) {
    setSelectedRoles(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev // always keep at least one
        return prev.filter(r => r !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id] // replace oldest, keep max 2
      }
      return [...prev, id]
    })
  }

  function handleStudy(e: React.FormEvent) {
    e.preventDefault()
    if (!passage.trim()) return
    const roles = selectedRoles.join(',')
    router.push(`/study/${encodeURIComponent(passage.trim())}?roles=${roles}`)
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setWaitlistLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setWaitlistMsg(data.message || data.error || 'Done!')
      setEmail('')
    } catch {
      setWaitlistMsg('Something went wrong. Try again.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F5F0E8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .reveal { opacity:0; transform:translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .anim1 { animation: fadeUp 0.6s ease both; }
        .anim2 { animation: fadeUp 0.6s 0.1s ease both; }
        .anim3 { animation: fadeUp 0.6s 0.2s ease both; }
        .anim4 { animation: fadeUp 0.6s 0.3s ease both; }
        .anim5 { animation: fadeUp 0.6s 0.4s ease both; }
        .role-card { cursor:pointer; transition: all 0.2s; }
        .role-card:hover { border-color: rgba(201,151,58,0.5) !important; transform: translateY(-2px); }
        a { text-decoration: none; }
        * { box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64, background:'rgba(13,17,23,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#F5F0E8' }}>
          Passage<span style={{ color:'#C9973A' }}>Lab</span>
        </span>
        <div style={{ display:'flex', gap:32 }}>
          {['#features','#how','#pricing'].map((href,i) => (
            <a key={href} href={href} style={{ fontSize:14, color:'#8892A4' }}>{['Features','How it works','Pricing'][i]}</a>
          ))}
        </div>
        <a href="#waitlist" style={{ background:'#C9973A', color:'#0D1117', fontSize:13, fontWeight:600, padding:'9px 20px', borderRadius:8 }}>Get early access</a>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,151,58,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'80px 80px', pointerEvents:'none' }} />

        <div className="anim1" style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:"'DM Mono',monospace", fontSize:11, color:'#C9973A', letterSpacing:2, textTransform:'uppercase', border:'1px solid rgba(201,151,58,0.25)', borderRadius:100, padding:'6px 16px', marginBottom:32, position:'relative', zIndex:1 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#C9973A', animation:'pulse 2s ease-in-out infinite', display:'inline-block' }} />
          Now in early access
        </div>

        <h1 className="anim2" style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(42px,7vw,84px)', fontWeight:700, lineHeight:1.08, letterSpacing:'-1.5px', color:'#F5F0E8', maxWidth:900, marginBottom:24, position:'relative', zIndex:1 }}>
          The research platform<br />
          <em style={{ color:'#C9973A', fontStyle:'italic' }}>Bible teachers</em><br />
          have been waiting for
        </h1>

        <p className="anim3" style={{ fontSize:'clamp(16px,2vw,20px)', fontWeight:300, color:'#8892A4', maxWidth:580, lineHeight:1.7, marginBottom:40, position:'relative', zIndex:1 }}>
          Enter any passage. Get original languages, historical context, archaeology, theology, commentary, illustrations, and sermon outlines — tailored to your role.
        </p>

        {/* ROLE SELECTOR */}
        <div className="anim3" style={{ width:'100%', maxWidth:680, marginBottom:24, position:'relative', zIndex:1 }}>
          <div style={{ fontSize:12, color:'#8892A4', marginBottom:12, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:1 }}>
            I am a — <span style={{ color:'#C9973A' }}>select up to 2</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {ROLES.map(role => {
              const selected = selectedRoles.includes(role.id)
              return (
                <div
                  key={role.id}
                  className="role-card"
                  onClick={() => toggleRole(role.id)}
                  style={{
                    background: selected ? 'rgba(201,151,58,0.1)' : 'rgba(255,255,255,0.03)',
                    border: selected ? '1px solid rgba(201,151,58,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius:10,
                    padding:'14px 12px',
                    textAlign:'left',
                    position:'relative',
                  }}
                >
                  {selected && (
                    <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:'#C9973A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#0D1117', fontWeight:700 }}>✓</div>
                  )}
                  <div style={{ fontSize:20, marginBottom:6 }}>{role.icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: selected ? '#C9973A' : '#F5F0E8', marginBottom:3 }}>{role.label}</div>
                  <div style={{ fontSize:11, color:'#8892A4', lineHeight:1.5 }}>{role.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SEARCH */}
        <form onSubmit={handleStudy} className="anim4" style={{ display:'flex', gap:10, width:'100%', maxWidth:580, marginBottom:14, position:'relative', zIndex:1 }}>
          <input
            type="text"
            value={passage}
            onChange={e => setPassage(e.target.value)}
            placeholder="Enter a passage — e.g. Romans 8:1-11"
            style={{ flex:1, height:48, borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', padding:'0 16px', fontSize:15, fontFamily:"'Playfair Display',serif", fontStyle:'italic', color:'#F5F0E8', outline:'none' }}
          />
          <button type="submit" style={{ height:48, padding:'0 24px', borderRadius:12, border:'none', background:'#C9973A', color:'#0D1117', fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 24px rgba(201,151,58,0.3)' }}>
            Study ↗
          </button>
        </form>

        <div className="anim5" style={{ fontSize:12, color:'#8892A4', marginBottom:8, position:'relative', zIndex:1 }}>
          Try:{' '}
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setPassage(ex)} style={{ color:'#C9973A', marginRight:12, cursor:'pointer', background:'none', border:'none', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{ex}</button>
          ))}
        </div>

        <p className="anim5" style={{ fontSize:12, color:'#8892A4', position:'relative', zIndex:1 }}>
          <strong style={{ color:'#F5F0E8' }}>Free to start.</strong> No credit card required.
        </p>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding:'40px 24px', textAlign:'center', borderTop:'1px solid rgba(255,255,255,0.08)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#8892A4', textTransform:'uppercase', letterSpacing:2, marginBottom:24 }}>Used by Bible teachers everywhere</div>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'12px 32px' }}>
          {['Lead Pastors','Seminary Students','Small Group Leaders','Sunday School Teachers','Youth Workers','Bible College Professors'].map(r => (
            <span key={r} style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontStyle:'italic', color:'rgba(245,240,232,0.3)' }}>{r}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'100px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div className="reveal" style={{ marginBottom:56 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#C9973A', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>Everything in one place</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(30px,4vw,48px)', fontWeight:700, color:'#F5F0E8', maxWidth:640, lineHeight:1.15, marginBottom:16 }}>
            Every tool a Bible teacher needs — <em style={{ color:'#C9973A' }}>built for your role</em>
          </h2>
          <p style={{ fontSize:17, color:'#8892A4', fontWeight:300, lineHeight:1.7, maxWidth:520 }}>Select your role and PassageLab generates exactly what you need — nothing more, nothing less.</p>
        </div>
        <div className="reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden' }}>
          {[
            { icon:'📜', title:'Original Languages', desc:"Greek and Hebrew word studies with Strong's numbers, semantic range, and preaching insights.", tags:['Greek','Hebrew','Aramaic'] },
            { icon:'🏛️', title:'Archaeology & History', desc:'Real archaeological discoveries and historical context that bring the ancient world alive.', tags:['Excavations','Artifacts','Context'] },
            { icon:'✝️', title:'Christ Connection', desc:'Every passage mapped to Christ — foreshadowing, fulfillment, typology, gospel thread.', tags:['Typology','Gospel','Redemption'] },
            { icon:'📖', title:'Commentary Hub', desc:'Spurgeon, Calvin, Matthew Henry, Augustine, Luther, and modern scholarship synthesized.', tags:['Historical','Reformed','Modern'] },
            { icon:'💡', title:'Illustration Engine', desc:'History, science, culture, church history — vivid illustrations for any message.', tags:['History','Science','Culture'] },
            { icon:'🖊️', title:'Sermon Builder', desc:'Full outlines, 1000-word manuscripts, small group questions, youth and children content.', tags:['Outline','Manuscript','Kids'] },
          ].map(f => (
            <div key={f.title} style={{ background:'#1C2333', padding:'32px 28px' }}>
              <div style={{ fontSize:24, marginBottom:16 }}>{f.icon}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:'#F5F0E8', marginBottom:10 }}>{f.title}</div>
              <div style={{ fontSize:14, color:'#8892A4', lineHeight:1.7, fontWeight:300, marginBottom:16 }}>{f.desc}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {f.tags.map(t => <span key={t} style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#C9973A', border:'1px solid rgba(201,151,58,0.25)', borderRadius:4, padding:'2px 8px' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding:'100px 24px', background:'linear-gradient(180deg,transparent,rgba(201,151,58,0.02),transparent)' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#C9973A', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>How it works</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(30px,4vw,48px)', fontWeight:700, color:'#F5F0E8', lineHeight:1.15 }}>From passage to ready<br /><em style={{ color:'#C9973A' }}>in minutes</em></h2>
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:27, top:40, bottom:40, width:1, background:'linear-gradient(180deg,#C9973A,#8B1A1A)', opacity:0.2 }} />
            {[
              { n:'1', title:'Select your role', desc:'Choose up to two roles — pastor, theologian, teacher, small group leader, youth worker, or children\'s worker. PassageLab generates only what you need.' },
              { n:'2', title:'Enter any passage', desc:'Type any book, chapter, or verse. Old Testament or New. A single verse or an entire chapter.' },
              { n:'3', title:'Your dossier is assembled', desc:'PassageLab generates a role-specific research dossier — languages, history, archaeology, commentary, illustrations, outlines, manuscripts, and more.' },
              { n:'4', title:'Study, build, and teach', desc:'Explore every tab. Save your study. Build your message. Seminary-level research in minutes.' },
            ].map(step => (
              <div key={step.n} className="reveal" style={{ display:'flex', gap:28, padding:'36px 0', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width:56, height:56, flexShrink:0, border:'1px solid rgba(201,151,58,0.3)', borderRadius:'50%', background:'#1C2333', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#C9973A', position:'relative', zIndex:1 }}>{step.n}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:'#F5F0E8', marginBottom:10 }}>{step.title}</div>
                  <div style={{ fontSize:15, color:'#8892A4', lineHeight:1.75, fontWeight:300 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:'100px 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#C9973A', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>Pricing</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(30px,4vw,48px)', fontWeight:700, color:'#F5F0E8', lineHeight:1.15 }}>Start free. <em style={{ color:'#C9973A' }}>Go deeper</em> when you're ready.</h2>
            <p style={{ fontSize:15, color:'#8892A4', marginTop:12 }}>No credit card required to start.</p>
          </div>
          <div className="reveal" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
            {/* Free */}
            <div style={{ background:'#1C2333', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:32 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Free</div>
              <div style={{ fontSize:42, fontWeight:700, color:'#F5F0E8', letterSpacing:'-1px', marginBottom:4 }}>$0</div>
              <div style={{ fontSize:13, color:'#8892A4', marginBottom:24 }}>Forever free</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28, padding:0 }}>
                {['5 studies per month','1 role selection','Core tabs only','Small group questions'].map(f => (
                  <li key={f} style={{ display:'flex', gap:10, fontSize:13, color:'#8892A4' }}><span style={{ color:'#C9973A', fontWeight:700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <a href="/signup" style={{ display:'block', textAlign:'center', padding:12, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', color:'#F5F0E8', fontSize:13, fontWeight:500 }}>Get started free</a>
            </div>
            {/* Church */}
            <div style={{ background:'#1C2333', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:32 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Church</div>
              <div style={{ fontSize:42, fontWeight:700, color:'#F5F0E8', letterSpacing:'-1px', marginBottom:4 }}>$49<span style={{ fontSize:16, fontWeight:400, color:'#8892A4' }}>/mo</span></div>
              <div style={{ fontSize:13, color:'#8892A4', marginBottom:24 }}>or $42/mo billed annually</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28, padding:0 }}>
                {['50 studies per month','2 role selections','All tabs for your roles','Book recommendations','Church Fathers & quotes'].map(f => (
                  <li key={f} style={{ display:'flex', gap:10, fontSize:13, color:'#8892A4' }}><span style={{ color:'#C9973A', fontWeight:700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <a href="/signup?plan=church" style={{ display:'block', textAlign:'center', padding:12, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', color:'#F5F0E8', fontSize:13, fontWeight:500 }}>Get started</a>
            </div>
            {/* Pro */}
            <div style={{ background:'linear-gradient(135deg,rgba(201,151,58,0.08),rgba(201,151,58,0.03))', border:'1px solid #C9973A', borderRadius:16, padding:32, position:'relative' }}>
              <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#C9973A', color:'#0D1117', fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, borderRadius:100, padding:'5px 16px', whiteSpace:'nowrap' }}>Most popular</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:'#F5F0E8', marginBottom:8 }}>Pro</div>
              <div style={{ fontSize:42, fontWeight:700, color:'#F5F0E8', letterSpacing:'-1px', marginBottom:4 }}>$100<span style={{ fontSize:16, fontWeight:400, color:'#8892A4' }}>/mo</span></div>
              <div style={{ fontSize:13, color:'#8892A4', marginBottom:24 }}>or $85/mo billed annually</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28, padding:0 }}>
                {['Unlimited studies','All 6 roles, up to 2 at once','Every tab unlocked','Full sermon manuscripts','Saved library','Priority support'].map(f => (
                  <li key={f} style={{ display:'flex', gap:10, fontSize:13, color:'#8892A4' }}><span style={{ color:'#C9973A', fontWeight:700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <a href="/signup?plan=pro" style={{ display:'block', textAlign:'center', padding:12, borderRadius:8, background:'#C9973A', color:'#0D1117', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(201,151,58,0.3)' }}>Start free trial →</a>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" style={{ padding:'100px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,151,58,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="reveal" style={{ position:'relative', zIndex:1, maxWidth:580, margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(34px,5vw,56px)', fontWeight:700, color:'#F5F0E8', marginBottom:16, lineHeight:1.1 }}>
            Ready to study <em style={{ color:'#C9973A' }}>deeper?</em>
          </h2>
          <p style={{ fontSize:17, color:'#8892A4', fontWeight:300, lineHeight:1.7, marginBottom:36 }}>
            Join thousands of Bible teachers getting early access. Free to start — no credit card required.
          </p>
          <form onSubmit={handleWaitlist} style={{ display:'flex', gap:10, maxWidth:440, margin:'0 auto 12px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ flex:1, height:48, borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', padding:'0 16px', fontSize:15, color:'#F5F0E8', fontFamily:"'DM Sans',sans-serif", outline:'none' }}
            />
            <button type="submit" disabled={waitlistLoading} style={{ height:48, padding:'0 22px', borderRadius:8, background:'#C9973A', color:'#0D1117', fontSize:14, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
              {waitlistLoading ? 'Joining…' : 'Get early access →'}
            </button>
          </form>
          {waitlistMsg && <p style={{ fontSize:14, color:'#C9973A', marginBottom:8 }}>{waitlistMsg}</p>}
          <p style={{ fontSize:12, color:'#8892A4' }}>Free forever tier available. Upgrade anytime.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#F5F0E8' }}>Passage<span style={{ color:'#C9973A' }}>Lab</span></span>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          {['Features','Pricing','About','Privacy','Terms'].map(l => (
            <a key={l} href="#" style={{ fontSize:13, color:'#8892A4' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize:12, color:'rgba(136,146,164,0.4)' }}>© 2026 PassageLab. All rights reserved.</div>
      </footer>
    </div>
  )
}
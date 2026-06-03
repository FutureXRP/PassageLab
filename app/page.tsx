'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = ['John 3:16', 'Romans 8:1-11', 'Psalm 23', 'Genesis 22:1-14', 'Isaiah 53', 'Luke 15:11-32']

export default function HomePage() {
  const router = useRouter()
  const [passage, setPassage] = useState('')
  const [email, setEmail] = useState('')
  const [waitlistMsg, setWaitlistMsg] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function handleStudy(e: React.FormEvent) {
    e.preventDefault()
    if (!passage.trim()) return
    router.push(`/study/${encodeURIComponent(passage.trim())}`)
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
    <div className="min-h-screen bg-ink text-parchment">

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/8 bg-ink/85 backdrop-blur-xl">
        <span className="font-serif text-lg font-bold tracking-tight">
          Passage<span className="text-gold">Lab</span>
        </span>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate hover:text-parchment transition-colors">Features</a>
          <a href="#how" className="text-sm text-slate hover:text-parchment transition-colors">How it works</a>
          <a href="#pricing" className="text-sm text-slate hover:text-parchment transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="btn-ghost text-sm">Sign in</a>
          <a href="#waitlist" className="btn-primary text-sm py-2 px-4">Get early access</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse, #C9973A 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        </div>

        {/* Eyebrow */}
        <div className="relative z-10 inline-flex items-center gap-2 font-mono text-[11px] text-gold uppercase tracking-widest border border-gold/25 rounded-full px-4 py-1.5 mb-8 animate-[fadeUp_0.6s_ease_both]">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          Now in early access
        </div>

        <h1 className="relative z-10 font-serif text-[clamp(40px,7vw,84px)] font-bold leading-[1.08] tracking-tight text-parchment max-w-4xl mb-6 animate-[fadeUp_0.6s_0.1s_ease_both]">
          The research platform<br />
          <em className="text-gold not-italic">Bible teachers</em><br />
          have been waiting for
        </h1>

        <p className="relative z-10 text-[clamp(16px,2vw,20px)] text-slate font-light leading-relaxed max-w-xl mb-10 animate-[fadeUp_0.6s_0.2s_ease_both]">
          Enter any passage. Get original languages, historical context, archaeology, theology, commentary, illustrations, and sermon outlines — in seconds.
        </p>

        {/* Search */}
        <form onSubmit={handleStudy} className="relative z-10 flex gap-3 w-full max-w-xl mb-4 animate-[fadeUp_0.6s_0.3s_ease_both]">
          <input
            type="text"
            value={passage}
            onChange={e => setPassage(e.target.value)}
            placeholder="Enter a passage — e.g. Romans 8:1-11"
            className="flex-1 h-12 rounded-xl border border-white/12 bg-white/5 px-4 font-serif italic text-parchment placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors"
          />
          <button type="submit" className="btn-primary h-12 px-6 text-sm whitespace-nowrap">
            Study ↗
          </button>
        </form>

        <div className="relative z-10 text-xs text-slate mb-2 animate-[fadeUp_0.6s_0.35s_ease_both]">
          Try:{' '}
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setPassage(ex)}
              className="text-gold hover:text-gold-light mr-3 transition-colors">{ex}</button>
          ))}
        </div>

        <p className="relative z-10 text-xs text-slate animate-[fadeUp_0.6s_0.4s_ease_both]">
          <strong className="text-parchment">Free to start.</strong> No credit card required.
        </p>

        {/* Browser mockup */}
        <div className="relative z-10 w-full max-w-3xl mt-16 animate-[fadeUp_0.7s_0.5s_ease_both]">
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,151,58,0.1)]"
            style={{ background: '#1C2333' }}>
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.02]">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 font-mono text-xs text-slate">passagelab.app — Romans 8:1-11</span>
            </div>
            {/* Content */}
            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-0 border-b border-white/8 mb-5 overflow-x-auto">
                {['Overview','Language','Historical','Archaeology','Theology','Christ','Commentary','Illustrations','Outline','Manuscript'].map((t,i) => (
                  <div key={t} className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 -mb-px ${i===0 ? 'text-gold border-gold font-semibold' : 'text-slate border-transparent'}`}>{t}</div>
                ))}
              </div>
              {/* Big idea */}
              <div className="rounded-xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(201,151,58,0.1), rgba(201,151,58,0.04))', border: '1px solid rgba(201,151,58,0.2)' }}>
                <div className="font-mono text-[10px] text-gold uppercase tracking-widest mb-2">Big Idea</div>
                <div className="font-serif text-sm text-parchment italic leading-relaxed">Because Christ has fully satisfied God's condemnation, believers walk not under the law of sin and death but under the liberating law of the Spirit who gives life.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-4 bg-white/3 border border-white/8">
                  <div className="font-mono text-[10px] text-gold uppercase tracking-widest mb-2">Key Word — Greek</div>
                  <div className="font-serif text-lg text-gold font-bold mb-1">κατάκριμα</div>
                  <div className="font-mono text-[11px] text-slate mb-2 italic">katakrima · G2631</div>
                  <div className="text-xs text-slate leading-relaxed">Not merely guilt, but the <strong className="text-parchment">executed sentence</strong> — the penalty fully discharged in Christ.</div>
                </div>
                <div className="rounded-lg p-4 bg-white/3 border border-white/8">
                  <div className="font-mono text-[10px] text-gold uppercase tracking-widest mb-2">Archaeological Finding</div>
                  <div className="text-xs text-slate leading-relaxed">2023 excavations beneath the Mamertine Prison uncovered Roman legal documents confirming the <strong className="text-parchment">permanence of condemnation orders</strong> — illuminating exactly Paul's imagery in v.1.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section className="py-10 px-6 text-center border-y border-white/8">
        <div className="font-mono text-[11px] text-slate uppercase tracking-widest mb-6">Used by Bible teachers everywhere</div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {['Lead Pastors','Seminary Students','Small Group Leaders','Sunday School Teachers','Youth Workers','Bible College Professors'].map(r => (
            <span key={r} className="font-serif text-sm italic text-parchment/30">{r}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="reveal mb-14">
          <div className="label-section">Everything in one place</div>
          <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-bold leading-tight tracking-tight text-parchment max-w-2xl mb-4">
            Every tool a Bible teacher needs — <em className="text-gold italic">assembled for you</em>
          </h2>
          <p className="text-slate text-lg font-light leading-relaxed max-w-xl">
            Stop jumping between a dozen tabs. PassageLab builds a complete research dossier around any passage in seconds.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 border border-white/8 rounded-2xl overflow-hidden reveal">
          {[
            { icon:'📜', title:'Original Languages', desc:'Greek and Hebrew word studies with semantic range, Strong\'s numbers, and what each word unlocks for preaching.', tags:['Greek','Hebrew','Aramaic'] },
            { icon:'🏛️', title:'Archaeology & History', desc:'Real archaeological discoveries and historical context that bring the ancient world alive for modern congregations.', tags:['Excavations','Artifacts','Context'] },
            { icon:'✝️', title:'Christ Connection', desc:'Every passage mapped to Christ — foreshadowing, fulfillment, typology, and the gospel thread.', tags:['Typology','Gospel','Redemption'] },
            { icon:'📖', title:'Commentary Hub', desc:'Spurgeon, Matthew Henry, Calvin, and modern scholarship — synthesized and filtered for what matters.', tags:['Spurgeon','Calvin','Modern'] },
            { icon:'💡', title:'Illustration Engine', desc:'History, science, culture, and church history — vivid illustrations ready for any message.', tags:['History','Science','Culture'] },
            { icon:'🖊️', title:'Sermon Builder', desc:'Full outlines, manuscript drafts, small group questions, and children\'s lessons — built automatically.', tags:['Outline','Manuscript','Kids'] },
          ].map(f => (
            <div key={f.title} className="bg-ink-2 p-8 hover:bg-gold/[0.03] transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <div className="font-serif text-lg font-semibold text-parchment mb-2">{f.title}</div>
              <div className="text-sm text-slate leading-relaxed font-light mb-4">{f.desc}</div>
              <div className="flex flex-wrap gap-2">
                {f.tags.map(t => <span key={t} className="font-mono text-[10px] text-gold border border-gold/25 rounded px-2 py-0.5">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" className="py-24 px-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(201,151,58,0.02), transparent)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="label-section">How it works</div>
            <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-bold tracking-tight text-parchment">From passage to pulpit-ready<br /><em className="text-gold italic">in minutes</em></h2>
          </div>
          <div className="relative flex flex-col">
            <div className="absolute left-7 top-10 bottom-10 w-px bg-gradient-to-b from-gold to-crimson opacity-20" />
            {[
              { n:'1', title:'Enter any passage', desc:'Type any book, chapter, or verse. Old Testament or New. A single verse or an entire chapter.', pills:['John 3:16','Romans 8','Psalm 23','Genesis 22'] },
              { n:'2', title:'Your research dossier is assembled', desc:'In seconds, PassageLab generates 15 research modules — languages, history, archaeology, theology, cross-references, commentary, illustrations, outlines, manuscript, small group questions, and children\'s lesson.', pills:[] },
              { n:'3', title:'Study, build, and teach', desc:'Explore every tab. Save your study. Build your message. The depth of a seminary research library in the time it used to take to open three tabs.', pills:[] },
            ].map(step => (
              <div key={step.n} className="flex gap-8 py-10 border-b border-white/8 last:border-0 reveal">
                <div className="w-14 h-14 flex-shrink-0 rounded-full border border-gold/30 bg-ink-2 flex items-center justify-center font-serif text-xl font-bold text-gold relative z-10">{step.n}</div>
                <div className="flex-1">
                  <div className="font-serif text-xl font-semibold text-parchment mb-3">{step.title}</div>
                  <div className="text-sm text-slate leading-relaxed font-light mb-4">{step.desc}</div>
                  {step.pills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.pills.map(p => <span key={p} className="pill">{p}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="label-section">Pricing</div>
            <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-bold tracking-tight text-parchment">Start free.<br /><em className="text-gold italic">Go deeper</em> when you're ready.</h2>
            <p className="text-slate mt-3 font-light">No credit card required to start.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal">
            {/* Free */}
            <div className="card flex flex-col">
              <div className="font-serif text-2xl font-semibold text-parchment mb-2">Free</div>
              <div className="text-5xl font-bold tracking-tight text-parchment mb-1">$0</div>
              <div className="text-sm text-slate mb-8">Forever free</div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['5 passage studies per month','Overview, language & history','Basic sermon outline','Small group questions'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate"><span className="text-gold font-bold mt-0.5">✓</span>{f}</li>
                ))}
                {['Archaeology & commentary','Illustration engine','Full manuscript','Children\'s lesson builder'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate/30"><span className="font-bold mt-0.5">—</span>{f}</li>
                ))}
              </ul>
              <a href="/signup" className="btn-secondary text-sm py-3 text-center rounded-lg">Get started free</a>
            </div>
            {/* Pro */}
            <div className="relative card card-gold flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-ink font-mono text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-1">Most popular</div>
              <div className="font-serif text-2xl font-semibold text-parchment mb-2">Pro</div>
              <div className="text-5xl font-bold tracking-tight text-parchment mb-1">$19<span className="text-lg font-normal text-slate">/mo</span></div>
              <div className="text-sm text-slate mb-8">or $15/mo billed annually</div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {['Unlimited passage studies','All 15 research modules','Full manuscript generation','Archaeology & commentary hub','Illustration engine (6 types)','Children\'s & youth lesson builder','Saved library (unlimited)','Priority support'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate"><span className="text-gold font-bold mt-0.5">✓</span>{f}</li>
                ))}
              </ul>
              <a href="/signup?plan=pro" className="btn-primary text-sm py-3 text-center rounded-lg">Start free trial →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA / WAITLIST ────────────────────────────────────── */}
      <section id="waitlist" className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse, #C9973A, transparent)' }} />
        </div>
        <div className="relative z-10 max-w-xl mx-auto reveal">
          <h2 className="font-serif text-[clamp(34px,5vw,56px)] font-bold tracking-tight text-parchment mb-4">
            Ready to study <em className="text-gold italic">deeper?</em>
          </h2>
          <p className="text-slate text-lg font-light leading-relaxed mb-10">
            Join thousands of Bible teachers getting early access. Free to start — no credit card required.
          </p>
          <form onSubmit={handleWaitlist} className="flex gap-3 max-w-md mx-auto mb-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-12 rounded-xl border border-white/12 bg-white/5 px-4 text-sm text-parchment placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button type="submit" disabled={waitlistLoading} className="btn-primary h-12 px-6 text-sm whitespace-nowrap">
              {waitlistLoading ? 'Joining…' : 'Get early access →'}
            </button>
          </form>
          {waitlistMsg && <p className="text-sm text-gold">{waitlistMsg}</p>}
          <p className="text-xs text-slate mt-4">Free forever tier available. Upgrade anytime. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <span className="font-serif text-lg font-bold">Passage<span className="text-gold">Lab</span></span>
        <div className="flex flex-wrap gap-6">
          {['Features','Pricing','About','Blog','Privacy','Terms'].map(l => (
            <a key={l} href="#" className="text-sm text-slate hover:text-parchment transition-colors">{l}</a>
          ))}
        </div>
        <div className="text-xs text-slate/40">© 2026 PassageLab. All rights reserved.</div>
      </footer>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

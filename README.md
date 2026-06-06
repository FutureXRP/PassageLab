# PassageLab
## The Ultimate AI-Powered Research Platform for Bible Teachers, Preachers, Pastors, Small Group Leaders, and Students

---

## Vision

PassageLab exists to become the most comprehensive biblical research and teaching platform ever created.

Rather than forcing pastors and teachers to spend hours searching dozens of resources, PassageLab brings together biblical text, original languages, historical context, archaeology, commentaries, theology, illustrations, cross-references, maps, timelines, scholarly resources, and AI-powered teaching tools into a single research environment.

> Give every Bible teacher access to the world's best biblical research tools in seconds.

---

## Mission

Equip every Bible teacher on earth with world-class study tools so they can teach God's Word with greater clarity, confidence, depth, and faithfulness.

---

## What It Does

A pastor enters:

```
John 2:1-11
```

Within seconds PassageLab generates:

- Full passage analysis
- Historical context & cultural background
- Archaeological discoveries
- Original language insights (Greek & Hebrew)
- Commentary summaries
- Cross references & OT connections
- Christological significance
- Teaching outlines & sermon manuscripts
- Small group questions
- Children's & youth lessons
- Illustrations, quotes, maps, timelines
- Application points

Everything centered around one passage.

---

## Product Philosophy

Most Bible study platforms provide resources.

**PassageLab provides intelligence.**

Instead of requiring users to search multiple databases manually, the platform assembles a complete research dossier around a passage and presents it in a coherent, organized format designed specifically for teaching and preaching.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, React |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Styling | Inline styles + CSS variables |
| Hosting | Vercel |

---

## Features

### Passage Dashboard (15 Research Tabs)

| Tab | Content |
|-----|---------|
| Overview | Summary, big idea, themes, teaching opportunities |
| Scripture | ESV, NIV text with verse-by-verse exegetical notes |
| Language | Greek/Hebrew word studies with Strong's numbers |
| Historical | Political, religious, economic, social context |
| Archaeology | Real excavations and discoveries that illuminate the text |
| Theology | God, Christ, Spirit, salvation, kingdom, covenant |
| Cross-refs | Direct, prophetic, typological, thematic references |
| Christ | Foreshadowing, fulfillment, gospel thread |
| Commentary | Spurgeon, Matthew Henry, Calvin, modern scholarship |
| Illustrations | History, science, culture, church history, opening hooks |
| News & Research | Recent archaeological and scholarly findings |
| Outline | Full sermon outline with subpoints and applications |
| Manuscript | Written intro, body, and conclusion in preaching voice |
| Small Group | Icebreaker, 9 discussion questions, activity, takeaway |
| Children | Big truth, memory verse, story, object lesson, craft |

---

## Pricing

| Plan | Price | Studies/Month |
|------|-------|---------------|
| Free | $0 | 5 |
| Church | $49/mo | 50 |
| Pro | $100/mo | Unlimited |

---

## Roadmap

### Phase 1 (Current)
- [x] Landing page
- [x] Passage dashboard (15 tabs)
- [x] Claude AI integration
- [ ] Supabase auth
- [ ] Stripe payments
- [ ] Usage tracking & tier enforcement

### Phase 2
- [ ] Biblical Atlas — interactive maps
- [ ] Biblical Character Database
- [ ] Biblical Event Database
- [ ] Doctrine Explorer
- [ ] Church History Timeline
- [ ] Original Language Academy
- [ ] AI Preaching Coach

### Phase 3
- [ ] Biblical Knowledge Graph
- [ ] AI Teaching Co-Pilot
- [ ] Biblical World Simulation

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/FutureXRP/PassageLab.git
cd PassageLab

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://passagelab.app
```

---

## Success Metric

A pastor preparing a sermon should never need to leave PassageLab.

The platform should provide everything necessary for faithful exposition, deep study, rich illustration, historical understanding, theological accuracy, and practical application — within a single unified research environment.

---

## Ultimate Goal

Become the definitive research and teaching platform for Bible teachers worldwide. A place where every sermon, lesson, Bible study, devotional, and theological inquiry begins.

> *"Helping teachers teach God's Word with greater depth, clarity, confidence, and faithfulness."*

---

## Live Site

[passagelab.app](https://passagelab.app)

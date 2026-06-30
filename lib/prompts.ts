// PassageLab — prompts.ts
// All roles, all tabs, optimized prompts, Bible text injection

export type Role = 
  | 'pastor' 
  | 'theologian' 
  | 'teacher' 
  | 'smallgroup' 
  | 'youth' 
  | 'children' 
  | 'student'

// ─── Role → Tab mapping ────────────────────────────────────────────────────

// ─── Role → Tab mapping ────────────────────────────────────────────────────
// ALL tabs for a role — pricing is determined entirely by model (Haiku=$1, Sonnet=$2)
// No artificial quick/deep split — the model IS the pricing rule

export const ROLE_TABS: Record<Role, string[]> = {
  pastor:     ['overview','scripture','history','illustrations','outline','leadership',
               'language','hermeneutics','christ','apologetics','conflicts'],
  theologian: ['overview','scripture','history',
               'language','hermeneutics','theology','crossrefs','christ','apologetics','conflicts'],
  teacher:    ['overview','scripture','history','illustrations','outline','smallgroup','leadership',
               'hermeneutics','christ','conflicts'],
  smallgroup: ['overview','scripture','history','illustrations','smallgroup'],
  youth:      ['overview','scripture','history','illustrations','youth'],
  children:   ['overview','scripture','illustrations','children'],
  student:    ['overview','scripture','history','essayoutline','leadership',
               'language','hermeneutics','theology','crossrefs','apologetics','conflicts'],
}

export const DEEP_TABS: Record<Role, string[]> = {
  pastor:     ['commentary','archaeology','fathers','books'],
  theologian: ['commentary','fathers','archaeology','books'],
  teacher:    ['commentary','books'],
  smallgroup: ['books'],
  youth:      ['books'],
  children:   ['books'],
  student:    ['commentary','fathers','archaeology','books','citations'],
}

// Tab display order — Haiku tabs first ($1), then Sonnet tabs ($2), then Deep Dive
const TAB_ORDER = [
  // Haiku tabs — $1
  'overview','scripture','history','illustrations','outline','leadership',
  'smallgroup','youth','children','essayoutline','books','citations',
  // Sonnet tabs — $2
  'language','hermeneutics','theology','crossrefs','christ',
  'apologetics','conflicts',
  // Deep Dive (always Sonnet) — $2
  'commentary','fathers','archaeology',
]

export function getTabsForRoles(roles: Role[]): { quick: string[], deep: string[], academic: string[] } {
  const allSet = new Set<string>()
  roles.forEach(role => {
    ROLE_TABS[role]?.forEach(t => allSet.add(t))
    DEEP_TABS[role]?.forEach(t => allSet.add(t))
  })
  // The Sources page ships on every study — it's the verification apparatus a
  // scholar/student needs regardless of role. Haiku, so it stays in the $1 tier.
  allSet.add('citations')
  const all = TAB_ORDER.filter(t => allSet.has(t))
  // Split by model — Haiku = quick, Sonnet = deep
  const quick = all.filter(t => (TAB_MODELS[t] || 'haiku') === 'haiku')
  const deep  = all.filter(t => (TAB_MODELS[t] || 'haiku') === 'sonnet')
  // Academic (Opus) tabs are universal — the same research apparatus regardless
  // of role. The study page only surfaces them when the Academic tier is
  // enabled (feature flag) AND unlocked.
  const academic = [...ACADEMIC_TABS]
  return { quick, deep, academic }
}

// ─── Model routing ─────────────────────────────────────────────────────────
// THIS IS THE PRICING RULE: Haiku = $1 tier, Sonnet = $2 tier
// No exceptions — model determines price, always

export const TAB_MODELS: Record<string, 'sonnet' | 'haiku' | 'opus'> = {
  // Opus — Academic tier (doctoral-grade research apparatus)
  exegesis:     'opus',
  structure:    'opus',
  digest:       'opus',
  question:     'opus',
  apparatus:    'opus',
  parallels:    'opus',
  reception:    'opus',
  excursus:     'opus',
  bibliography: 'opus',
  research:     'opus',
  // Sonnet — $2 tier (theological precision, scholarly depth)
  language:     'sonnet',
  hermeneutics: 'sonnet',
  christ:       'sonnet',
  theology:     'sonnet',
  crossrefs:    'sonnet',
  commentary:   'sonnet',
  fathers:      'sonnet',
  archaeology:  'sonnet',
  apologetics:  'sonnet',
  conflicts:    'sonnet',
  // Haiku — $1 tier (structural, creative, practical)
  overview:     'haiku',
  scripture:    'haiku',
  history:      'haiku',
  illustrations:'haiku',
  outline:      'haiku',
  leadership:   'haiku',
  smallgroup:   'haiku',
  youth:        'haiku',
  children:     'haiku',
  essayoutline: 'haiku',
  books:        'haiku',
  citations:    'haiku',
}

// ─── Token budgets ─────────────────────────────────────────────────────────
// Generous enough for complete content, tight enough for speed

export const TAB_TOKENS: Record<string, number> = {
  // Quick tabs
  overview:        2500,
  scripture:       3500,
  language:        3500,
  history:         2000,
  hermeneutics:    3000,
  theology:        3500,
  crossrefs:       2500,
  christ:          2000,
  apologetics:     3000,
  conflicts:       3000,
  illustrations:   2000,
  outline:         2000,
  leadership:      1800,
  smallgroup:      1800,
  youth:           1500,
  children:        1500,
  essayoutline:    2000,
  // Deep Dive tabs
  commentary:      3500,
  fathers:         3000,
  // Archaeology runs long (4 detailed discoveries) — was hitting max_tokens
  archaeology:     4500,
  apologetics_deep:4000,
  books:           2000,
  // Sources page is intentionally large — a robust bibliography (25-30 works
  // across categories, each with multiple citation styles). Haiku, so cheap.
  citations:       5000,
  // Academic tier (Opus) — long-form; the tab route gives Opus a larger time budget
  exegesis:        6000,
  structure:       5000,
  digest:          6000,
  question:        5000,
  apparatus:       4500,
  parallels:       5000,
  reception:       5500,
  excursus:        5500,
  bibliography:    6000,
  research:        5500,
}

// ─── Bible text injection ──────────────────────────────────────────────────

function passageBlock(passage: string, bibleText: Record<string, string>): string {
  // KJV is the primary fetched translation (see lib/bible-api.ts) — label it accurately
  const text = bibleText?.kjv || bibleText?.web || Object.values(bibleText || {})[0] || ''
  if (text) {
    return `Passage: "${passage}"\nText (KJV): ${text}\n\n`
  }
  return `Passage: "${passage}"\n\n`
}

// ─── Shared system prompt (cached by Anthropic) ────────────────────────────

export const SYSTEM_PROMPT = `You are PassageLab, a world-class biblical research platform. You combine the depth of a seminary professor, the pastoral instincts of an experienced preacher, and the precision of a biblical scholar. Return ONLY raw JSON. No markdown. No backticks. No explanation before or after. Start with { and end with }.`

// ─── Tab prompts ───────────────────────────────────────────────────────────

// ─── Academic tier (Opus) ───────────────────────────────────────────────────
// The Academic tier adds a set of doctoral-grade research tabs on top of the
// Deep Dive. They run on Opus and all share ONE output schema so a single
// renderer (AcademicDoc in the study page) can display every one of them.
// Universal — available for every role once the Academic study is unlocked.
export const ACADEMIC_TABS = [
  'exegesis', 'structure', 'digest', 'question', 'apparatus',
  'parallels', 'reception', 'excursus', 'bibliography', 'research',
] as const

export const ACADEMIC_LABELS: Record<string, string> = {
  exegesis:     'Exegesis',
  structure:    'Structure & Discourse',
  digest:       'Commentary Digest',
  question:     'State of the Question',
  apparatus:    'Critical Apparatus',
  parallels:    'Canonical Parallels',
  reception:    'Reception History',
  excursus:     'Excursuses',
  bibliography: 'Annotated Bibliography',
  research:     'Research Agenda',
}

// Shared builder: every academic tab returns the SAME JSON shape (a list of
// "blocks" the AcademicDoc renderer draws as cards). Only the content spec
// differs per tab. The hard rules (real sources only, engage the languages,
// be specific to THIS passage) are what keep the output doctoral rather than
// generic — and protect against fabricated citations.
function academicPrompt(
  p: string,
  b: Record<string, string>,
  label: string,
  spec: string
): string {
  return `${passageBlock(p, b)}You are a doctoral-level biblical scholar writing for a master's/PhD audience. Produce a rigorous, exhaustive treatment for the "${label}" section of an academic study of this passage.

${spec}

Requirements:
- Be specific to THIS passage — never generic. Engage the Greek/Hebrew where relevant (give the original script AND a transliteration).
- Name real scholars, commentaries, journals, and works. NEVER invent citations, ISBNs, manuscript sigla, or page numbers; if you are not certain of a detail, omit it or hedge ("verify before citing"). Accuracy outranks volume.
- Represent contested positions fairly and at their strongest; distinguish what the text asserts from what later systems derived.
- Be substantial: produce 7-12 content-rich blocks.

Return ONLY raw JSON of EXACTLY this shape (no markdown, no backticks):
{"academic":{
  "lead":"ACADEMIC · ${label}",
  "title":"<a short title for this section>",
  "subtitle":"<1-2 sentence orientation>",
  "blocks":[
    {"accent":true,"chip":"<short tag, e.g. a verse ref, or empty string>","heading":"<card heading>","paragraphs":["<full paragraph>","<another>"],"bullets":["<point>","<point>"],"greek":"<an optional Greek/Hebrew phrase, or empty string>","table":{"headers":["<col>","<col>"],"rows":[["<cell>","<cell>"]]}}
  ]
}}
Rules for blocks: every block MUST have a non-empty "heading" and at least one paragraph. Set "accent" true for the 2-3 most important blocks, false otherwise. Include "bullets", "greek", or "table" ONLY when they genuinely add value — otherwise omit those keys (or use empty values). Do not wrap the JSON in anything.`
}

const TAB_PROMPTS: Record<string, (passage: string, bibleText: Record<string, string>) => string> = {

  leadership: (p, b) => `${passageBlock(p, b)}You are an experienced leadership development coach and pastor. Generate a complete leadership application study — how does this passage speak specifically to the challenges, character, and responsibilities of leading people? Return JSON:
{"leadership":{
  "principle":"The single most important leadership insight this passage contains — stated as a memorable, actionable principle a leader can carry all week",
  "inner_life":"3-4 sentences on what this passage reveals about the inner world of a leader — character, motives, fears, identity. What does this text say about who a leader must be, not just what they must do?",
  "leading_through_it":"3-4 sentences on how to bring this passage's truth into the practical leadership of a team, staff, or organization — concrete and specific",
  "blind_spot":"2-3 sentences on what leaders specifically tend to miss or resist in this passage — the truth that is hardest for people in authority to receive",
  "difficult_conversations":"2-3 sentences on how the truth of this passage applies when you must say something hard to someone you lead — what does this text give you for that moment?",
  "team_questions":[
    "Question for a leadership team or staff devotional — designed for leaders, not a general congregation",
    "Second question going deeper into leadership application",
    "Third question connecting to current organizational or team challenges",
    "Fourth question about personal leadership character growth"
  ],
  "weekly_practice":"One specific, concrete leadership practice or habit to carry from this passage into the coming week of leading — something a leader can actually do"
}}`,

  overview: (p, b) => `${passageBlock(p, b)}Return JSON:
{"overview":{
  "summary":"4-5 sentence summary capturing narrative arc, theological significance, and why this passage matters",
  "main_idea":"One crisp preachable proposition — the single sentence that captures the whole passage",
  "author":"Author background and why it shapes interpretation of this specific passage",
  "audience":"Original audience — who they were, their struggles, what challenged them",
  "date":"Approximate date and why the historical moment matters for interpretation",
  "setting":"3-4 sentence historical, geographical, cultural setting",
  "purpose":"Author's specific intent — what problem prompted this, what response was hoped for",
  "literary_genre":"Genre and how it shapes correct interpretation — what mistakes readers make",
  "literary_structure":"Structure analysis — chiasm, inclusio, narrative arc — and what structure reveals about meaning",
  "themes":["Theme 1","Theme 2","Theme 3","Theme 4","Theme 5","Theme 6"],
  "teaching_opportunities":["Specific angle 1 with full explanation","Angle 2 with explanation","Angle 3 with explanation","Angle 4 with explanation"]
}}`,

  scripture: (p, b) => `${passageBlock(p, b)}Return JSON:
{"scripture":{
  "key_verse":"Most preachable verse with full explanation of why it is the theological hinge of the passage",
  "verse_by_verse":[
    {"verse":"verse reference","notes":"3-4 sentence exegetical note — original language insight, what the verse contributes to the argument, what preachers miss, one surprising observation"}
  ]
}}
Include a note for every verse or verse group in the passage.`,

  language: (p, b) => {
    const text = b?.kjv || b?.web || Object.values(b || {})[0] || ''
    const verseCount = (text.match(/\[\w+ \d+:\d+\]/g) || []).length
    const wordCount = verseCount > 8 ? 5 : verseCount > 3 ? 4 : 3
    return `${passageBlock(p, b)}Identify the ${wordCount} most theologically significant Greek or Hebrew words in this passage. For each word provide the original script, transliteration, Strongs number, and analysis. Return JSON:
{"language":[{
  "word":"the original Greek or Hebrew word in its script",
  "transliteration":"full transliteration using English letters",
  "strongs":"G#### or H####",
  "pos":"part of speech",
  "parsing":"full morphological parsing if verb — tense voice mood person number case",
  "definition":"3-4 sentence definition covering semantic range, etymology, what it meant to original readers, what is lost in translation",
  "usage":"3 specific cross-references showing canonical usage with brief explanation of each",
  "cognates":"related words in same word family and what they reveal about meaning",
  "preaching_note":"2-3 sentences on what this word unlocks for the preacher and what insight it provides"
}]}`
  },

  history: (p, b) => `${passageBlock(p, b)}Return JSON:
{"history":{
  "political":"2-3 sentences on political environment affecting interpretation",
  "religious":"2-3 sentences on religious climate illuminating the passage",
  "economic":"2 sentences on economic conditions relevant to the text",
  "social":"2-3 sentences on social customs, honor-shame dynamics, family structures",
  "geographical":"2 sentences on geographical details that matter for interpretation",
  "original_audience":"3-4 sentences on what original audience grasped that modern readers miss",
  "blind_spots":"3-4 sentences on what modern Western readers specifically miss about this passage",
  "jewish_background":"2-3 sentences on Jewish background essential for unlocking this text",
  "greco_roman":"2-3 sentences on Greco-Roman context affecting interpretation",
  "intertestamental":"2 sentences on intertestamental period background if relevant"
}}`,

  hermeneutics: (p, b) => `${passageBlock(p, b)}Provide a complete hermeneutical guide for correctly interpreting this passage. Return JSON:
{"hermeneutics":{
  "genre_rules":"3-4 sentences on the specific interpretive rules this genre requires — what approach is mandatory, what approaches to avoid",
  "authorial_intent":"3-4 sentences on how to identify and stay anchored to what the author actually meant — the grammatical-historical method applied here",
  "context_levels":"2-3 sentences on each: immediate context (surrounding verses), book context, canonical context — and what each level reveals",
  "common_mistakes":["Specific misinterpretation 1 people make with this passage and why it's wrong","Mistake 2","Mistake 3","Mistake 4"],
  "key_questions":["The first question a careful reader must ask of this text","Second question","Third question","Fourth question — often overlooked"],
  "faithful_reading":"4-5 sentences on what a responsible, faithful reading of this passage looks like — the guardrails that keep interpretation honest",
  "application_principles":"3-4 sentences on how to move correctly from what the text meant to what it means — the legitimate application bridge",
  "interpretive_tradition":"2-3 sentences on how the church has historically read this passage and what that tradition contributes"
}}`,

  theology: (p, b) => `${passageBlock(p, b)}Return JSON:
{"theology":{
  "god":"3-4 sentences on what this passage reveals about God's nature, character, and actions",
  "christ":"3-4 sentences on Christological content — explicit or implicit",
  "holy_spirit":"2-3 sentences on the Spirit's role in this passage",
  "salvation":"3-4 sentences on soteriological themes",
  "humanity":"2-3 sentences on anthropological content — what this reveals about human nature",
  "kingdom":"2-3 sentences on kingdom of God themes",
  "covenant":"2-3 sentences on covenant themes and how they function here",
  "church":"2-3 sentences on ecclesiological themes if present",
  "eschatology":"2-3 sentences on eschatological themes",
  "biblical_theology":"4-5 sentences on how this fits the creation-fall-redemption-new creation arc",
  "systematic_connections":"3-4 sentences connecting to systematic theology loci",
  "doctrinal_issues":["Full sentence describing doctrinal issue or debate raised by this passage","Issue 2","Issue 3"]
}}`,

  crossrefs: (p, b) => `${passageBlock(p, b)}Return JSON:
{"crossrefs":{
  "direct":["ref — 2 sentence explanation of the connection","ref — explanation","ref — explanation","ref — explanation","ref — explanation"],
  "prophetic":["ref — explanation of prophetic connection","ref — explanation","ref — explanation"],
  "typological":["ref — explanation of typological connection","ref — explanation","ref — explanation"],
  "thematic":["ref — explanation","ref — explanation","ref — explanation","ref — explanation"],
  "parallel_passages":["ref — explanation of similarity and difference","ref — explanation"],
  "ot_backdrop":"3-4 sentence OT backdrop that illuminates this NT passage",
  "nt_development":"2-3 sentences on how the NT develops the themes of this passage"
}}`,

  christ: (p, b) => `${passageBlock(p, b)}Return JSON:
{"christ":{
  "title":"Most fitting Christological title for this passage with 2-3 sentences explaining why",
  "presence":"3-4 sentences on how Christ is present — explicit, implicit, typological, or anticipatory",
  "foreshadowing":"3-4 sentences on specific images or themes pointing forward to Christ",
  "fulfillment":"3-4 sentences on how Christ fulfills what this text anticipates or promises",
  "gospel_thread":"4-5 sentences on the full gospel thread — creation, fall, redemption, restoration",
  "christocentric_preaching":"4-5 sentences on the legitimate exegetical path from this text to Christ — avoiding forced allegory while honoring the canonical witness"
}}`,

  illustrations: (p, b) => `${passageBlock(p, b)}Generate 3 vivid, theologically precise illustrations for preaching or teaching this passage. Make them specific, emotionally resonant, and accurately connected to the text. Return JSON:
{"illustrations":[
  {
    "category":"Opening Hook",
    "title":"Specific evocative title",
    "content":"5-6 sentence illustration. Specific people, places, details. Written to be spoken aloud. Creates immediate tension or curiosity that the passage resolves.",
    "bridge":"2-3 sentences on exactly how to connect this illustration to the passage — the explicit theological link"
  },
  {
    "category":"Historical or Church History",
    "title":"Title",
    "content":"5-6 sentence historical illustration — specific dates, names, places. Dramatically told.",
    "bridge":"2-3 sentence bridge to the passage"
  },
  {
    "category":"Human Experience",
    "title":"Title", 
    "content":"5-6 sentence universal human experience that opens a window into this text. Emotionally honest.",
    "bridge":"2-3 sentence bridge to the passage"
  }
]}`,

  outline: (p, b) => `${passageBlock(p, b)}Return JSON:
{"outline":{
  "title":"Compelling memorable sermon title — specific, not generic",
  "big_idea":"Full preachable proposition — one complete sentence capturing the entire sermon's thrust",
  "introduction":"3-4 sentences on how to open — specific hook creating genuine tension or need for what this passage says",
  "points":[
    {
      "point":"First main point — stated memorably, anchored in the text",
      "subpoints":["Exegetical subpoint with textual grounding","Theological development of the point","Contemporary connection making it urgent"],
      "illustration":"2-3 sentence description of a specific illustration for this point",
      "application":"2-3 sentences of specific concrete personal application"
    },
    {
      "point":"Second main point",
      "subpoints":["Subpoint 1","Subpoint 2","Subpoint 3"],
      "illustration":"2-3 sentence illustration",
      "application":"2-3 sentences application"
    },
    {
      "point":"Third main point",
      "subpoints":["Subpoint 1","Subpoint 2","Subpoint 3"],
      "illustration":"2-3 sentence illustration",
      "application":"2-3 sentences application"
    }
  ],
  "conclusion":"3-4 sentences on how to land the sermon — the final movement that brings everything together",
  "invitation":"2-3 sentences on how to invite response — one concrete action this week"
}}`,

  smallgroup: (p, b) => `${passageBlock(p, b)}Return JSON:
{"smallgroup":{
  "icebreaker":"Fun low-stakes opening question connecting to passage theme without requiring Bible knowledge",
  "context_setter":"2 sentences a group leader reads aloud to set up the passage for people who haven't prepared",
  "questions":[
    {"type":"Observation","question":"Specific question forcing people into the actual text"},
    {"type":"Observation","question":"Second observation question about something easy to overlook"},
    {"type":"Interpretation","question":"What does this mean — question about significance"},
    {"type":"Interpretation","question":"Why did the author say it this way"},
    {"type":"Interpretation","question":"What would the original audience have understood that we miss"},
    {"type":"Application","question":"Where is this truth most needed in your life right now"},
    {"type":"Application","question":"What would living this out look like this week — be concrete"},
    {"type":"Application","question":"Who in your life needs to hear this — outward facing"},
    {"type":"Prayer","question":"Based on this passage, what do you want to ask God for"}
  ],
  "activity":"Creative group activity that moves beyond discussion into experience or action",
  "takeaway":"One sentence every group member should carry with them all week"
}}`,

  youth: (p, b) => `${passageBlock(p, b)}Return JSON:
{"youth":{
  "big_truth":"Main truth in language a 16-year-old finds genuinely compelling — not dumbed down, just relevant",
  "cultural_hook":"Specific cultural reference, social media trend, or teen issue creating a natural bridge to this passage",
  "game":{
    "name":"Specific game name",
    "instructions":"Complete step-by-step instructions a youth pastor can run immediately",
    "connection":"How this game sets up the passage theme"
  },
  "object_lesson":{
    "object":"Specific common object every teenager knows",
    "lesson":"Step-by-step — what you do, what you say at each step, what the reveal is"
  },
  "discussion_questions":["Question teens will actually engage with honestly","Deeper question building on the first","Question challenging their assumptions","Harder question for mature students"],
  "challenge":"Specific concrete weekly challenge — something a teenager can actually do and report back on",
  "memory_verse":"Best verse from the passage with 1-2 sentence explanation of why this verse for teens"
}}`,

  children: (p, b) => `${passageBlock(p, b)}Return JSON:
{"children":{
  "big_truth":"One truth in words a 7-year-old completely understands — simple but not theologically shallow",
  "memory_verse":"Short memory verse a 6-year-old can memorize with reference — under 15 words",
  "story_retelling":"120-150 word vivid present-tense children's story retelling — sensory details, age-appropriate, written to be read aloud naturally",
  "object_lesson":{
    "object":"Simple household object every family has",
    "lesson":"Detailed step-by-step — what to show, what to say, what questions to ask, what the conclusion is"
  },
  "craft_idea":"Specific craft with complete materials list and step-by-step instructions",
  "activity":"Active physical game with specific instructions connecting to the passage theme",
  "snack_idea":"Thematic snack with clear explanation of the connection to the passage",
  "discussion_questions":["Simple engaging question for ages 6-10","Second question going slightly deeper","Third question connecting the story to daily life"],
  "parent_connection":"Specific actionable take-home — one dinner table question or one family challenge simple enough that busy parents will actually do it"
}}`,

  essayoutline: (p, b) => `${passageBlock(p, b)}Generate a complete academic paper outline for a seminary-level exegesis paper on this passage. Return JSON:
{"essay_outline":{
  "suggested_title":"Academic paper title — specific, arguable, scholarly",
  "thesis":"One complete arguable thesis statement — the claim the paper will defend",
  "abstract":"3-4 sentence abstract summarizing the paper's argument and contribution",
  "sections":[
    {
      "section":"I. Introduction",
      "content":"What to include — the hook, the significance of the passage, the gap in scholarship this paper addresses, the thesis statement, the roadmap"
    },
    {
      "section":"II. Historical and Literary Context",
      "content":"What to cover — author, date, audience, genre, literary structure, position in the book"
    },
    {
      "section":"III. Exegetical Analysis",
      "content":"Verse-by-verse analysis of key terms, grammatical structures, syntactical observations — the core of the paper"
    },
    {
      "section":"IV. Theological Themes",
      "content":"The major theological contribution of this passage — systematic and biblical theology connections"
    },
    {
      "section":"V. History of Interpretation",
      "content":"How the church has read this passage — patristic, Reformation, modern — areas of agreement and debate"
    },
    {
      "section":"VI. Contemporary Significance",
      "content":"What this passage contributes to the church today — carefully bridged application"
    },
    {
      "section":"VII. Conclusion",
      "content":"Restatement of thesis, summary of argument, implications for further research"
    }
  ],
  "key_arguments":["Main argument 1 the paper must make","Argument 2","Argument 3","Argument 4 — the contribution"],
  "potential_counterarguments":["Counterargument to engage","Second counterargument","How to respond to each"],
  "suggested_length":"Suggested page count and word count for each section",
  "research_starting_points":["Where to begin in the secondary literature","Key commentaries to read first","Key journal to search"]
}}`,

  commentary: (p, b) => `${passageBlock(p, b)}Return JSON:
{"commentary":{
  "matthew_henry":"3-4 sentences on Matthew Henry's key observations and Puritan emphases on this passage",
  "spurgeon":"3-4 sentences on Spurgeon's approach, what he emphasized, his distinctive homiletical insight",
  "calvin":"3-4 sentences on Calvin's theological emphasis and exegetical moves",
  "augustine":"3-4 sentences on Augustine's interpretation and what he uniquely contributes",
  "luther":"3-4 sentences on Luther's emphasis and what he saw that others missed",
  "modern_reformed":"3-4 sentences on modern Reformed scholarship — Carson, Piper, Sproul, Keller — and their key insights",
  "modern_evangelical":"3-4 sentences on broader evangelical scholarship — key debates and positions",
  "areas_of_agreement":"3-4 sentences where all commentators across traditions agree — the settled reading",
  "areas_of_debate":"3-4 sentences where commentators significantly disagree and what is theologically at stake",
  "best_insight":"2-3 sentences identifying the single most illuminating insight from across the entire commentary tradition"
}}`,

  fathers: (p, b) => `${passageBlock(p, b)}Find 4 church fathers who commented on this passage. Return JSON:
{"church_fathers":[{
  "father":"Father's name",
  "dates":"birth-death years",
  "tradition":"Alexandrian, Antiochene, Latin, etc.",
  "quote":"Substantial representative quote or very close paraphrase capturing their distinctive voice and interpretation",
  "context":"2-3 sentences on the context of their interpretation — what question they were addressing, why their reading matters today"
}]}`,

  archaeology: (p, b) => `${passageBlock(p, b)}Identify 3-4 real archaeological discoveries directly relevant to this passage. Return JSON:
{"archaeology":[{
  "discovery":"Name of real specific archaeological discovery",
  "location":"Specific site and region",
  "date_found":"When discovered and by whom",
  "relevance":"2-3 sentences on how this specifically illuminates the passage",
  "details":"3-4 sentences of archaeological detail — what was found, scholarly conclusions, current state of the site",
  "significance":"2-3 sentences on why this matters for preachers and teachers — what it does to the text"
}]}`,

  books: (p, b) => `${passageBlock(p, b)}Recommend 6-8 books for serious study of this passage. Include commentaries, background works, and theological studies. Return JSON:
{"books":[{
  "title":"Exact book title",
  "author":"Full author name",
  "type":"Commentary or Theology or Background or Language or Devotional",
  "description":"2-3 sentences on what this book specifically contributes — what the reader finds that they cannot find elsewhere",
  "level":"Beginner or Intermediate or Advanced or Scholar",
  "isbn":"ISBN-13 if known, or empty string",
  "logos_available":true
}]}`,

  conflicts: (p, b) => `${passageBlock(p, b)}Identify the most significant genuine interpretive disagreements among serious scholars and traditions about this passage. Represent every position fairly and at its strongest — never strawman. Return JSON:
{"conflicts":{
  "central_question":"The single most contested interpretive question about this passage — stated neutrally, as a genuine open question",
  "why_it_matters":"2-3 sentences on what theological or practical difference the answer makes — why this isn't just an academic debate",
  "positions":[{
    "name":"Name of this interpretive position",
    "held_by":"Which scholars, traditions, or denominations hold this view — specific names where possible",
    "argument":"3-4 sentences — the strongest version of this position's case, stated as its proponents would state it",
    "key_texts":"The biblical passages this position most appeals to in support",
    "weakness":"1-2 honest sentences on where this position faces the most exegetical or theological pressure"
  }],
  "common_ground":"3-4 sentences on what all serious interpreters agree on regardless of position — the settled ground",
  "historical_development":"3-4 sentences on how interpretation of this passage has shifted from the early church through the Reformation to modern scholarship",
  "secondary_disputes":["A second genuine interpretive disagreement about this passage","A third if applicable"],
  "pastoral_wisdom":"3-4 sentences on how to handle genuine interpretive uncertainty from the pulpit — what intellectual honesty looks like in preaching without undermining congregational confidence"
}}`,

  apologetics: (p, b) => `${passageBlock(p, b)}You are a world-class Christian apologist with deep knowledge of biblical scholarship, philosophy, and history. Engage objections with intellectual honesty — always represent the strongest version of each objection, never strawman critics, acknowledge genuine difficulties fairly. Return JSON:
{"apologetics":{
  "historical_reliability":"3-4 sentences on the specific evidence supporting the historical reliability of this passage — manuscript tradition, external attestation, archaeological confirmation, eyewitness indicators",
  "textual_criticism":"2-3 sentences on any significant manuscript variants in this passage, what they are, how significant they are, and what the scholarly consensus on the best text is",
  "critical_objections":[
    {
      "objection":"The strongest version of a real scholarly or popular objection to this passage — stated fairly as a critic would state it",
      "source":"The scholar, tradition, or category of skeptic who makes this objection",
      "response":"3-4 sentence substantive response — intellectually honest, engaging the objection at its strongest, not dismissive",
      "recommended_resource":"One specific book or scholar that addresses this objection most thoroughly"
    }
  ],
  "philosophical_challenges":"2-3 sentences on any philosophical challenges this passage raises — miracles, exclusivity, theodicy, ethics — and the most credible responses",
  "common_questions":[
    "Most common skeptical question about this passage that believers actually get asked",
    "Second common question",
    "Third common question"
  ],
  "conversational_responses":[
    "Natural, non-academic response to the first common question — what a confident but humble believer actually says",
    "Response to second question",
    "Response to third question"
  ],
  "what_critics_get_right":"1-2 sentences of honest acknowledgment — what do critical scholars correctly identify about this passage, even if their conclusions differ",
  "strongest_evidence":"2-3 sentences on the single most compelling piece of evidence for the reliability and truthfulness of this passage"
}}`,

  apologetics_deep: (p, b) => `${passageBlock(p, b)}You are a world-class Christian apologist with deep expertise in biblical scholarship, philosophy of religion, and the history of criticism. Provide a comprehensive scholarly apologetics treatment of this passage. Represent all objections at their strongest — the goal is genuine intellectual engagement, not easy wins. Return JSON:
{"apologetics_deep":{
  "manuscript_evidence":"4-5 sentences on the manuscript tradition for this passage — number of manuscripts, earliest manuscripts, textual variants and their significance, how this passage fares in textual criticism compared to other ancient documents",
  "historical_corroboration":"4-5 sentences on external evidence corroborating this passage — non-Christian sources, archaeological finds, social and cultural details confirmed by independent evidence",
  "source_criticism":"3-4 sentences on source-critical questions — authorship debates, dating debates, source theories — and how evangelical scholars engage them",
  "form_criticism":"3-4 sentences on form-critical approaches to this passage and the scholarly response",
  "redaction_criticism":"3-4 sentences on redaction-critical observations and what they do and do not prove",
  "major_scholarly_objections":[
    {
      "objection":"Full statement of a major scholarly objection — the version a professor would make",
      "scholar":"Specific scholar or school associated with this objection",
      "evangelical_response":"4-5 sentence substantive engagement — the strongest evangelical response with its own scholars and evidence",
      "remaining_tensions":"1-2 honest sentences on what tension remains after the response — intellectual honesty about unresolved questions"
    }
  ],
  "philosophical_objections":[
    {
      "objection":"Philosophical objection — miracles, problem of evil, religious exclusivity, etc.",
      "response":"3-4 sentence philosophical response — Plantinga, Swinburne, Craig, or other relevant philosophers",
      "key_distinction":"The single most important conceptual distinction that clarifies the issue"
    }
  ],
  "what_critics_get_right":"3-4 honest sentences on genuine insights critical scholarship has contributed — intellectual humility that strengthens rather than weakens the apologetic",
  "cumulative_case":"4-5 sentences building the cumulative case for this passage — multiple independent lines of evidence converging",
  "key_apologists_on_this_passage":[
    {"scholar":"Name","contribution":"2-3 sentences on their specific contribution to defending this passage"},
    {"scholar":"Name","contribution":"2-3 sentences"}
  ],
  "recommended_reading":[
    {"title":"Book title","author":"Author","focus":"What this book specifically contributes to the apologetics of this passage"}
  ]
}}`,

  citations: (p, b) => `${passageBlock(p, b)}Build an exhaustive academic SOURCES page for serious study of this passage — the bibliography a seminary student or scholar would actually consult and cite. Favor real, recognized works spanning classic and contemporary scholarship and multiple traditions (Reformed, Catholic, evangelical, critical). More reputable sources is better. Never invent an ISBN — leave it empty if you are not certain. Return JSON:
{"citations":{
  "disclaimer":"These sources are AI-generated from the standard scholarly literature on this passage. Verify each against a library catalog or database before citing — confirm author, edition, year, and page numbers.",
  "commentaries":[{
    "author_last":"Last name","author_first":"First name","title":"Full title","series":"Commentary series if applicable","publisher":"Publisher","location":"Publication city","year":"Publication year","isbn":"ISBN-13 if certain, else empty string",
    "turabian":"Full Turabian formatted citation","sbl":"Full SBL formatted citation","mla":"Full MLA formatted citation","verified":false
  }],
  "background_works":[{
    "author_last":"Last","author_first":"First","title":"Title of monograph or key study","publisher":"Publisher","location":"City","year":"Year","isbn":"ISBN-13 if certain, else empty",
    "turabian":"Turabian citation","sbl":"SBL citation","mla":"MLA citation","verified":false
  }],
  "lexicons":[{
    "short_name":"BDAG / BDB / HALOT / TDNT etc","full_title":"Full title","editor":"Editor name","edition":"Edition","publisher":"Publisher","year":"Year",
    "turabian":"Turabian citation","sbl":"SBL citation","verified":false
  }],
  "journal_searches":[{
    "database":"ATLA Religion / JSTOR / EBSCOhost","suggested_search_terms":"specific search terms to use","notes":"what kind of articles to look for"
  }],
  "free_online_resources":[{
    "name":"Resource name","description":"What it contains and why it's useful","url":"Full real URL"
  }]
}}
Provide 8-10 commentaries, 8-10 background_works (monographs and major studies), 3-4 lexicons/reference works, 3-4 journal_searches, and 5-6 free_online_resources. Use only real works.`,

  // ── Academic tier (Opus) — all share the academicPrompt schema ────────────
  exegesis: (p, b) => academicPrompt(p, b, 'Exegesis',
    'Provide a clause-by-clause exegetical commentary covering EVERY verse of the passage in order. Use one or more blocks per verse or verse-group, each "chip"-tagged with the reference (e.g. "v. 12"). For each: the Greek text decisions, syntax, lexical cruxes, the interpretive options at any disputed point (with proponents), and what is theologically at stake. End with a block summarizing the exegetical decisions adopted vs. the chief alternatives.'),

  structure: (p, b) => academicPrompt(p, b, 'Structure & Discourse',
    'Analyze the literary structure and discourse flow: the macro-movement and any anacoluthon/inclusio/chiasm, a clause-flow outline (which clauses ground, qualify, or conclude others), the chain of conjunctions and what each does, the rhetorical forms in play (e.g. synkrisis, a-fortiori/qal wahomer, antithesis, diatribe), and how the passage functions within its larger argument/book context.'),

  digest: (p, b) => academicPrompt(p, b, 'Commentary Digest',
    'Digest what the major critical commentators say, verse-group by verse-group. For each section of the passage, give a block summarizing the positions of several standard commentators (e.g. for NT: Cranfield, Dunn, Moo, Fitzmyer, Schreiner, Käsemann, Wright, Jewett, Byrne — choose those who actually treat this passage), each in their characteristic terms. End with a "convergence and divergence" block (a table is ideal) showing where they agree and where they split.'),

  question: (p, b) => academicPrompt(p, b, 'State of the Question',
    'Map the current scholarly debate: the central interpretive question, then the major "fronts" of dispute — each as a block naming the positions, their leading proponents, and the state of play. Cover lexical/grammatical cruxes, theological disputes, and methodological/paradigm differences as relevant. End with a block on the genuine openings a fresh study could exploit.'),

  apparatus: (p, b) => academicPrompt(p, b, 'Critical Apparatus',
    'Provide a text-critical treatment: identify the genuinely significant variants in the passage (verse by verse), give the witnesses in summary form, weigh internal and external evidence, and state a reasoned verdict for each, noting the theological stakes. Flag where the passage is textually stable. Reference NA28/UBS5 and Metzger\'s Textual Commentary. NEVER invent manuscript sigla or readings — if a verse has no significant variant, say so.'),

  parallels: (p, b) => academicPrompt(p, b, 'Canonical Parallels',
    'Trace the passage across the canon: its OT roots and scriptural substrate; the closest NT/canonical parallels (with a comparison table where useful); its outworking in the surrounding context; and the wider biblical-theological themes it participates in. For each parallel, explain both the similarity and the significant difference.'),

  reception: (p, b) => academicPrompt(p, b, 'Reception History',
    'Trace the history of interpretation from the early church to the present, era by era (patristic, medieval, Reformation, post-Reformation, modern, contemporary). For each, name the key figures and what they contributed or disputed, and note any decisive turning points (e.g. translation decisions, conciliar definitions, paradigm shifts). Summarize/paraphrase positions; do not fabricate quotations.'),

  excursus: (p, b) => academicPrompt(p, b, 'Excursuses',
    'Treat the 4-6 hardest cruxes of the passage as full mini-essays (one block each, "accent" true). For each: state the problem, survey the live options at their strongest with proponents, and give a reasoned judgment with its limits. Choose the cruxes that genuinely matter for THIS passage (lexical, theological, historical, or methodological).'),

  bibliography: (p, b) => academicPrompt(p, b, 'Annotated Bibliography',
    'Build a graduate research bibliography, organized by category (major critical commentaries; monographs & key articles; primary background sources; reference works & tools; historical/reception sources). Use blocks per category. For each entry give author, title, series/publisher, year, and a 1-2 sentence annotation of its argument/stance. Use ONLY real works; add a block reminding the reader to verify editions/pages before citing.'),

  research: (p, b) => academicPrompt(p, b, 'Research Agenda',
    'Turn the passage into research directions for a thesis or paper: 4-6 defensible thesis topics (each a block) with the driving question, the method it requires, and the counter-arguments to pre-empt; a worked sample prospectus (title, thesis, outline, anticipated objections); method notes; and the journals + databases + search strings to target. Also include a brief set of comprehension and viva-style examination questions with model answers.'),
}

// ─── Public API ────────────────────────────────────────────────────────────

export function buildTabPrompt(
  tabId: string,
  passage: string,
  bibleText: Record<string, string> = {}
): string {
  const builder = TAB_PROMPTS[tabId]
  if (!builder) return ''
  return builder(passage, bibleText)
}

export function getTabModel(tabId: string): 'sonnet' | 'haiku' | 'opus' {
  return TAB_MODELS[tabId] || 'haiku'
}

export function getTabTokens(tabId: string): number {
  return TAB_TOKENS[tabId] || 1500
}

// ─── Pricing ───────────────────────────────────────────────────────────────
// Haiku tab = $2 study price (Quick Study tier)
// Sonnet tab = $5 study price (Deep Dive tier)
// Price is per-tab but charged as a flat rate per study tier.
// Source of truth for charging is PRICES in lib/usage.ts — keep these in sync.

// Tier prices (keep in sync with PRICES in lib/usage.ts). Academic is gated by
// the ACADEMIC_ENABLED feature flag — it only ever charges when the flag is on.
const QUICK_PRICE    = 2.00
const DEEP_PRICE     = 5.00
const ACADEMIC_PRICE = 20.00

export function isDeepTab(tabId: string): boolean {
  return (TAB_MODELS[tabId] || 'haiku') === 'sonnet'
}

export function isAcademicTab(tabId: string): boolean {
  return (TAB_MODELS[tabId] || 'haiku') === 'opus'
}

// The tier a single tab belongs to (used by the API for billing + entitlement).
export function studyTypeForTab(tabId: string): 'quick' | 'deep' | 'academic' {
  const m = TAB_MODELS[tabId] || 'haiku'
  return m === 'opus' ? 'academic' : m === 'sonnet' ? 'deep' : 'quick'
}

export function getTabPrice(tabId: string): number {
  return isAcademicTab(tabId) ? ACADEMIC_PRICE : isDeepTab(tabId) ? DEEP_PRICE : QUICK_PRICE
}

export function getStudyPrice(tabIds: string[]): number {
  // Highest tier present wins: any Opus tab → Academic; else any Sonnet → Deep; else Quick
  if (tabIds.some(t => isAcademicTab(t))) return ACADEMIC_PRICE
  if (tabIds.some(t => isDeepTab(t)))     return DEEP_PRICE
  return QUICK_PRICE
}

// ─── ROLE DEFINITIONS ─────────────────────────────────────────────────────────

export type Role = 'pastor' | 'theologian' | 'teacher' | 'smallgroup' | 'youth' | 'children'

export const ROLE_TABS: Record<Role, string[]> = {
  pastor:     ['overview','scripture','language','history','archaeology','theology','crossref','christ','commentary','fathers','quotes','illustrations','news','outline','manuscript'],
  theologian: ['overview','scripture','language','history','archaeology','theology','crossref','christ','commentary','fathers','books','news'],
  teacher:    ['overview','scripture','history','christ','commentary','illustrations','outline','books','smallgroup'],
  smallgroup: ['overview','scripture','history','christ','illustrations','smallgroup'],
  youth:      ['overview','scripture','history','christ','illustrations','youth'],
  children:   ['overview','scripture','illustrations','children'],
}

export function getTabsForRoles(roles: Role[]): string[] {
  const tabSet = new Set<string>()
  roles.forEach(role => {
    ROLE_TABS[role]?.forEach(tab => tabSet.add(tab))
  })
  // Always preserve logical order
  const ORDER = ['overview','scripture','language','history','archaeology','theology','crossref','christ','commentary','fathers','quotes','books','illustrations','news','outline','manuscript','smallgroup','youth','children']
  return ORDER.filter(t => tabSet.has(t))
}

// ─── SECTION BUILDERS ─────────────────────────────────────────────────────────

function overviewSection() {
  return `"overview": {
    "summary": "Rich 4-5 sentence summary capturing the full arc, narrative flow, and theological significance",
    "main_idea": "One crisp unforgettable big idea sentence — the single proposition a preacher would preach",
    "author": "Author name, background, writing context, and why that matters for interpretation",
    "audience": "Detailed original audience description — who they were, what they believed, what pressures they faced",
    "date": "Approximate date written with full historical context",
    "setting": "Rich 3-4 sentence historical, geographical, and cultural setting",
    "purpose": "Why this passage was written — the author's specific intent",
    "literary_genre": "Genre identification and full explanation of how genre shapes interpretation",
    "literary_structure": "How the passage is structured — chiasm, inclusio, parallel structure, narrative arc",
    "themes": ["theme1","theme2","theme3","theme4","theme5","theme6"],
    "teaching_opportunities": ["opportunity1","opportunity2","opportunity3","opportunity4"]
  }`
}

function scriptureSection() {
  return `"scripture": {
    "esv": "Full passage text in ESV — every verse numbered",
    "niv": "Full passage text in NIV — every verse numbered",
    "nasb": "Full passage text in NASB — every verse numbered",
    "kjv": "Full passage text in KJV — every verse numbered",
    "key_verse": "The single most preachable verse with explanation of why it is the hinge",
    "verse_by_verse": [
      {"verse":"reference","notes":"Rich 3-5 sentence exegetical note — original text, translation debates, what preachers miss"},
      {"verse":"reference","notes":"3-5 sentence note"},
      {"verse":"reference","notes":"3-5 sentence note"}
    ]
  }`
}

function languageSection() {
  return `"language": [
    {"word":"Key Greek or Hebrew word","transliteration":"full transliteration","strongs":"G#### or H####","pos":"part of speech","parsing":"morphological parsing if verb","definition":"Rich 3-4 sentence definition covering semantic range, etymology, nuance","usage":"How used across the canon with specific examples","cognates":"Related words in same word family","preaching_note":"2-3 sentences on what this unlocks for the preacher"},
    {"word":"word2","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word3","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word4","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word5","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"}
  ]`
}

function historySection() {
  return `"history": {
    "political": "3-4 sentences on political environment — rulers, empires, power dynamics",
    "religious": "3-4 sentences on religious climate — sects, practices, controversies",
    "economic": "2-3 sentences on economic conditions relevant to the passage",
    "social": "3-4 sentences on social customs, honor-shame dynamics, family structures",
    "geographical": "2-3 sentences on geographical details that matter for interpretation",
    "original_audience": "4-5 sentences on what the original audience grasped that moderns miss",
    "blind_spots": "4-5 sentences on specific things modern Western readers consistently miss",
    "jewish_background": "3-4 sentences on Jewish background essential for unlocking this text",
    "greco_roman": "3-4 sentences on Greco-Roman context affecting interpretation",
    "marriage_family": "2-3 sentences on marriage or family customs if relevant",
    "intertestamental": "2-3 sentences on intertestamental period background"
  }`
}

function archaeologySection() {
  return `"archaeology": [
    {"discovery":"Real archaeological discovery or site name","location":"Specific site and region","date_found":"When discovered and by whom","relevance":"3-4 sentences on how this illuminates the passage","details":"4-5 sentences of rich archaeological detail","significance":"3-4 sentences on why this matters for preachers"},
    {"discovery":"Second discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"},
    {"discovery":"Third discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"},
    {"discovery":"Fourth discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"}
  ]`
}

function theologySection() {
  return `"theology": {
    "god": "4-5 sentences on what this passage reveals about God's nature and character",
    "christ": "4-5 sentences on Christological content — explicit or implicit",
    "holy_spirit": "3-4 sentences on pneumatological content if present",
    "salvation": "4-5 sentences on soteriological themes",
    "humanity": "3-4 sentences on anthropological content",
    "kingdom": "3-4 sentences on kingdom of God themes",
    "covenant": "3-4 sentences on covenant themes",
    "church": "3-4 sentences on ecclesiological themes if present",
    "eschatology": "3-4 sentences on eschatological themes if present",
    "biblical_theology": "5-6 sentences on how this fits the creation-fall-redemption-new creation arc",
    "systematic_connections": "4-5 sentences connecting to systematic theology",
    "practical_theology": "3-4 sentences on practical theology implications",
    "doctrinal_issues": ["Full sentence describing doctrinal issue 1","Issue 2","Issue 3","Issue 4"]
  }`
}

function crossrefSection() {
  return `"crossrefs": {
    "direct": ["ref1 — one sentence explanation","ref2 — explanation","ref3 — explanation","ref4 — explanation","ref5 — explanation"],
    "prophetic": ["ref1 — explanation","ref2 — explanation","ref3 — explanation"],
    "typological": ["ref1 — explanation","ref2 — explanation","ref3 — explanation"],
    "thematic": ["ref1 — explanation","ref2 — explanation","ref3 — explanation","ref4 — explanation"],
    "parallel_passages": ["ref1 — how it illuminates","ref2 — explanation"],
    "ot_backdrop": "Rich 4-5 sentence Old Testament backdrop",
    "nt_development": "3-4 sentences on how NT develops what this passage anticipates"
  }`
}

function christSection() {
  return `"christ": {
    "title": "Most fitting Christological title surfaced by this passage with explanation",
    "presence": "4-5 sentences on how Christ is present — explicit, implicit, typological",
    "foreshadowing": "4-5 sentences on specific images and types pointing to Christ",
    "fulfillment": "4-5 sentences on how Christ fulfills what this text anticipates",
    "gospel_thread": "5-6 sentences on the gospel thread through this passage",
    "redemptive_historical": "4-5 sentences on where this sits in redemptive history",
    "christocentric_preaching": "5-6 sentences on the legitimate exegetical path from text to Christ"
  }`
}

function commentarySection() {
  return `"commentary": {
    "matthew_henry": "4-5 sentences summarizing Matthew Henry's key observations",
    "spurgeon": "4-5 sentences on Spurgeon's approach and key insights",
    "calvin": "4-5 sentences on Calvin's theological emphasis",
    "augustine": "3-4 sentences on Augustine's interpretation",
    "luther": "3-4 sentences on Luther's emphasis if relevant",
    "modern_reformed": "4-5 sentences on modern Reformed scholarship",
    "modern_evangelical": "4-5 sentences on broader modern evangelical scholarship",
    "areas_of_agreement": "4-5 sentences where virtually all commentators agree",
    "areas_of_debate": "4-5 sentences where commentators significantly disagree",
    "best_insight": "3-4 sentences — the single most illuminating insight from commentary tradition"
  }`
}

function fathersSection() {
  return `"church_fathers": [
    {"father":"Church father name","dates":"dates of life","quote":"Substantial representative quote or close paraphrase","context":"2-3 sentences explaining the context and why it matters"},
    {"father":"Second father","dates":"dates","quote":"quote","context":"context"},
    {"father":"Third father","dates":"dates","quote":"quote","context":"context"},
    {"father":"Fourth father","dates":"dates","quote":"quote","context":"context"}
  ]`
}

function quotesSection() {
  return `"quotes": [
    {"author":"Author name","source":"Book or sermon title","quote":"Substantial relevant quote applicable to this passage","relevance":"One sentence on why this illuminates the passage"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"}
  ]`
}

function booksSection() {
  return `"books": [
    {"title":"Book title","author":"Author","type":"Commentary or Theology or Background or Devotional","description":"3-4 sentences on what this book contributes","level":"Beginner or Intermediate or Advanced or Scholar"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"}
  ]`
}

function illustrationsSection() {
  return `"illustrations": [
    {"category":"History","title":"Title","content":"Rich vivid 5-6 sentence illustration from history. Specific people, events, dates.","bridge":"3-4 sentences on how to connect to the passage"},
    {"category":"Science or Nature","title":"Title","content":"Scientific phenomenon illuminating a truth here. Surprising and specific. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Human Experience","title":"Title","content":"Universal human experience opening a window into this text. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Current Culture","title":"Title","content":"Contemporary cultural moment creating a bridge to this passage. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Church History","title":"Title","content":"Story from church history embodying this passage. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Pastoral","title":"Title","content":"Pastoral scenario where this text becomes urgent. 5-6 sentences. No real names.","bridge":"3-4 sentence bridge"},
    {"category":"Opening Hook","title":"Sermon Opening","content":"Powerful opener creating immediate tension. 5-6 sentences.","bridge":"3-4 sentences on how to transition into the text"}
  ]`
}

function newsSection() {
  return `"news": [
    {"type":"Archaeological","headline":"Recent archaeological finding related to this passage","source":"Journal or institution type","date":"Approximate date","relevance":"3-4 sentences on how this illuminates the passage","summary":"4-5 sentence summary of the finding and significance"},
    {"type":"Scholarly","headline":"Recent academic development related to this passage","source":"Academic journal type","date":"Approximate date","relevance":"3-4 sentences on why this matters for teachers","summary":"4-5 sentence summary"},
    {"type":"Cultural","headline":"Contemporary development making this passage urgently relevant today","source":"News or media type","date":"Recent","relevance":"3-4 sentences on why timely","summary":"4-5 sentences on why this matters for preaching now"},
    {"type":"Scientific","headline":"Scientific discovery illuminating a truth in this passage","source":"Scientific publication type","date":"Recent","relevance":"Relevance to passage","summary":"Summary"}
  ]`
}

function outlineSection() {
  return `"outline": {
    "title": "A compelling memorable sermon title",
    "big_idea": "The big idea as a full preachable proposition",
    "introduction": "5-6 sentences on how to open — specific hook creating tension and need",
    "points": [
      {"point":"First main point stated memorably","subpoints":["Detailed subpoint 1","Detailed subpoint 2","Detailed subpoint 3"],"illustration":"3-4 sentence illustration idea","application":"3-4 sentences of specific concrete application"},
      {"point":"Second main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"illustration","application":"application"},
      {"point":"Third main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"illustration","application":"application"}
    ],
    "conclusion": "5-6 sentences on how to land the sermon",
    "invitation": "4-5 sentences on how to invite response",
    "alternative_structures": ["Narrative approach","Problem-solution approach","Question-driven approach","Inductive approach"]
  }`
}

function manuscriptSection() {
  return `"manuscript": {
    "intro": "Full written introduction 200-250 words. Powerful hook, tension, transition into text. Real conversational preaching voice.",
    "body": "Full written body 800-1000 words. All three points developed with transitions, illustrations embedded, application woven throughout. Real preaching voice.",
    "conclusion": "Full written conclusion 200-250 words. Landing the big idea, gospel clarity, specific call to action."
  }`
}

function smallgroupSection() {
  return `"smallgroup": {
    "icebreaker": "Fun low-stakes opening question connecting to passage theme",
    "context_setter": "2-3 sentences a leader can read to set up the passage",
    "questions": [
      {"type":"Observation","question":"What does the text actually say — factual grounding"},
      {"type":"Observation","question":"Second observation — something easy to overlook"},
      {"type":"Observation","question":"Third observation about structure or flow"},
      {"type":"Interpretation","question":"What does this mean — deeper meaning question"},
      {"type":"Interpretation","question":"Why did the author say it this way"},
      {"type":"Interpretation","question":"What would the original audience have understood"},
      {"type":"Interpretation","question":"A question about a difficult element"},
      {"type":"Application","question":"Where do you see this truth most needed in your life"},
      {"type":"Application","question":"What would it look like to live this out this week"},
      {"type":"Application","question":"Who in your life needs to hear this"},
      {"type":"Prayer","question":"Based on this passage what do you want to ask God for"}
    ],
    "activity": "Creative group activity bringing the passage to life",
    "deeper_study": ["Resource or question for deeper study 1","Suggestion 2","Suggestion 3"],
    "takeaway": "The one sentence every group member should carry with them all week"
  }`
}

function youthSection() {
  return `"youth": {
    "big_truth": "Main truth in language a 16-year-old finds compelling",
    "cultural_hook": "Specific cultural reference or issue teens face that connects to this passage",
    "game": "Specific game or activity that sets up the passage — instructions included",
    "object_lesson": {"object":"Specific object","lesson":"Step-by-step instructions on how to use it"},
    "discussion_questions": ["Question teens will actually engage with","Second question","Third question","Challenge question for mature students"],
    "challenge": "Specific challenge for the week — something teens can actually do",
    "memory_verse": "Best memory verse for teens with explanation"
  }`
}

function childrenSection() {
  return `"children": {
    "big_truth": "One truth in words a 7-year-old completely understands",
    "memory_verse": "Best short memory verse with reference",
    "story_retelling": "Vivid present-tense retelling as children's story — 150-200 words, written to be read aloud",
    "object_lesson": {"object":"Simple household object","lesson":"Step-by-step instructions"},
    "craft_idea": "Specific craft with materials list and instructions",
    "activity": "Active game or physical activity — specific instructions",
    "snack_idea": "Snack connecting to passage theme with explanation",
    "discussion_questions": ["Age-appropriate question for ages 6-10","Second question","Third question"],
    "parent_connection": "Specific take-home prompt — dinner question, bedtime prayer, or family challenge"
  }`
}

// ─── SECTION MAP ──────────────────────────────────────────────────────────────

const SECTION_BUILDERS: Record<string, () => string> = {
  overview:     overviewSection,
  scripture:    scriptureSection,
  language:     languageSection,
  history:      historySection,
  archaeology:  archaeologySection,
  theology:     theologySection,
  crossref:     crossrefSection,
  christ:       christSection,
  commentary:   commentarySection,
  fathers:      fathersSection,
  quotes:       quotesSection,
  books:        booksSection,
  illustrations: illustrationsSection,
  news:         newsSection,
  outline:      outlineSection,
  manuscript:   manuscriptSection,
  smallgroup:   smallgroupSection,
  youth:        youthSection,
  children:     childrenSection,
}

// Split tabs into two roughly equal groups for two API calls
const PART_1_TABS = ['overview','scripture','language','history','archaeology','theology']
const PART_2_TABS = ['crossref','christ','commentary','fathers','quotes','books','illustrations','news','outline','manuscript','smallgroup','youth','children']

export function buildPrompt(passage: string, tabs: string[], part: 1 | 2): string {
  const partTabs = (part === 1 ? PART_1_TABS : PART_2_TABS).filter(t => tabs.includes(t))
  if (partTabs.length === 0) return ''

  const sections = partTabs
    .map(tab => SECTION_BUILDERS[tab]?.())
    .filter(Boolean)
    .join(',\n  ')

  return `You are a world-class biblical scholar, theologian, and preaching coach. A Bible teacher is studying: "${passage}"

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Begin with { and end with }.

{
  "passage": "${passage}",
  ${sections}
}`
}
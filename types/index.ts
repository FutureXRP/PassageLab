// ─── STUDY DATA ──────────────────────────────────────────────

export interface StudyOverview {
  summary: string
  main_idea: string
  author: string
  audience: string
  date: string
  setting: string
  purpose: string
  literary_genre: string
  themes: string[]
  teaching_opportunities: string[]
}

export interface ScriptureVerse {
  verse: string
  notes: string
}

export interface StudyScripture {
  esv: string
  niv: string
  key_verse: string
  verse_by_verse: ScriptureVerse[]
}

export interface LanguageWord {
  word: string
  transliteration: string
  strongs: string
  definition: string
  usage: string
  preaching_note: string
}

export interface StudyHistory {
  political: string
  religious: string
  economic: string
  social: string
  geographical: string
  original_audience: string
  blind_spots: string
  jewish_background: string
  greco_roman: string
}

export interface ArchaeologyItem {
  discovery: string
  location: string
  date_found: string
  relevance: string
  details: string
  significance: string
}

export interface StudyTheology {
  god: string
  christ: string
  holy_spirit: string
  salvation: string
  humanity: string
  kingdom: string
  covenant: string
  biblical_theology: string
  systematic_connections: string
  doctrinal_issues: string[]
}

export interface StudyCrossRefs {
  direct: string[]
  prophetic: string[]
  typological: string[]
  thematic: string[]
  ot_backdrop: string
  nt_connection: string
}

export interface StudyChrist {
  title: string
  presence: string
  foreshadowing: string
  fulfillment: string
  gospel_thread: string
  redemptive_historical: string
  christocentric_preaching: string
}

export interface StudyCommentary {
  spurgeon: string
  matthew_henry: string
  calvin: string
  modern_evangelical: string
  areas_of_agreement: string
  areas_of_debate: string
  best_insight: string
}

export interface Illustration {
  category: string
  title: string
  content: string
  bridge: string
}

export interface NewsItem {
  type: string
  headline: string
  source: string
  relevance: string
  summary: string
}

export interface SermonPoint {
  point: string
  subpoints: string[]
  illustration: string
  application: string
}

export interface StudyOutline {
  title: string
  big_idea: string
  introduction: string
  points: SermonPoint[]
  conclusion: string
  invitation: string
  alternative_structures: string[]
}

export interface StudyManuscript {
  intro: string
  body: string
  conclusion: string
}

export interface SmallGroupQuestion {
  type: string
  question: string
}

export interface StudySmallGroup {
  icebreaker: string
  questions: SmallGroupQuestion[]
  activity: string
  takeaway: string
}

export interface StudyChildren {
  big_truth: string
  memory_verse: string
  story_retelling: string
  object_lesson: { object: string; lesson: string }
  craft_idea: string
  activity: string
  discussion_questions: string[]
  parent_connection: string
}

export interface StudyData {
  passage: string
  overview: StudyOverview
  scripture: StudyScripture
  language: LanguageWord[]
  history: StudyHistory
  archaeology: ArchaeologyItem[]
  theology: StudyTheology
  crossrefs: StudyCrossRefs
  christ: StudyChrist
  commentary: StudyCommentary
  illustrations: Illustration[]
  news: NewsItem[]
  outline: StudyOutline
  manuscript: StudyManuscript
  smallgroup: StudySmallGroup
  children: StudyChildren
}

// ─── DATABASE TYPES ───────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: 'free' | 'pro'
  study_count: number
  created_at: string
  updated_at: string
}

export interface Study {
  id: string
  user_id: string
  passage: string
  data: StudyData
  is_saved: boolean
  created_at: string
}

export interface Usage {
  id: string
  user_id: string
  month: string
  study_count: number
}

// ─── FREE TIER ────────────────────────────────────────────────

export const FREE_TIER_LIMIT = 5 // studies per month

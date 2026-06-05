export const PROMPT_PART_1 = (passage: string) => `You are a biblical scholar. Passage: "${passage}"

Return ONLY raw JSON. No markdown. No backticks. Start with { end with }.

{
  "passage": "${passage}",
  "overview": {
    "summary": "2-3 sentence summary",
    "main_idea": "One sentence big idea",
    "author": "Author name",
    "audience": "Original audience",
    "date": "Approximate date",
    "setting": "1-2 sentence setting",
    "purpose": "Why this was written",
    "literary_genre": "Genre",
    "themes": ["theme1","theme2","theme3"],
    "teaching_opportunities": ["opportunity1","opportunity2"]
  },
  "scripture": {
    "esv": "Full passage in ESV",
    "niv": "Full passage in NIV",
    "key_verse": "Most preachable verse",
    "verse_by_verse": [
      {"verse":"reference","notes":"Key exegetical note"},
      {"verse":"reference","notes":"Key exegetical note"}
    ]
  },
  "language": [
    {"word":"Greek/Hebrew word","transliteration":"translit","strongs":"G####","definition":"Definition","usage":"Usage","preaching_note":"Preaching insight"},
    {"word":"word2","transliteration":"translit","strongs":"G####","definition":"def","usage":"usage","preaching_note":"note"}
  ],
  "history": {
    "political": "Political context",
    "religious": "Religious climate",
    "economic": "Economic context",
    "social": "Social customs",
    "geographical": "Geography",
    "original_audience": "What original audience understood",
    "blind_spots": "What moderns miss",
    "jewish_background": "Jewish background",
    "greco_roman": "Greco-Roman context"
  },
  "archaeology": [
    {"discovery":"Discovery name","location":"Location","date_found":"Date","relevance":"Relevance","details":"Details","significance":"Significance"}
  ],
  "theology": {
    "god": "What this reveals about God",
    "christ": "Christological content",
    "holy_spirit": "Spirit content",
    "salvation": "Salvation themes",
    "humanity": "Human nature",
    "kingdom": "Kingdom themes",
    "covenant": "Covenant themes",
    "biblical_theology": "Biblical theology arc",
    "systematic_connections": "Systematic theology",
    "doctrinal_issues": ["issue1","issue2"]
  }
}`

export const PROMPT_PART_2 = (passage: string) => `You are a biblical scholar. Passage: "${passage}"

Return ONLY raw JSON. No markdown. No backticks. Start with { end with }.

{
  "crossrefs": {
    "direct": ["ref1","ref2","ref3"],
    "prophetic": ["ref1","ref2"],
    "typological": ["ref1","ref2"],
    "thematic": ["ref1","ref2","ref3"],
    "ot_backdrop": "OT backdrop",
    "nt_connection": "OT/NT connection"
  },
  "christ": {
    "title": "Christological title",
    "presence": "Christ's presence",
    "foreshadowing": "Foreshadowing",
    "fulfillment": "Fulfillment",
    "gospel_thread": "Gospel thread",
    "redemptive_historical": "Redemptive history location",
    "christocentric_preaching": "How to preach Christ from this text"
  },
  "commentary": {
    "spurgeon": "Spurgeon insight",
    "matthew_henry": "Matthew Henry insight",
    "calvin": "Calvin insight",
    "modern_evangelical": "Modern scholarship",
    "areas_of_agreement": "Where commentators agree",
    "areas_of_debate": "Where they disagree",
    "best_insight": "Best single insight"
  },
  "illustrations": [
    {"category":"History","title":"Title","content":"2-3 sentence illustration","bridge":"Connection to passage"},
    {"category":"Human Experience","title":"Title","content":"2-3 sentence illustration","bridge":"Connection"},
    {"category":"Opening Hook","title":"Sermon Opening","content":"2-3 sentence opener","bridge":"Transition to text"}
  ],
  "news": [
    {"type":"Archaeological","headline":"Finding headline","source":"Source type","relevance":"Relevance","summary":"2 sentence summary"}
  ],
  "outline": {
    "title": "Sermon title",
    "big_idea": "Big idea proposition",
    "introduction": "How to open",
    "points": [
      {"point":"First point","subpoints":["sub1","sub2"],"illustration":"Illustration idea","application":"Application"},
      {"point":"Second point","subpoints":["sub1","sub2"],"illustration":"Illustration idea","application":"Application"},
      {"point":"Third point","subpoints":["sub1","sub2"],"illustration":"Illustration idea","application":"Application"}
    ],
    "conclusion": "How to close",
    "invitation": "Call to response",
    "alternative_structures": ["Narrative approach","Problem-solution"]
  },
  "manuscript": {
    "intro": "50-75 word introduction in preaching voice",
    "body": "150-200 word body in preaching voice",
    "conclusion": "50-75 word conclusion in preaching voice"
  },
  "smallgroup": {
    "icebreaker": "Opening question",
    "questions": [
      {"type":"Observation","question":"What does the text say"},
      {"type":"Interpretation","question":"What does it mean"},
      {"type":"Application","question":"How do we live this"},
      {"type":"Prayer","question":"Prayer prompt"}
    ],
    "activity": "Group activity",
    "takeaway": "Key takeaway"
  },
  "children": {
    "big_truth": "Truth for 7-year-olds",
    "memory_verse": "Memory verse",
    "story_retelling": "50-75 word retelling",
    "object_lesson": {"object":"Household object","lesson":"How to teach with it"},
    "craft_idea": "Simple craft",
    "activity": "Activity or game",
    "discussion_questions": ["Question 1","Question 2"],
    "parent_connection": "Parent take-home"
  }
}`

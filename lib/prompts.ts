// ─── PROMPT ARCHITECTURE ─────────────────────────────────────
// Two sequential calls to stay within token limits.
// Call 1: Overview, Scripture, Language, History, Archaeology, Theology
// Call 2: CrossRefs, Christ, Commentary, Illustrations, News, Outline, Manuscript, SmallGroup, Children

export const PROMPT_PART_1 = (passage: string) => `You are a world-class biblical scholar, theologian, and preaching coach. A pastor is deeply studying: "${passage}"

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Begin with { and end with }.

{
  "passage": "${passage}",
  "overview": {
    "summary": "Rich 3-4 sentence summary capturing the full arc and significance",
    "main_idea": "One crisp unforgettable big idea sentence — what you would preach",
    "author": "Author name and brief background note",
    "audience": "Detailed original audience description",
    "date": "Approximate date written with historical context",
    "setting": "Rich 2-3 sentence historical and geographical setting",
    "purpose": "Why this passage was written — the author's intent",
    "literary_genre": "Genre and how it shapes interpretation",
    "themes": ["theme1","theme2","theme3","theme4","theme5"],
    "teaching_opportunities": ["opportunity1","opportunity2","opportunity3"]
  },
  "scripture": {
    "esv": "Full passage text in ESV — every verse",
    "niv": "Full passage text in NIV — every verse",
    "key_verse": "The single most preachable verse from this passage",
    "verse_by_verse": [
      {"verse":"verse reference","notes":"Exegetical notes — what the original text reveals, what translators wrestle with, what preachers often miss"},
      {"verse":"verse reference","notes":"notes"},
      {"verse":"verse reference","notes":"notes"}
    ]
  },
  "language": [
    {"word":"Key Greek or Hebrew word","transliteration":"transliteration","strongs":"G#### or H####","definition":"Rich nuanced definition with full semantic range","usage":"How this word appears elsewhere in Scripture and what that reveals","preaching_note":"What this word specifically unlocks for the preacher"},
    {"word":"word2","transliteration":"t","strongs":"G####","definition":"def","usage":"usage","preaching_note":"note"},
    {"word":"word3","transliteration":"t","strongs":"G####","definition":"def","usage":"usage","preaching_note":"note"},
    {"word":"word4","transliteration":"t","strongs":"G####","definition":"def","usage":"usage","preaching_note":"note"}
  ],
  "history": {
    "political": "Political environment — rulers empires power dynamics",
    "religious": "Religious climate — sects practices controversies",
    "economic": "Economic conditions relevant to understanding the passage",
    "social": "Social customs honor-shame dynamics family structures",
    "geographical": "Geographical details that matter for interpretation",
    "original_audience": "What the original audience immediately grasped that modern readers miss",
    "blind_spots": "3-4 specific things modern Western readers consistently miss",
    "jewish_background": "Specific Jewish background knowledge that unlocks this text",
    "greco_roman": "Greco-Roman context affecting interpretation"
  },
  "archaeology": [
    {"discovery":"Name of real archaeological discovery or site","location":"Where found","date_found":"When discovered","relevance":"How this directly illuminates the passage","details":"What was found and what scholars concluded","significance":"Why this matters for preachers and teachers"},
    {"discovery":"Second discovery","location":"loc","date_found":"date","relevance":"rel","details":"det","significance":"sig"},
    {"discovery":"Third discovery","location":"loc","date_found":"date","relevance":"rel","details":"det","significance":"sig"}
  ],
  "theology": {
    "god": "What this passage reveals about God's nature and character",
    "christ": "Christological content — explicit or implicit",
    "holy_spirit": "Pneumatological content if present",
    "salvation": "Soteriological themes",
    "humanity": "What this reveals about human nature",
    "kingdom": "Kingdom of God themes",
    "covenant": "Covenant themes and connections",
    "biblical_theology": "How this fits the creation-fall-redemption-new creation arc",
    "systematic_connections": "Systematic theology category connections",
    "doctrinal_issues": ["doctrinal debate or issue 1","issue 2","issue 3"]
  }
}`

export const PROMPT_PART_2 = (passage: string) => `You are a world-class biblical scholar, theologian, and preaching coach. Passage: "${passage}"

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Begin with { and end with }.

{
  "crossrefs": {
    "direct": ["ref1","ref2","ref3","ref4","ref5"],
    "prophetic": ["ref1","ref2","ref3"],
    "typological": ["ref1","ref2"],
    "thematic": ["ref1","ref2","ref3","ref4"],
    "ot_backdrop": "Rich 2-3 sentence Old Testament backdrop",
    "nt_connection": "How OT and NT relate in this passage"
  },
  "christ": {
    "title": "Most fitting Christological title surfaced by this passage",
    "presence": "How Christ is present — explicit or typological",
    "foreshadowing": "Specific images types themes pointing to Christ",
    "fulfillment": "How Christ fulfills what this text anticipates",
    "gospel_thread": "The gospel thread — creation fall redemption restoration",
    "redemptive_historical": "Where this passage sits in redemptive history",
    "christocentric_preaching": "How to get to Christ without allegorizing — the legitimate exegetical path"
  },
  "commentary": {
    "spurgeon": "Key insights from Spurgeon and 19th century tradition on this passage",
    "matthew_henry": "Matthew Henry's key observations",
    "calvin": "Calvin's theological emphasis",
    "modern_evangelical": "What modern evangelical scholarship emphasizes",
    "areas_of_agreement": "Where virtually all commentators agree",
    "areas_of_debate": "Where commentators disagree and why — the real interpretive forks",
    "best_insight": "The single most illuminating insight from the commentary tradition"
  },
  "illustrations": [
    {"category":"History","title":"Title","content":"Rich vivid 4-5 sentence illustration from history. Specific people events dates. Emotionally resonant.","bridge":"How to connect this to the passage"},
    {"category":"Science or Nature","title":"Title","content":"A scientific or natural phenomenon illuminating a truth in this passage. Surprising and specific. 4-5 sentences.","bridge":"Connection to the passage"},
    {"category":"Human Experience","title":"Title","content":"A universal human experience opening a window into this text. The congregation will immediately recognize it. 4-5 sentences.","bridge":"Connection"},
    {"category":"Current Culture","title":"Title","content":"A contemporary cultural moment film book or trend creating a bridge. 4-5 sentences.","bridge":"Connection"},
    {"category":"Church History","title":"Title","content":"A story from church history — martyr reformer missionary — embodying this passage. 4-5 sentences.","bridge":"Connection"},
    {"category":"Opening Hook","title":"Sermon Opening","content":"A powerful opener — question scenario or statement — creating immediate engagement. 4-5 sentences.","bridge":"How to transition into the text"}
  ],
  "news": [
    {"type":"Archaeological","headline":"Recent or representative archaeological finding related to this passage or setting","source":"Journal or publication type","relevance":"How this illuminates the passage","summary":"3-4 sentence summary of the finding and significance for biblical study"},
    {"type":"Scholarly","headline":"Recent academic development in study of this passage or its context","source":"Academic source type","relevance":"Why it matters for teachers","summary":"Summary of the development"},
    {"type":"Cultural","headline":"Contemporary news story or cultural development making this passage urgently relevant today","source":"News type","relevance":"Why this makes the passage timely","summary":"Why this matters right now for preaching"}
  ],
  "outline": {
    "title": "A compelling memorable sermon title",
    "big_idea": "Big idea restated as a preachable proposition",
    "introduction": "How to open — hook question or scenario creating tension",
    "points": [
      {"point":"First main point stated memorably","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"Brief illustration idea","application":"Specific concrete application"},
      {"point":"Second main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"Brief illustration idea","application":"Specific concrete application"},
      {"point":"Third main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"Brief illustration idea","application":"Specific concrete application"}
    ],
    "conclusion": "How to land the sermon — the closing movement",
    "invitation": "How to invite response — what does faithfulness to this text look like in action",
    "alternative_structures": ["Narrative structure approach","Problem-solution structure","Question-driven structure"]
  },
  "manuscript": {
    "intro": "Full written introduction 150-200 words. Hook tension transition into the text. Conversational preaching voice — not academic.",
    "body": "Full written body 400-500 words. Main points with transitions illustrations embedded application woven throughout. Real preaching voice.",
    "conclusion": "Full written conclusion 100-150 words. Landing the big idea gospel clarity specific call to action."
  },
  "smallgroup": {
    "icebreaker": "Fun low-stakes opening question connecting to passage theme without requiring Bible knowledge",
    "questions": [
      {"type":"Observation","question":"What does the text actually say — factual grounding question"},
      {"type":"Observation","question":"Second observation — something easy to overlook"},
      {"type":"Interpretation","question":"What does this mean — deeper meaning question"},
      {"type":"Interpretation","question":"Why did the author say it this way — literary choice question"},
      {"type":"Interpretation","question":"What would the original audience have understood that we miss"},
      {"type":"Application","question":"Where do you see this truth most needed in your own life right now"},
      {"type":"Application","question":"What would it look like to live this out specifically this week"},
      {"type":"Application","question":"Who in your life needs to hear the truth of this passage"},
      {"type":"Prayer","question":"Based on this passage what is one thing you want to ask God for this week"}
    ],
    "activity": "Creative group activity or exercise that brings the passage to life",
    "takeaway": "The one thing you want every group member to leave with"
  },
  "children": {
    "big_truth": "One truth from this passage in words a 7-year-old understands",
    "memory_verse": "Best memory verse for children with reference",
    "story_retelling": "Vivid present-tense retelling as a children's story. Engaging sensory age-appropriate. 100-150 words.",
    "object_lesson": {"object":"Simple household object","lesson":"How to use it to teach the main truth — step by step"},
    "craft_idea": "Simple craft that reinforces the lesson",
    "activity": "Active game or activity that teaches the passage",
    "discussion_questions": ["Simple question for ages 6-10","Second question","Third question"],
    "parent_connection": "Take-home prompt for parents to continue the conversation at dinner or bedtime"
  }
}`

export const PROMPT_PART_1 = (passage: string) => `You are a world-class biblical scholar, theologian, archaeologist, and seminary professor. A pastor is deeply studying: "${passage}"

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Begin with { and end with }.

{
  "passage": "${passage}",
  "overview": {
    "summary": "Rich 4-5 sentence summary capturing the full arc, narrative flow, and theological significance of the passage",
    "main_idea": "One crisp unforgettable big idea sentence — the single proposition a preacher would preach",
    "author": "Author name, background, writing context, and why that matters for interpretation",
    "audience": "Detailed original audience description — who they were, what they believed, what pressures they faced",
    "date": "Approximate date written with full historical context explaining why that date matters",
    "setting": "Rich 3-4 sentence historical, geographical, and cultural setting",
    "purpose": "Why this passage was written — the author's specific intent and what problem or question it addresses",
    "literary_genre": "Genre identification and full explanation of how genre shapes interpretation and preaching approach",
    "literary_structure": "How the passage is structured — chiasm, inclusio, parallel structure, narrative arc, or argument flow",
    "themes": ["theme1","theme2","theme3","theme4","theme5","theme6"],
    "teaching_opportunities": ["opportunity1","opportunity2","opportunity3","opportunity4"]
  },
  "scripture": {
    "esv": "Full passage text in ESV — every verse numbered",
    "niv": "Full passage text in NIV — every verse numbered",
    "nasb": "Full passage text in NASB — every verse numbered",
    "kjv": "Full passage text in KJV — every verse numbered",
    "key_verse": "The single most preachable verse with explanation of why it is the hinge of the passage",
    "verse_by_verse": [
      {"verse":"verse reference","notes":"Rich 3-5 sentence exegetical note — what the original text reveals, what translators wrestle with, what different manuscripts say, what preachers consistently miss, and what the verse contributes to the overall argument"},
      {"verse":"verse reference","notes":"3-5 sentence note"},
      {"verse":"verse reference","notes":"3-5 sentence note"},
      {"verse":"verse reference","notes":"3-5 sentence note"}
    ]
  },
  "language": [
    {"word":"Key Greek or Hebrew word","transliteration":"full transliteration","strongs":"G#### or H####","pos":"part of speech","parsing":"full morphological parsing if verb","definition":"Rich 3-4 sentence definition covering full semantic range, etymology, and nuance","usage":"How this word is used across the canon — specific examples with references that illuminate the meaning in this passage","cognates":"Related words in the same word family and what they reveal","preaching_note":"2-3 sentences on what this word specifically unlocks for the preacher and congregation"},
    {"word":"word2","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word3","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word4","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"},
    {"word":"word5","transliteration":"t","strongs":"G####","pos":"pos","parsing":"parsing","definition":"definition","usage":"usage","cognates":"cognates","preaching_note":"note"}
  ],
  "history": {
    "political": "3-4 sentence description of political environment — rulers, empires, power dynamics, political tensions that directly affect interpretation",
    "religious": "3-4 sentence description of religious climate — competing sects, practices, controversies, expectations that illuminate the passage",
    "economic": "2-3 sentences on economic conditions — wealth, poverty, trade, taxation relevant to understanding the passage",
    "social": "3-4 sentences on social customs, honor-shame dynamics, family structures, gender roles, patron-client relationships that directly affect the text",
    "geographical": "2-3 sentences on geographical details that matter for interpretation — distances, terrain, climate, significance of locations",
    "original_audience": "4-5 sentences on what the original audience immediately grasped that modern readers consistently miss — specific cultural knowledge they brought to the text",
    "blind_spots": "4-5 sentences on specific things modern Western readers miss or misread — cultural assumptions we bring that distort the text",
    "jewish_background": "3-4 sentences on Jewish background knowledge essential for unlocking this text — OT allusions, rabbinic traditions, Second Temple Judaism",
    "greco_roman": "3-4 sentences on Greco-Roman context affecting interpretation — philosophy, rhetoric, social institutions, religious practices",
    "marriage_family": "2-3 sentences on marriage, family, or household customs relevant to the passage if applicable",
    "intertestamental": "2-3 sentences on relevant intertestamental period developments that form the immediate background of the passage"
  },
  "archaeology": [
    {"discovery":"Name of real archaeological discovery, excavation, or artifact","location":"Specific site and region","date_found":"When discovered and by whom","relevance":"3-4 sentences on how this directly illuminates the passage — what it confirms, clarifies, or challenges","details":"4-5 sentences of rich archaeological detail — what was found, what condition, what the scholars concluded, what the debate is","significance":"3-4 sentences on why this matters for preachers and teachers — what it does to the text when you know this"},
    {"discovery":"Second discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"},
    {"discovery":"Third discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"},
    {"discovery":"Fourth discovery","location":"loc","date_found":"date","relevance":"relevance","details":"details","significance":"significance"}
  ],
  "theology": {
    "god": "4-5 sentences on what this passage reveals about the nature, character, and acts of God — specific attributes on display",
    "christ": "4-5 sentences on Christological content — explicit or implicit, how Christ relates to this text",
    "holy_spirit": "3-4 sentences on pneumatological content if present — the Spirit's role and work in this passage",
    "salvation": "4-5 sentences on soteriological themes — what this reveals about sin, grace, faith, redemption, justification, sanctification",
    "humanity": "3-4 sentences on anthropological content — what this reveals about human nature, sin, dignity, responsibility",
    "kingdom": "3-4 sentences on kingdom of God themes — present and future dimensions",
    "covenant": "3-4 sentences on covenant themes — which covenant, how it applies, what it demands and promises",
    "church": "3-4 sentences on ecclesiological themes if present — community, body life, mission",
    "eschatology": "3-4 sentences on eschatological themes if present — judgment, hope, new creation",
    "biblical_theology": "5-6 sentences on how this passage fits the grand sweep of biblical theology — creation, fall, redemption, new creation — and where it sits in the progressive unfolding of God's plan",
    "systematic_connections": "4-5 sentences connecting this passage to systematic theology categories — how it contributes to doctrine",
    "practical_theology": "3-4 sentences on practical theology implications — how this shapes Christian living, ethics, community",
    "doctrinal_issues": ["Full sentence describing doctrinal debate or issue this passage addresses","Second doctrinal issue","Third doctrinal issue","Fourth doctrinal issue"]
  }
}`

export const PROMPT_PART_2 = (passage: string) => `You are a world-class biblical scholar, theologian, and preaching coach. Passage: "${passage}"

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Begin with { and end with }.

{
  "crossrefs": {
    "direct": ["ref1 — one sentence explanation of connection","ref2 — explanation","ref3 — explanation","ref4 — explanation","ref5 — explanation"],
    "prophetic": ["ref1 — explanation","ref2 — explanation","ref3 — explanation"],
    "typological": ["ref1 — explanation","ref2 — explanation","ref3 — explanation"],
    "thematic": ["ref1 — explanation","ref2 — explanation","ref3 — explanation","ref4 — explanation"],
    "parallel_passages": ["ref1 — how this parallel illuminates","ref2 — explanation"],
    "ot_backdrop": "Rich 4-5 sentence Old Testament backdrop — the specific OT texts, themes, and promises that form the foundation of this passage",
    "nt_development": "3-4 sentences on how the NT develops or fulfills what this passage anticipates, or how this NT passage builds on OT foundations"
  },
  "christ": {
    "title": "The most fitting Christological title surfaced by this passage with explanation",
    "presence": "4-5 sentences on how Christ is present in this text — explicit statements, implicit presence, typological foreshadowing",
    "foreshadowing": "4-5 sentences on specific images, types, themes, and patterns that point forward to Christ — detailed and specific",
    "fulfillment": "4-5 sentences on how Christ fulfills what this text anticipates — specific connections",
    "gospel_thread": "5-6 sentences on the gospel thread running through this passage — creation, fall, redemption, restoration — and how the good news of Jesus emerges from this specific text",
    "redemptive_historical": "4-5 sentences on where this passage sits in redemptive history and what that location means for preaching",
    "christocentric_preaching": "5-6 sentences on the legitimate exegetical path from this text to Christ — how to preach Christ without allegorizing or forcing the connection"
  },
  "commentary": {
    "matthew_henry": "4-5 sentences summarizing Matthew Henry's key observations and emphases on this passage",
    "spurgeon": "4-5 sentences on Spurgeon's approach and key insights — what he emphasized and what illustrations he used",
    "calvin": "4-5 sentences on Calvin's theological emphasis and exegetical moves in this passage",
    "augustine": "3-4 sentences on Augustine's interpretation if he commented on this passage",
    "luther": "3-4 sentences on Luther's emphasis if relevant to this passage",
    "modern_reformed": "4-5 sentences on what modern Reformed scholarship (Carson, Piper, Sproul) emphasizes in this passage",
    "modern_evangelical": "4-5 sentences on broader modern evangelical scholarship — key interpretive debates and consensus positions",
    "areas_of_agreement": "4-5 sentences on where virtually all commentators across traditions agree",
    "areas_of_debate": "4-5 sentences on where commentators significantly disagree — the real interpretive forks and why they matter",
    "best_insight": "The single most illuminating insight from the entire commentary tradition on this passage — 3-4 sentences"
  },
  "church_fathers": [
    {"father":"Church father name","dates":"dates of life","quote":"A substantial representative quote or close paraphrase of their interpretation of this passage","context":"2-3 sentences explaining the context of their interpretation and why it matters"},
    {"father":"Second father","dates":"dates","quote":"quote or paraphrase","context":"context"},
    {"father":"Third father","dates":"dates","quote":"quote or paraphrase","context":"context"},
    {"father":"Fourth father","dates":"dates","quote":"quote or paraphrase","context":"context"}
  ],
  "quotes": [
    {"author":"Author name","source":"Book or sermon title","quote":"Substantial relevant quote directly applicable to this passage or its themes","relevance":"One sentence on why this quote illuminates the passage"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"},
    {"author":"author","source":"source","quote":"quote","relevance":"relevance"}
  ],
  "books": [
    {"title":"Book title","author":"Author","type":"Commentary or Theology or Background or Devotional","description":"3-4 sentences on what this book contributes to understanding this passage — what makes it valuable, what perspective it brings, what level of reader it suits","level":"Beginner or Intermediate or Advanced or Scholar"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"},
    {"title":"title","author":"author","type":"type","description":"description","level":"level"}
  ],
  "illustrations": [
    {"category":"History","title":"Illustration title","content":"Rich vivid 5-6 sentence illustration from history. Specific people, events, dates, places. Emotionally resonant and theologically precise.","bridge":"3-4 sentences on how to connect this illustration to the passage — the explicit link"},
    {"category":"Science or Nature","title":"Title","content":"A scientific or natural phenomenon that illuminates a truth in this passage. Surprising, specific, and counterintuitive. 5-6 sentences.","bridge":"3-4 sentence bridge to passage"},
    {"category":"Human Experience","title":"Title","content":"A universal human experience that opens a window into this text. Something a congregation of any background will immediately recognize. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Current Culture","title":"Title","content":"A contemporary cultural moment, film, book, news story, or trend that creates a bridge to this passage. Specific and current. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Church History","title":"Title","content":"A story from church history — martyr, reformer, missionary, theologian — that embodies this passage. 5-6 sentences.","bridge":"3-4 sentence bridge"},
    {"category":"Pastoral","title":"Title","content":"A pastoral scenario or counseling situation that brings the passage to life — the kind of real-life moment where this text becomes urgent. 5-6 sentences. Protect privacy — no real names.","bridge":"3-4 sentence bridge"},
    {"category":"Opening Hook","title":"Sermon Opening","content":"A powerful sermon opening — a question, scenario, cultural moment, or statement — that creates immediate tension and engagement and sets up the passage. 5-6 sentences.","bridge":"3-4 sentences on how to transition from this opening into the text"}
  ],
  "news": [
    {"type":"Archaeological","headline":"Specific recent or representative archaeological finding related to this passage or its setting","source":"Journal, institution, or publication type","date":"Approximate date of finding","relevance":"3-4 sentences on how this finding directly illuminates the passage","summary":"4-5 sentence summary of the finding, what was discovered, what scholars concluded, and why it matters for biblical study"},
    {"type":"Scholarly","headline":"Recent academic development, commentary publication, or interpretive debate related to this passage","source":"Academic journal or institution type","date":"Approximate date","relevance":"3-4 sentences on why this development matters for teachers and preachers","summary":"4-5 sentence summary"},
    {"type":"Cultural","headline":"Contemporary news story, social trend, or cultural development that makes this passage urgently relevant today","source":"News or media type","date":"Recent","relevance":"3-4 sentences on why this makes the passage timely","summary":"4-5 sentences on why this matters for preaching right now"},
    {"type":"Scientific","headline":"Scientific discovery or development that illuminates a truth in this passage","source":"Scientific publication type","date":"Recent","relevance":"Relevance to passage","summary":"Summary of significance"}
  ],
  "outline": {
    "title": "A compelling, memorable, alliterative or hook-based sermon title",
    "big_idea": "The big idea restated as a full preachable proposition — a complete sentence that captures the whole sermon",
    "introduction": "5-6 sentences describing how to open the sermon — a specific hook, question, scenario, or cultural moment that creates tension and need for the passage",
    "points": [
      {"point":"First main point — stated memorably, alliteratively if possible","subpoints":["Detailed subpoint 1 with exegetical grounding","Detailed subpoint 2","Detailed subpoint 3"],"illustration":"3-4 sentence illustration idea specifically suited to this point","application":"3-4 sentences of specific concrete application — not generic but pointed"},
      {"point":"Second main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"illustration","application":"application"},
      {"point":"Third main point","subpoints":["subpoint1","subpoint2","subpoint3"],"illustration":"illustration","application":"application"}
    ],
    "conclusion": "5-6 sentences on how to land the sermon — the closing movement, the final image, how to bring everything together",
    "invitation": "4-5 sentences on how to invite response — what does faithfulness to this text look like in concrete action this week",
    "alternative_structures": ["Narrative structure: describe the full narrative arc approach for this passage","Problem-solution: describe the problem this passage addresses and how it resolves","Question-driven: list 3 questions this passage answers and how to structure around them","Inductive: how to let the congregation discover the big idea rather than stating it upfront"]
  },
  "manuscript": {
    "intro": "Full written introduction — 200-250 words. A powerful hook, the tension that sets up the passage, transition into the text. Written in real conversational preaching voice — not academic, not stiff. Sounds like a gifted communicator speaking to a congregation.",
    "body": "Full written body — 800-1000 words. All three main points developed in full with transitions, illustrations embedded naturally, application woven throughout, and theological depth that doesn't feel like a lecture. Real preaching voice throughout.",
    "conclusion": "Full written conclusion — 200-250 words. Landing the big idea with clarity and force. Gospel application. Specific call to action. A final image or sentence that will stay with the congregation."
  },
  "smallgroup": {
    "icebreaker": "A fun, low-stakes opening question that connects to the passage theme without requiring any Bible knowledge",
    "context_setter": "2-3 sentences a small group leader can read to set up the passage for people who may not have heard the sermon",
    "questions": [
      {"type":"Observation","question":"What does the text actually say — a specific factual question that forces people into the text"},
      {"type":"Observation","question":"A second observation question noticing something easy to overlook"},
      {"type":"Observation","question":"A third observation question about the structure or flow of the passage"},
      {"type":"Interpretation","question":"What does this mean — a deeper question about the text's meaning"},
      {"type":"Interpretation","question":"Why did the author say it this way — a question about literary or theological choices"},
      {"type":"Interpretation","question":"What would the original audience have understood that we might miss"},
      {"type":"Interpretation","question":"A question about a difficult or debated element of the passage"},
      {"type":"Application","question":"Where do you see this truth most needed in your own life right now — specific and personal"},
      {"type":"Application","question":"What would it look like to actually live this out this week — concrete and specific"},
      {"type":"Application","question":"Who in your life needs to hear the truth of this passage — outward facing"},
      {"type":"Prayer","question":"Based on this passage what is one specific thing you want to ask God for this week"}
    ],
    "activity": "A creative group activity or exercise that brings the passage to life — something that moves beyond discussion into experience",
    "deeper_study": ["A resource or question for those who want to go deeper — a commentary, a cross-reference to explore, a historical background to research","Second deeper study suggestion","Third deeper study suggestion"],
    "takeaway": "The one sentence you want every group member to carry with them all week"
  },
  "youth": {
    "big_truth": "The main truth of this passage in language a 16-year-old would find compelling — not dumbed down but translated",
    "cultural_hook": "A specific cultural reference, trend, social media phenomenon, or issue teens face that connects to this passage",
    "game": "A specific game or activity that sets up the passage theme — instructions included",
    "object_lesson": {"object":"A specific object","lesson":"How to use it to teach the main truth — step by step instructions"},
    "discussion_questions": [
      "A question teens will actually engage with — relevant to their world",
      "Second teen question",
      "Third teen question",
      "Fourth teen question — challenge question for mature students"
    ],
    "challenge": "A specific challenge or dare for the week — something teens can actually do that embodies the passage",
    "memory_verse": "Best memory verse from this passage for teens with explanation of why this verse"
  },
  "children": {
    "big_truth": "One truth from this passage in words a 7-year-old completely understands — simple but not shallow",
    "memory_verse": "Best memory verse for children with reference — short enough to memorize",
    "story_retelling": "Vivid present-tense retelling of the passage as a children's story — engaging, sensory, age-appropriate. 150-200 words. Written to be read aloud.",
    "object_lesson": {"object":"A simple household object every family has","lesson":"Step-by-step instructions on how to use it to teach the passage's main truth — specific and actionable"},
    "craft_idea": "A specific craft idea with materials list and instructions that reinforces the lesson",
    "activity": "An active game or physical activity that teaches the passage — specific instructions",
    "snack_idea": "A snack that connects to the passage theme with explanation",
    "discussion_questions": ["Simple age-appropriate question for ages 6-10","Second question","Third question"],
    "parent_connection": "A specific take-home prompt for parents — a dinner table question, a bedtime prayer, or a week-long family challenge rooted in this passage"
  }
}`
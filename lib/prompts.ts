export type Role = 'pastor' | 'theologian' | 'teacher' | 'smallgroup' | 'youth' | 'children'

export const ROLE_TABS: Record<Role, string[]> = {
  pastor:     ['overview','scripture','language','history','archaeology','christ','commentary','illustrations','outline','manuscript'],
  theologian: ['overview','scripture','language','history','archaeology','theology','crossref','christ','commentary','fathers','books','news'],
  teacher:    ['overview','scripture','history','christ','commentary','illustrations','outline','smallgroup','books'],
  smallgroup: ['overview','scripture','history','christ','illustrations','smallgroup'],
  youth:      ['overview','scripture','history','christ','illustrations','youth'],
  children:   ['overview','scripture','illustrations','children'],
}

const TAB_ORDER = ['overview','scripture','language','history','archaeology','theology','crossref','christ','commentary','fathers','quotes','books','illustrations','news','outline','manuscript','smallgroup','youth','children']

export function getTabsForRoles(roles: Role[]): string[] {
  const tabSet = new Set<string>()
  roles.forEach(role => ROLE_TABS[role]?.forEach(tab => tabSet.add(tab)))
  return TAB_ORDER.filter(t => tabSet.has(t))
}

const PART_1_TABS = ['overview','scripture','language','history','archaeology','theology']
const PART_2_TABS = ['crossref','christ','commentary','fathers','books','illustrations','news','outline','manuscript','smallgroup','youth','children']

function buildSection(tab: string): string {
  const sections: Record<string, string> = {
    overview: `"overview":{"summary":"2-3 sentence summary","main_idea":"One sentence big idea","author":"Author name and background","audience":"Original audience","date":"Approximate date","setting":"1-2 sentence setting","purpose":"Why written","literary_genre":"Genre","literary_structure":"Structure of the passage","themes":["theme1","theme2","theme3"],"teaching_opportunities":["opp1","opp2"]}`,

    scripture: `"scripture":{"key_verse":"Most preachable verse with explanation of why","verse_by_verse":[{"verse":"verse reference","notes":"2-3 sentence exegetical note"},{"verse":"verse reference","notes":"note"},{"verse":"verse reference","notes":"note"}]}`,

    language: `"language":[{"word":"Key Greek or Hebrew word","transliteration":"transliteration","strongs":"G#### or H####","pos":"part of speech","parsing":"parsing if verb","definition":"Definition and semantic range","usage":"Usage across Scripture","cognates":"Related words","preaching_note":"What this unlocks for preachers"},{"word":"word2","transliteration":"t","strongs":"G####","pos":"pos","parsing":"","definition":"def","usage":"usage","cognates":"cog","preaching_note":"note"},{"word":"word3","transliteration":"t","strongs":"H####","pos":"pos","parsing":"","definition":"def","usage":"usage","cognates":"cog","preaching_note":"note"}]`,

    history: `"history":{"political":"Political context","religious":"Religious climate","economic":"Economic conditions","social":"Social customs","geographical":"Geography","original_audience":"What original audience grasped","blind_spots":"What moderns miss","jewish_background":"Jewish background","greco_roman":"Greco-Roman context","marriage_family":"Marriage or family customs","intertestamental":"Intertestamental background"}`,

    archaeology: `"archaeology":[{"discovery":"Discovery name","location":"Site","date_found":"Date","relevance":"How it illuminates the passage","details":"What was found","significance":"Why it matters for preachers"},{"discovery":"Second discovery","location":"loc","date_found":"date","relevance":"rel","details":"det","significance":"sig"}]`,

    theology: `"theology":{"god":"What this reveals about God","christ":"Christological content","holy_spirit":"Spirit content","salvation":"Salvation themes","humanity":"Human nature","kingdom":"Kingdom themes","covenant":"Covenant themes","church":"Church themes","eschatology":"Eschatological themes","biblical_theology":"Biblical theology arc","systematic_connections":"Systematic connections","practical_theology":"Practical implications","doctrinal_issues":["Issue 1","Issue 2"]}`,

    crossref: `"crossrefs":{"direct":["ref1 — why","ref2 — why","ref3 — why","ref4 — why"],"prophetic":["ref1 — connection","ref2 — connection"],"typological":["ref1 — connection","ref2 — connection"],"thematic":["ref1 — connection","ref2 — connection"],"parallel_passages":["ref1 — how it illuminates"],"ot_backdrop":"OT backdrop","nt_development":"NT development"}`,

    christ: `"christ":{"title":"Christological title","presence":"How Christ is present","foreshadowing":"Foreshadowing images","fulfillment":"How Christ fulfills this","gospel_thread":"Gospel thread","redemptive_historical":"Place in redemptive history","christocentric_preaching":"How to preach Christ from this text"}`,

    commentary: `"commentary":{"matthew_henry":"Matthew Henry insight","spurgeon":"Spurgeon insight","calvin":"Calvin insight","augustine":"Augustine insight","luther":"Luther insight","modern_reformed":"Modern Reformed scholarship","modern_evangelical":"Modern evangelical scholarship","areas_of_agreement":"Where all agree","areas_of_debate":"Where they disagree","best_insight":"Single best insight"}`,

    fathers: `"church_fathers":[{"father":"Father name","dates":"dates","quote":"Key quote or paraphrase","context":"Why this matters"},{"father":"Father 2","dates":"dates","quote":"quote","context":"context"},{"father":"Father 3","dates":"dates","quote":"quote","context":"context"}]`,

    books: `"books":[{"title":"Title","author":"Author","type":"Commentary","description":"What it contributes","level":"Intermediate"},{"title":"t","author":"a","type":"Background","description":"d","level":"Beginner"},{"title":"t","author":"a","type":"Theology","description":"d","level":"Advanced"},{"title":"t","author":"a","type":"Commentary","description":"d","level":"Scholar"},{"title":"t","author":"a","type":"Devotional","description":"d","level":"Beginner"}]`,

    illustrations: `"illustrations":[{"category":"History","title":"Title","content":"3-4 sentence historical illustration","bridge":"Bridge to passage"},{"category":"Human Experience","title":"Title","content":"3-4 sentence universal experience","bridge":"Bridge"},{"category":"Current Culture","title":"Title","content":"3-4 sentence cultural illustration","bridge":"Bridge"},{"category":"Church History","title":"Title","content":"3-4 sentence church history story","bridge":"Bridge"},{"category":"Opening Hook","title":"Sermon Opening","content":"3-4 sentence powerful opener","bridge":"Transition to text"}]`,

    news: `"news":[{"type":"Archaeological","headline":"Recent finding","source":"Journal type","date":"Date","relevance":"How it illuminates the passage","summary":"2-3 sentence summary"},{"type":"Scholarly","headline":"Academic development","source":"Source","date":"Date","relevance":"Why it matters","summary":"Summary"},{"type":"Cultural","headline":"Cultural development making this passage relevant today","source":"Source","date":"Recent","relevance":"Why timely","summary":"Summary"}]`,

    outline: `"outline":{"title":"Sermon title","big_idea":"Big idea proposition","introduction":"How to open the sermon","points":[{"point":"First point","subpoints":["sub1","sub2","sub3"],"illustration":"Illustration idea","application":"Application"},{"point":"Second point","subpoints":["sub1","sub2","sub3"],"illustration":"Illustration","application":"Application"},{"point":"Third point","subpoints":["sub1","sub2","sub3"],"illustration":"Illustration","application":"Application"}],"conclusion":"How to close","invitation":"Call to response","alternative_structures":["Narrative approach","Problem-solution approach"]}`,

    manuscript: `"manuscript":{"intro":"100-150 word introduction in preaching voice","body":"400-500 word body covering all three points in preaching voice","conclusion":"100-150 word conclusion with gospel clarity and call to action"}`,

    smallgroup: `"smallgroup":{"icebreaker":"Opening question","context_setter":"1-2 sentences to set up the passage","questions":[{"type":"Observation","question":"What does the text say"},{"type":"Observation","question":"What is easy to overlook"},{"type":"Interpretation","question":"What does this mean"},{"type":"Interpretation","question":"What would original audience understand"},{"type":"Application","question":"Where is this most needed in your life"},{"type":"Application","question":"What does living this out look like this week"},{"type":"Prayer","question":"What do you want to ask God for"}],"activity":"Group activity","deeper_study":["Deeper study suggestion"],"takeaway":"One sentence takeaway"}`,

    youth: `"youth":{"big_truth":"Main truth for a 16-year-old","cultural_hook":"Cultural connection for teens","game":"Game with instructions","object_lesson":{"object":"Object","lesson":"How to use it"},"discussion_questions":["Teen question 1","Teen question 2","Teen question 3"],"challenge":"Weekly challenge","memory_verse":"Memory verse"}`,

    children: `"children":{"big_truth":"Truth for a 7-year-old","memory_verse":"Short memory verse","story_retelling":"80-100 word story retelling written to be read aloud","object_lesson":{"object":"Household object","lesson":"Teaching instructions"},"craft_idea":"Simple craft","activity":"Active game","snack_idea":"Thematic snack","discussion_questions":["Kid question 1","Kid question 2"],"parent_connection":"Dinner table question or bedtime prayer"}`,
  }
  return sections[tab] || ''
}

export function buildPrompt(passage: string, tabs: string[], part: 1 | 2): string {
  const partTabs = (part === 1 ? PART_1_TABS : PART_2_TABS).filter(t => tabs.includes(t))
  if (partTabs.length === 0) return ''
  const sections = partTabs.map(tab => buildSection(tab)).filter(Boolean).join(',\n')
  return `You are a biblical scholar. Passage: "${passage}"
Return ONLY raw JSON. No markdown. No backticks. Start with { end with }.
{"passage":"${passage}",${sections}}`
}

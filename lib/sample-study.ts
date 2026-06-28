// PassageLab — lib/sample-study.ts
// A complete, pre-rendered example study (Ephesians 1:15-23, roles:
// Theologian + Student) used by /study/...?sample=1 to show prospective users
// exactly what a finished study looks like — every tab, fully unlocked, with
// the real coloring and styling. Content mirrors an actual PassageLab result.
// Static data only; no API calls, no paywall, no charge.

export const SAMPLE_PASSAGE = 'Ephesians 1:15-23'
export const SAMPLE_ROLES   = ['theologian', 'student']

// Shown in the Scripture tab via the bibleText state (KJV, public domain).
export const SAMPLE_BIBLE_TEXT: Record<string, string> = {
  reference: 'Ephesians 1:15-23 (KJV)',
  kjv:
`15  Wherefore I also, after I heard of your faith in the Lord Jesus, and love unto all the saints,
16  Cease not to give thanks for you, making mention of you in my prayers;
17  That the God of our Lord Jesus Christ, the Father of glory, may give unto you the spirit of wisdom and revelation in the knowledge of him:
18  The eyes of your understanding being enlightened; that ye may know what is the hope of his calling, and what the riches of the glory of his inheritance in the saints,
19  And what is the exceeding greatness of his power to us-ward who believe, according to the working of his mighty power,
20  Which he wrought in Christ, when he raised him from the dead, and set him at his own right hand in the heavenly places,
21  Far above all principality, and power, and might, and dominion, and every name that is named, not only in this world, but also in that which is to come:
22  And hath put all things under his feet, and gave him to be the head over all things to the church,
23  Which is his body, the fulness of him that filleth all in all.`,
}

// Tab grouping mirrors the model routing (Haiku = "quick"/gold row, Sonnet =
// "deep"/purple row) so the sample's tab bar looks exactly like a real study.
export const SAMPLE_QUICK_TABS = ['overview', 'scripture', 'history', 'leadership', 'essayoutline', 'books', 'citations']
export const SAMPLE_DEEP_TABS  = ['language', 'hermeneutics', 'theology', 'crossrefs', 'christ', 'apologetics', 'conflicts', 'commentary', 'fathers', 'archaeology']

type SampleTab = { status: 'done'; data: Record<string, unknown>; cached: boolean }
const done = (data: Record<string, unknown>): SampleTab => ({ status: 'done', data, cached: false })

export const SAMPLE_TABS: Record<string, SampleTab> = {
  overview: done({
    overview: {
      main_idea: `God's power demonstrated in Christ's resurrection and exaltation is available to believers through the church, which is Christ's body and the fullness of His cosmic dominion.`,
      summary: `Paul's prayer for the Ephesian church reveals the apostle's pastoral heart and theological vision. After commending their faith and love, Paul intercedes that God would grant them spiritual wisdom and revelation, enlightening their understanding to comprehend the magnitude of Christ's power, position, and purpose. The prayer crescendos in Christology—exalting Jesus as risen, enthroned, and supreme over all cosmic powers—and ecclesiology—presenting the church as Christ's body, sharing in His fullness. This passage is foundational for understanding the believer's position in Christ and the church's cosmic significance in God's redemptive plan.`,
      setting: `Paul addresses churches in the Lycus Valley region (Ephesus being the primary recipient or circular-letter destination) in Asia Minor during the early expansion of Christianity into the pagan Greco-Roman world. The cultural milieu included widespread belief in cosmic powers and spiritual hierarchies, Jewish messianic expectations, and imperial theology exalting Rome. Paul writes from Roman captivity, a context that paradoxically becomes the occasion for revealing Christ's supremacy over all earthly and heavenly authorities.`,
      literary_structure: `The passage exhibits a chiastic prayer structure: (A) Thanksgiving and remembrance (1:15-16); (B) Petition for wisdom (1:17); (C) Enlightenment of understanding (1:18a); (D) Content of understanding—hope, inheritance, power (1:18b-19); (D') Demonstration of power in Christ (1:20-21); (C') Christ's supremacy and headship (1:22a); (B') Church as Christ's body (1:22b-23a); (A') Church's fullness in Christ (1:23b). The inversion emphasizes the movement from individual spiritual perception to cosmic ecclesiastical reality.`,
      themes: [
        `The Supremacy of Christ`,
        `God's Surpassing Power`,
        `The Church as Christ's Body`,
        `Spiritual Enlightenment & Knowledge`,
        `The Inheritance of the Saints`,
        `The Eschatological Tension`,
      ],
      teaching_opportunities: [
        `The Power of Intercessory Prayer: Authentic pastoral ministry includes sustained, specific prayer for believers. Paul models what it means to "make mention of you in my prayers," holding the Ephesians before God continuously—prayer is not escapism but the primary means by which leaders align believers' perception with reality.`,
        `The Believer's Position in Christ: This passage is central to the doctrine of union with Christ. The "eyes of your understanding being enlightened" refers not to new doctrinal information but to recognizing one's already-secured status—shifting from "Is God powerful enough?" to "Am I trusting the power already given me?"`,
        `The Church's Cosmic Significance: Modern Christianity often privatizes faith or shrinks the church to a social club. This passage recalibrates: the church is the body of Christ, the visible manifestation of His rule to "principalities and powers in heavenly places," so congregational faithfulness has cosmic ramifications.`,
        `The Sufficiency of Christ Over Spiritual Hierarchies: Paul's assertion that Christ is "far above all principality, and power, and might, and dominion" deliberately names the powers believers fear and subordinates them all to Jesus—answering spiritual insecurity with Christ's proven supremacy rather than appeasement or fear.`,
      ],
    },
  }),

  scripture: done({
    scripture: {
      key_verse: `Ephesians 1:19-20 — "And what is the exceeding greatness of his power to us-ward who believe... Which he wrought in Christ, when he raised him from the dead." This is the theological hinge: Paul pivots from prayer request to the grounds of that prayer—the resurrection power of Christ. The Greek energeia (working/energy) emphasizes God's active, dynamic power demonstrated supremely in the resurrection, which becomes the basis for every spiritual blessing Paul has enumerated.`,
      verse_by_verse: [
        { verse: 'Ephesians 1:15', notes: `Paul's "wherefore" (dio) connects backward to the spiritual blessings just described; his thanksgiving arises from their demonstrated faith and love. "Love unto all the saints" (agape) reveals the comprehensive scope of Christian community—the balance of faith (vertical) and love (horizontal) sets the pattern for the whole epistle.` },
        { verse: 'Ephesians 1:16', notes: `"Cease not" (ou pausomai) indicates continuous, unceasing prayer—habitual, perpetual remembrance rather than occasional intercession. Paul models prayer discipline: his writing itself is framed as prayer, suggesting that spiritual leadership requires prayer that never stops.` },
        { verse: 'Ephesians 1:17', notes: `"The God of our Lord Jesus Christ, the Father of glory" joins Jewish monotheistic language with a Trinitarian framework. The petition for "the spirit of wisdom and revelation" (pneuma sophias kai apokalypseos) seeks not new revelations but illumination of already-revealed truth—wisdom and revelation working together for integrated spiritual perception.` },
        { verse: 'Ephesians 1:18', notes: `"Eyes of your understanding" (ophthalmous tes kardias) uses the heart's perception, rooted in Semitic anthropology where the heart is the center of understanding. Paul seeks enlightenment regarding three realities—hope, inheritance, and power—praying that believers would "know" what they already theoretically possess.` },
        { verse: 'Ephesians 1:19', notes: `"Exceeding greatness" (huperballon to megethos) uses intensive language emphasizing power beyond measurement. "To us-ward who believe" restricts this power to the believing community. The danger preachers miss is divorcing God's power from its historical demonstration in resurrection.` },
        { verse: 'Ephesians 1:20', notes: `"Which he wrought in Christ" grounds all preceding claims in the concrete historical event of resurrection. The verb egeiro (raise) is the same used of believers' resurrection, making Christ's raising the prototype of our spiritual resurrection; His session at God's right hand establishes permanent cosmic authority.` },
        { verse: 'Ephesians 1:21', notes: `The fourfold "principality, and power, and might, and dominion" (arche, exousia, dynamis, kyriotes) refers to hierarchies of cosmic powers in first-century thinking. "Not only in this world, but also in that which is to come" establishes Christ's supremacy as universal and eternal—reassuring a church intimidated by cosmic spiritual forces.` },
        { verse: 'Ephesians 1:22', notes: `"Hath put all things under his feet" echoes Psalm 8:6, applied to Christ as the true image-bearer. "Gave him to be the head over all things to the church" carries a deliberate grammatical ambiguity—Christ's universal headship exists specifically for the church's benefit.` },
        { verse: 'Ephesians 1:23', notes: `"Which is his body" (to soma autou) introduces the central metaphor of Ephesians. "The fulness of him that filleth all in all" (pleroma) appropriates a term freighted with Gnostic meaning to assert that the church is the receptacle of Christ's fullness—a mutual, eschatological interdependence grounding the letter's missiology.` },
      ],
    },
  }),

  language: done({
    language: [
      {
        word: 'ἀποκάλυψις', transliteration: 'apokalypsis', strongs: 'G602', pos: 'noun', parsing: 'nominative feminine singular',
        definition: `From apo (away, from) and kalypto (to cover, hide), meaning literally an "uncovering" or "unveiling"—the dramatic removal of a veil to expose what was hidden. Paul's request for a "spirit of apokalypsis" communicates not intellectual learning but a divine, sovereign act of God removing the veil from truths otherwise inaccessible to human reason.`,
        usage: `Romans 16:25 — "the revelation of the mystery kept secret since the world began." Galatians 1:12 — Paul received the gospel "by the revelation of Jesus Christ." Revelation 1:1 — the final book of the canon bears this title, a divine pulling-back of the curtain on cosmic and eschatological reality.`,
        cognates: `apokalypto (G601, the verb form, to reveal), kalypto (G2572, to cover or hide). A family of words built around concealment and disclosure—revelation is always God's sovereign initiative.`,
        preaching_note: `Spiritual knowledge is not a product of intellectual achievement but an act of divine surgery on the soul. Paul does not pray that the Ephesians would study harder, but that God would perform the act of apokalypsis upon them—pulling back the veil so they see what cannot be seen by unaided human eyes.`,
      },
      {
        word: 'δύναμις', transliteration: 'dynamis', strongs: 'G1411', pos: 'noun', parsing: 'nominative feminine singular',
        definition: `Inherent power, ability, or might—power resident within a being by virtue of its nature. Distinguished from exousia (authority) and ischus (muscular strength), dynamis points to the intrinsic capacity to achieve results. Paul piles it alongside ischys and kratos in verse 19 to communicate that God's power toward believers defies adequate human description.`,
        usage: `Romans 1:16 — the gospel "is the dynamis of God unto salvation." 1 Corinthians 1:18 — the preaching of the cross "is the dynamis of God." Acts 1:8 — "Ye shall receive dynamis after that the Holy Ghost is come upon you."`,
        cognates: `dynastes (G1413, a ruler), dynasteuo (to exercise power), adynatos (G102, impossible). The word family reveals that dynamis is the power that makes impossible things possible.`,
        preaching_note: `Paul identifies the measure of this power as nothing less than the resurrection of Jesus Christ—the same dynamis that reversed death itself is now operative toward every believer. It is not a lesser grade of divine energy but the identical force that emptied the tomb.`,
      },
      {
        word: 'κεφαλή', transliteration: 'kephalē', strongs: 'G2776', pos: 'noun', parsing: 'accusative feminine singular',
        definition: `Literally "head," but carrying profound metaphorical freight in Pauline theology as the source, authority, and governing center of the body. In classical Greek it could denote a fountainhead or source of a river. Paul's designation of Christ as kephalē "over all things to the church" combines cosmic lordship with intimate, organic, life-sustaining relationship.`,
        usage: `Colossians 1:18 — "He is the head of the body, the church." Colossians 2:10 — "the head of all principality and power." Ephesians 4:15 — "may grow up into him in all things, which is the head, even Christ."`,
        cognates: `anakephalaioomai (G346, to sum up or recapitulate — Eph. 1:10), enkephalos (brain). The recapitulation word in 1:10 suggests Christ as the one in whom all things find their ultimate summation and coherent unity.`,
        preaching_note: `Resist reducing "head" to a chain-of-command image. Paul's organic metaphor means the church draws its very life, direction, and health from Christ as head—severed from Him there is not merely disorder but death.`,
      },
      {
        word: 'πλήρωμα', transliteration: 'plērōma', strongs: 'G4138', pos: 'noun', parsing: 'nominative neuter singular',
        definition: `From pleroo (to fill)—that which fills, the fullness, completeness, or totality of something. In Stoic philosophy it described the totality of divine powers filling the universe; in Gnostic thought, the cosmic fullness of divine emanations. Paul's radical claim that the church is the plērōma of Christ reverses any Gnostic diminishment and makes the assembled people of God the very arena of Christ's comprehensive fullness.`,
        usage: `Colossians 1:19 — "in him should all fullness (plērōma) dwell." Colossians 2:9 — "in him dwelleth all the fullness of the Godhead bodily." Ephesians 4:13 — "the measure of the stature of the fullness of Christ."`,
        cognates: `pleroo (G4137, to fill, complete, fulfill), pleres (G4134, full), plerophoreo (G4135, to fully carry out). This family consistently points to completion, saturation, and the absence of any deficiency.`,
        preaching_note: `One of the most theologically explosive statements in the New Testament—the church is the fullness of the cosmic Christ. Use it to correct both a deflated ecclesiology that treats the church as optional and an inflated one that mistakes human institution for divine fullness.`,
      },
      {
        word: 'ὑπεράνω', transliteration: 'hyperanō', strongs: 'G5231', pos: 'adverb/preposition', parsing: 'improper preposition governing genitive',
        definition: `A compound of hyper (above, beyond, exceedingly) and ano (upward, above)—"far above," "high over," or "infinitely above." It is used sparingly in the NT, in passages of maximum exaltation. In the Roman imperial context where Caesar claimed divine honors, and in the Jewish apocalyptic world teeming with angelic hierarchies, this word asserts a Christological supremacy that shatters every competing claim to cosmic sovereignty.`,
        usage: `Ephesians 4:10 — "ascended up far above (hyperano) all heavens, that he might fill all things." Hebrews 9:5 — used of the cherubim positioned "over" the ark. Ephesians 1:21 — the present passage, positioning the exalted Christ above the entire hierarchy of spiritual powers.`,
        cognates: `hyper (G5228, above, beyond), hyperballo (G5235, to surpass — used in v. 19 of the "exceeding" greatness), hyperbole (G5236, surpassing greatness). The hyper-word family in Ephesians 1 forms a deliberate rhetorical pattern of excess.`,
        preaching_note: `No rival—personal, political, spiritual, or cosmic—occupies the same plane as the exalted Christ. In a culture of competing lords, Paul's hyperano declares a total supremacy that renders all other claimants not merely inferior but categorically incomparable.`,
      },
    ],
  }),

  history: done({
    history: {
      social: `Honor-shame dynamics permeated Mediterranean culture; Paul's affirmation of believers' inheritance and status "in Christ" directly countered the social marginalization many faced as members of a minority sect. The metaphor of the church as Christ's "body" was profoundly countercultural—suggesting radical equality and interdependence.`,
      economic: `Ephesus was a major commercial hub where wealthy merchants and trade guilds held significant social power. The emphasis on spiritual inheritance and heavenly riches challenged materially-minded believers to recalibrate their values away from earthly accumulation.`,
      political: `Paul wrote likely during his Roman imprisonment (ca. 60-62 CE), when the Empire's absolute authority was at its peak. The language of Christ's supremacy over "principality, power, might, and dominion" carried subversive political weight for churches living under Caesar's rule.`,
      religious: `First-century Jewish believers grappled with reconciling monotheism with the exaltation of Jesus to God's right hand. The Ephesian church specifically faced pressure from magical practices and goddess worship (the Artemis cult), making clarity about Christ's absolute supremacy pastorally urgent.`,
      greco_roman: `The hierarchy of "principality, power, might, dominion" reflects Greco-Roman cosmological mapping where invisible powers structured reality; Paul asserts Christ's authority over the entire stratified system. Right-hand seating derives partly from political protocol where the honored successor sits at the ruler's right hand.`,
      geographical: `Ephesus sat at the crossroads of major trade routes, making it religiously pluralistic and philosophically sophisticated, with exposure to Gnostic and mystery-religion ideas that threatened Christological clarity. Theological confusion in Ephesus would ripple throughout the region.`,
      intertestamental: `Intertestamental Jewish literature increasingly depicted a cosmos populated by named angelic powers and demonic forces with territorial authority. Texts like 1 Enoch made explicit the anxiety that evil angelic powers governed earthly affairs, making Paul's assertion of Christ's supremacy the direct answer to widespread cosmic pessimism.`,
      jewish_background: `The "right hand of God" invokes Psalm 110:1, the most-cited messianic text in early Christianity. "Inheritance" (kleronomia) draws from covenantal theology, reframed here as heavenly and cosmic. "Father of glory" echoes Jewish doxological language while connecting Jesus to the divine glory (shekinah) reserved for God alone.`,
      original_audience: `The Ephesian believers would have immediately grasped the contrast between Christ and the angelic powers understood as real cosmic forces controlling human destiny. Paul's prayer for "eyes of understanding" to be enlightened presupposes their struggle with spiritual perception in a world perceived as dense with competing divine claims.`,
      blind_spots: `Modern Western readers typically individualize this passage, missing its corporate and political dimensions—the church is Christ's body collectively. We abstract "principalities and powers" into psychological categories rather than the ontologically real cosmic forces ancient believers understood, and our Platonic dualism makes us spiritualize what Paul grounds in Christ's physical, bodily resurrection and tangible right-hand exaltation.`,
    },
  }),

  hermeneutics: done({
    hermeneutics: {
      genre_rules: `This is epistolary literature—specifically a thanksgiving and intercessory prayer embedded within a NT letter—so it must be read according to Greco-Roman letter-writing conventions while attentive to its theological density. Epistolary prayers are not devotional asides but carry deliberate theological freight. The interpreter must resist importing charismatic or mystical frameworks onto terms like "spirit of wisdom and revelation" without first determining their grammatical and contextual meaning.`,
      authorial_intent: `Paul writes as a prisoner who has received reports of the Ephesians' faith and love; his prayer is a theologically structured petition rooted in the blessings of 1:3-14, so "wherefore" is a logical connector. His intent is corporate and ecclesiological: he prays that the gathered community would collectively comprehend the hope of their calling, the riches of the inheritance, and the surpassing greatness of God's power. The "you" throughout is plural, directed at the church as a whole body.`,
      context_levels: `Immediate: the prayer flows from the benediction of 1:3-14 and the power language of 1:19-20 is the very force that raises spiritually dead people to life (2:1-10). Book: Ephesians' indicative-imperative structure places this passage at the foundation of the indicative section; Christ's headship over powers recurs in 3:10. Canonical: the exaltation parallels Philippians 2:9-11 and Colossians 1:15-20, and Paul does deliberate Second Temple exegesis of Psalm 110:1 and Psalm 8:6.`,
      common_mistakes: [
        `Treating "the spirit of wisdom and revelation" as a distinct post-conversion baptism or second-blessing experience, ignoring the context where Paul petitions for the Spirit's enabling function of illumination, not a new ontological endowment.`,
        `Interpreting "the eyes of your understanding being enlightened" as individual mystical insight, privatizing what Paul intends as a corporate, ecclesial knowing—the plural "your" is addressed to the whole community.`,
        `Reading the cosmic hierarchy of verse 21 as a speculative angelology or chart of heavenly ranks, when Paul's point is rhetorical and polemical: Christ is exalted above every conceivable category of power.`,
        `Using "the fulness of him that filleth all in all" to elevate ecclesial authority to the point of equating the church's decisions with Christ's will, when the syntax shows the church as recipient and sphere of His headship, not a co-equal extension of His being.`,
      ],
      key_questions: [
        `What is the grammatical antecedent of "wherefore" in verse 15, and how does the content of 1:3-14 shape the petitions Paul makes?`,
        `What are the three distinct objects of knowing (hope of calling, riches of inheritance, greatness of power), and how do they function together as a unified theological vision?`,
        `In what sense is the power that raised Christ "to us-ward who believe," and how does the resurrection analogy of 1:19-20 with 2:1-6 clarify the nature of saving power?`,
        `What does it mean for the church to be "the fulness of him that filleth all in all"—and does the Greek syntax make the church active (completing Christ) or passive (being completed by Him)?`,
      ],
      faithful_reading: `A faithful reading begins by recognizing the passage as a prayer report, not a doctrinal treatise—feeling its pastoral and doxological weight before systematizing its content. The three petitions must be held together as a coherent vision of the Christian's total orientation toward God. The reader must resist over-spiritualizing the cosmic Christology of verses 20-23, recognizing the resurrection and exaltation as historical events with present and eschatological implications, and interpret the church's description as Christ's body within the letter's argument about Jew-Gentile unity.`,
      application_principles: `The bridge from "what it meant" to "what it means" runs through unchanging realities: Christ's supremacy over all powers is objectively accomplished, not aspirationally sought. The prayer form invites communities today to pray for the same illumination Paul prayed for—not a mechanism for mystical experience but a reasoned opening of the mind to grasp already-revealed realities. The cosmic Christology grounds courage for believers overwhelmed by political, cultural, or spiritual powers, and the ecclesiology calls congregations to take their corporate identity seriously.`,
      interpretive_tradition: `The early fathers (Chrysostom, Origen) read the exaltation language as a cornerstone against subordinationist Christologies. The Reformers, especially Calvin, emphasized the corporate and ecclesiological thrust, resisting both individualistic pietism and Roman Catholic ecclesiological inflation. The tradition contributes a vital guardrail: Christology must always govern ecclesiology here—the church's dignity derives entirely from her union with the exalted Christ.`,
    },
  }),

  theology: done({
    theology: {
      god: `God is revealed as "the Father of glory," a title emphasizing His transcendent majesty. He is the sovereign initiator of wisdom and revelation, granting illumination not through human effort but divine gift, and the One who acted decisively in history by raising Christ and seating Him at His right hand. His power is described with layered, almost overwhelming language—pointing to an omnipotence actively deployed on behalf of His people.`,
      christ: `Christ is presented in His exalted, post-resurrection state as cosmic Lord seated at the Father's right hand (alluding to Psalm 110:1). His authority surpasses every named power in this age and the age to come. He is appointed head over all things specifically for the church, making His lordship simultaneously cosmic and intimately ecclesiological.`,
      holy_spirit: `The "spirit of wisdom and revelation" (v. 17) is most likely the Holy Spirit working within believers to grant genuine knowledge of God. The Spirit functions as the agent of illumination, opening the eyes of the heart—aligning closely with John 16:13 and 1 Corinthians 2:10-12, where the Spirit searches the deep things of God and communicates them to the redeemed.`,
      salvation: `Salvation is portrayed not merely as forgiveness but as incorporation into Christ's own resurrection and exaltation, so the power that raised Him now operates "to us-ward who believe." The "hope of his calling" points to a not-yet-realized destiny; the "riches of the glory of his inheritance in the saints" suggests God finds His inheritance in His redeemed people.`,
      humanity: `Even redeemed human beings require divine illumination to understand spiritual realities—the "eyes of your understanding" must be "enlightened," implying that spiritual blindness is the natural human condition apart from grace. Yet humanity's dignity is affirmed in that God's inheritance is located "in the saints."`,
      kingdom: `The kingdom is implicitly present in Christ's exaltation "far above all principality, power, might, and dominion," displacing every competing sovereignty. The "age to come" reference situates His reign on a cosmic timeline; "all things under his feet" echoes Psalm 8 and Daniel 7, connecting Christ's rule to the OT expectation of God's universal reign.`,
      covenant: `The language of "calling" and "inheritance" draws on the covenant framework of Israel's election, now recast in Christ as a spiritual inheritance of glory. "Saints" (hagioi) carries covenant overtones, identifying the church as God's holy, set-apart people in continuity with Old Testament Israel.`,
      church: `The church is defined with striking density as the "body of Christ" and "the fulness of him that filleth all in all"—not merely an organization but the living expression of Christ's presence in the world. Christ is given as head "to the church," indicating His cosmic lordship has a gracious orientation toward His people.`,
      eschatology: `The reference to "that which is to come" establishes a two-age framework in which Christ's exaltation already transcends present history and extends into the eternal future. The "hope of his calling" orients existence toward a not-yet-realized consummation; "all things under his feet" anticipates the final subjugation of every enemy, including death (cf. 1 Cor. 15:24-28).`,
      biblical_theology: `In creation, humanity was given dominion (Gen. 1:26-28; Ps. 8), yet the fall broke it. Paul's echo of Psalm 8:6 and Psalm 110:1 signals that Christ is the true human who accomplished what Adam failed to do. The resurrection and exaltation are the decisive turning point in the creation-fall-redemption arc, and the church being filled with "him that filleth all in all" anticipates the new-creation vision of Revelation 21-22.`,
      systematic_connections: `A locus classicus for the post-resurrection implications of the hypostatic union and for the Reformed doctrine of effectual calling (the same power that raised Christ is operative in conversion). Verses 22-23 are central to ecclesiology (church as both organism and institution; the meaning of the church as Christ's pleroma) and connect to Christ's kingly office in the munus triplex.`,
      doctrinal_issues: [
        `The identity of the "spirit of wisdom and revelation" (v. 17)—the Holy Spirit as agent of illumination, or a disposition granted by God—with implications for pneumatology.`,
        `The meaning of "the fulness of him that filleth all in all" (v. 23)—the church completing Christ, Christ filling the church, or a paradoxical mutual fullness.`,
        `The nature of "principalities, powers, might, and dominion" (v. 21)—human governmental structures, angelic/demonic beings, structural forces, or a combination—affecting spiritual-warfare and social ethics.`,
        `Whether "not only in this world but also in that which is to come" implies ongoing mediated kingship after the consummation, touching debates about the eternal state.`,
      ],
    },
  }),

  crossrefs: done({
    crossrefs: {
      direct: [
        `Colossians 1:9-10 — A nearly identical intercessory prayer, asking that believers be filled with the knowledge of God's will in all wisdom, directly paralleling Ephesians 1:17.`,
        `Psalm 110:1 — "Sit thou at my right hand, until I make thine enemies thy footstool," directly fulfilled in verses 20-22.`,
        `1 Corinthians 15:27 — Paul quotes Psalm 8:6 to affirm God has put all things under Christ's feet, the same imagery as Ephesians 1:22.`,
        `Philippians 2:9-11 — God highly exalted Christ and gave him a name above every name, corresponding to Ephesians 1:21.`,
        `Romans 8:38-39 — Principalities and powers cannot separate believers from God's love, anchored in the same hierarchy Christ supersedes.`,
      ],
      prophetic: [
        `Psalm 8:4-6 — The son of man crowned with glory, all things under his feet—a prophetic anticipation of Christ's exaltation in 1:20-22.`,
        `Isaiah 11:2 — The Spirit of wisdom and understanding resting on the Messiah finds its ecclesial extension in 1:17.`,
        `Daniel 7:13-14 — The Son of Man given dominion, glory, and a kingdom foreshadows the cosmic lordship of 1:21-22.`,
      ],
      typological: [
        `Joseph's exaltation (Genesis 41:40-43) — Elevation to a throne second only to Pharaoh, with all bowing, foreshadows Christ's exaltation to the Father's right hand.`,
        `The High Priest entering the Holy of Holies (Leviticus 16) — Anticipates Christ's ascension into the heavenly places and permanent priestly intercession.`,
        `Solomon's throne over all Israel (1 Kings 4) — The son of David ruling in wisdom and glory is a royal type of Christ, the greater Son of David.`,
      ],
      thematic: [
        `Hebrews 1:3-4 — Christ sat down at the right hand of the Majesty, superior to angels, reinforcing 1:20-21.`,
        `John 17:3 — Eternal life as knowing the Father and Son, corresponding to Paul's prayer for enlightenment in 1:17-18.`,
        `Acts 2:32-36 — Peter's Pentecost declaration that God raised and exalted Jesus as Lord and Christ.`,
        `Colossians 1:18 — Christ the head of the body, the church, the firstborn from the dead—paralleling 1:22-23.`,
      ],
      parallel_passages: [
        `Colossians 1:15-20 — Like Ephesians 1:20-23, exalts Christ over all powers as head of the body; Colossians emphasizes creation and reconciliation, Ephesians the resurrection-exaltation and the church's participatory inheritance.`,
        `1 Peter 3:21-22 — References Christ's resurrection, ascension, and the subjection of angels and powers; Peter uses it as comfort in suffering, Paul as foundation for the church's identity.`,
      ],
      ot_backdrop: `Richly layered in royal, priestly, and wisdom traditions. Psalm 110 establishes the Davidic king enthroned at Yahweh's right hand with enemies beneath his feet; Psalm 8 contributes the vision of humanity crowned with glory and given dominion, applied to Christ as the true image-bearer; the wisdom tradition (Proverbs 8) provides the language of divine wisdom and revelation Paul prays would be granted.`,
      nt_development: `The NT moves from scattered anticipations of Christ's lordship in the Gospels to a fully articulated cosmic Christology and ecclesiology. What Peter announced at Pentecost as historical events, Paul transforms into the theological foundation for the church's identity and hope; Hebrews and Revelation further unpack these themes toward a fully eschatological consummation.`,
    },
  }),

  christ: done({
    christ: {
      title: `The Exalted and Enthroned Head of the Church — capturing the dominant Christological theme: Christ as the risen, ascended, and sovereignly enthroned Lord over all cosmic powers, defining His unique relationship to the church as its supreme Head.`,
      presence: `Christ is explicitly and centrally present throughout, named as the risen and exalted Lord in whom all power, authority, and dominion are concentrated. Paul's prayer is oriented entirely around knowing Christ. The ascension and session at the Father's right hand (v. 20) is the gravitational center around which the entire doxological argument revolves; the church's identity in verses 22-23 is defined entirely in relation to Him.`,
      foreshadowing: `Rich intertextual echoes of OT anticipations of the enthroned Messiah—Psalm 110:1 underlies the language of Christ seated at God's right hand; "all things under his feet" resonates with Psalm 8:6. The enumeration of "principality, power, might, and dominion" reflects apocalyptic Jewish categories now declared subordinate to Christ—an eschatological convergence of creation theology, royal messianism, and apocalyptic hope.`,
      fulfillment: `Christ fulfills the Davidic expectation of an eternal king seated in supreme authority; He fulfills the Adamic mandate of Psalm 8 as the Last Adam who perfectly holds the dominion humanity forfeited; and He fulfills the prophetic vision of God's glory filling all things (Isa. 6:3; Hab. 2:14) by being the one who "filleth all in all." In His resurrection and exaltation, Christ becomes the cosmic fulfillment of every promise of divine sovereignty.`,
      gospel_thread: `In creation, God purposed a humanity to bear His glory and exercise dominion—the "hope of his calling." In the fall, that dominion was surrendered to hostile powers and human understanding was darkened. In redemption, God deployed "the exceeding greatness of his power" to raise the crucified Lord and seat Him above every usurping authority. In restoration, this risen Christ is given as Head to the church, His body—the community through which His fullness extends into the world.`,
      christocentric_preaching: `The path to Christ-centered preaching here requires no redirection or allegory, because Christ is already the explicit subject of every verse. The preacher's task is to open the eyes of the congregation to the same realities Paul prays they would see—anchoring the exaltation in the historical event of resurrection, holding together cosmic lordship and intimate headship, and letting Paul's intercessory posture shape a pastoral tone aimed at a Spirit-illumined encounter with the risen Lord.`,
    },
  }),

  apologetics: done({
    apologetics: {
      historical_reliability: `Ephesians 1:15-23 is attested in some of the earliest and most reliable NT manuscripts, including P46 (c. 200 AD), Codex Sinaiticus, and Codex Vaticanus. Its first-century Jewish apocalyptic framework is consistent with the Dead Sea Scrolls; external attestation comes from Clement of Rome (c. 95 AD) and Ignatius of Antioch (c. 107 AD). The intercessory prayer form mirrors authentic Pauline literary conventions across the undisputed corpus.`,
      textual_criticism: `The most significant variant occurs in verse 15, where some manuscripts (P46, Vaticanus) omit "your love" (ten agapen); most critical scholars favor the shorter reading as more difficult and likely original. A secondary variant in verse 18 reads "heart" (kardias) for "understanding" (dianoias). Scholarly consensus (NA28, UBS5) affirms that no doctrine is substantively affected by any manuscript difference here.`,
      critical_objections: [
        {
          objection: `Ephesians is almost certainly pseudonymous—written by a later Pauline-school disciple. Its elevated, liturgical prose, unusually complex sentences, and developed ecclesiology (vv. 22-23) suggest a post-Pauline community projecting authority backward onto Paul.`,
          source: `Ernest Best, Markus Barth, Andrew Lincoln, and the broad consensus of critical NT scholarship`,
          response: `The argument is serious—roughly 60-70% of critical scholars consider Ephesians deutero-Pauline, and the stylistic differences are measurable. But it is not decisive: variation can be explained by an amanuensis, the circular-letter format, or genuine development during imprisonment. The earliest fathers universally attributed it to Paul, and the personal elements in verses 15-16 create awkwardness a skilled forger would likely have avoided. The question is genuinely open, and the authentic Pauline reading remains scholarly defensible.`,
        },
        {
          objection: `The cosmic Christology of verses 20-23—Christ enthroned above all "principalities, powers, might, and dominion"—represents a mythological worldview that modern readers should demythologize rather than take literally.`,
          source: `Rudolf Bultmann's demythologization program, followed by John Dominic Crossan and the post-Enlightenment liberal tradition`,
          response: `Demythologization itself rests on a philosophical commitment—that the Enlightenment's naturalistic worldview is normative—which is a debatable metaphysical assumption, not a neutral finding. The resurrection, which Paul grounds this claim upon in verse 20, is presented as a dateable historical event with eyewitness testimony. Moreover, the "powers" language may be a sophisticated framework for real structural forces—political, spiritual, systemic—that Christ's resurrection definitively subordinates.`,
        },
        {
          objection: `Describing the church as "the fullness of him that filleth all in all" reflects an ecclesiological triumphalism that has historically enabled conquest, exclusion, and the abuse of power—underwriting Christian imperialism.`,
          source: `Postcolonial scholars including Musa Dube and Tat-siong Benny Liew, and liberation-tradition theologians`,
          response: `This correctly identifies real historical abuse, which demands honest acknowledgment. But a careful reading undermines imperialist appropriations: Christ's exaltation comes through crucifixion and resurrection, not conquest, and the church as "his body" is derivative and instrumental. The "fullness" language is relational and participatory—pointing to dependence on Christ, not self-sufficient authority. The antidote to misuse is recovering the text's actual logic: a cruciform community that serves the cosmic Christ.`,
        },
      ],
      philosophical_challenges: `The claim that God demonstrated power through Christ's bodily resurrection raises the classic Humean objection that miracles are inherently improbable. The most credible response is that Hume's argument is question-begging—it assumes a closed naturalistic universe, precisely what the resurrection would disprove—so the question must be settled on historical grounds. The passage also raises the question of why evil persists if Christ is "far above all power," which Pauline theology addresses through inaugurated eschatology: the decisive victory is won, but full consummation awaits.`,
      conversational_responses: [
        `On why evil persists if Christ reigns: The tension is real—Paul wrote these words from prison. The NT holds it together through "already but not yet": Christ's resurrection was the decisive battle (the D-Day moment), but the full liberation is still coming. The authority is established; the visible enforcement isn't complete yet.`,
        `On the cosmic claims going beyond the Gospels: Paul does develop this with sophistication beyond the earliest traditions. But the core conviction—that Jesus rose and was exalted—is found in the earliest layers, including creedal formulas in 1 Corinthians 15 most scholars date within five years of the crucifixion. The question is whether the resurrection happened—a historical question.`,
        `On the church's abuse of power: The church's history makes that claim sound hollow, and Christians need to own that honestly. But the passage says the church is filled by Christ, which is the opposite of arrogance—the "fullness" language is about dependence and reception. The passage is actually a rebuke to ecclesial triumphalism, not a license for it.`,
      ],
      what_critics_get_right: `Critics are correct that the cosmic Christology represents genuine theological development—Paul works out the implications of the resurrection in categories beyond simple biographical memory. They are also right that the passage has a liturgical, hymnodic quality suggesting it draws on early Christian worship traditions, reflecting a communal theological process—a point that enriches rather than undermines its authority.`,
      strongest_evidence: `The most compelling evidence is the early independent attestation of its core claims: the resurrection and exaltation of verses 20-21 are attested across every strand of early NT tradition—the Synoptics, the undisputed Paulines, the Johannine writings, Acts, and Hebrews—making a late "school invention" extremely difficult to sustain. The phrase "at his own right hand" echoes Psalm 110:1, the single most-quoted OT text in the NT, indicating the earliest Christians interpreted the resurrection through this lens from the very beginning.`,
    },
  }),

  conflicts: done({
    conflicts: {
      central_question: `What does Paul mean when he calls the church "the fulness (pleroma) of him that filleth all in all" in verse 23—is the church the recipient of Christ's fullness, the complement that completes Christ, or the instrument through which Christ fills all things?`,
      why_it_matters: `The answer directly shapes ecclesiology: whether the church is a passive vessel receiving divine gift, an active partner whose existence completes something in Christ, or a commissioned agent extending Christ's presence cosmically. It determines how Christians understand corporate identity, mission, and even whether Christ can be said to be "complete" apart from his people—a claim with profound Christological implications.`,
      positions: [
        {
          name: `The Church as Passive Recipient of Christ's Fullness`,
          held_by: `John Calvin, F.F. Bruce, Peter O'Brien, Harold Hoehner, Clinton Arnold, and most Reformed and evangelical commentators`,
          argument: `Pleroma is the content poured into a container—the church is that which is filled by Christ who fills all things. The grammar favors a passive sense, cohering with the Pauline pattern of divine initiative and human receptivity, and with Ephesians 1's stress on the sufficiency of what God has already accomplished. The church's greatness derives entirely from what it has been given.`,
          key_texts: `Ephesians 3:19; Ephesians 4:10; Colossians 1:19; Colossians 2:9-10; John 1:16`,
          weakness: `Requires construing pleroma in a somewhat unusual passive sense, and struggles to explain why Paul would call the church—rather than all creation—uniquely "the fullness" if Christ already fills all in all; the phrase risks being redundant.`,
        },
        {
          name: `The Church as the Complement or Completion of Christ`,
          held_by: `J.A. Robinson, Markus Barth, C.F.D. Moule, Andrew Lincoln, and some Anglican and Lutheran commentators`,
          argument: `Pleroma carries its active, quasi-technical sense of "that which completes"—just as a body completes its head, the church completes Christ in his cosmic mission. The head-body metaphor presses this: a head without a body is functionally incomplete, and Christ's purpose of filling all things is accomplished through his body. This is not a diminishment but a statement of his sovereign choice to work through his people.`,
          key_texts: `Ephesians 1:22-23; Ephesians 4:12-16; Colossians 1:24; 1 Corinthians 12:12-27`,
          weakness: `The notion that Christ is in any sense "incomplete" without the church creates significant Christological tension and risks elevating ecclesiology to a level that encroaches on the sufficiency and sovereignty of Christ himself.`,
        },
        {
          name: `The Church as Cosmic Agent of Christ's Filling`,
          held_by: `Thorsten Moritz, aspects of John Chrysostom, and contemporary mission theologians including N.T. Wright (partially)`,
          argument: `In light of the cosmic scope of verses 20-22, Christ fills all things precisely through his body the church, which becomes the locus and instrument of his universal lordship. The church is neither merely filled nor merely complementary—it is the active agent through which the risen Christ extends his filling reign, uniting the ecclesiological and cosmological dimensions and grounding a genuine missionary-creational mandate.`,
          key_texts: `Ephesians 1:20-23; Ephesians 3:10; Ephesians 4:10; Matthew 28:18-20; Colossians 1:18-20`,
          weakness: `Risks conflating the church's role with Christ's unique cosmic work, and the immediate grammatical context does not obviously support agency as the primary sense of pleroma; it may reflect a missiological agenda imported into the text.`,
        },
      ],
      common_ground: `All serious interpreters agree that verse 23 climaxes a sustained argument about the supreme cosmic exaltation of Christ. Every tradition affirms that the church's identity is inseparable from union with the exalted Christ, that the head-body metaphor is central, and that Christ's authority is absolute over every power named in verse 21. There is universal agreement that the passage grounds Christian prayer, hope, and identity in objective realities—what God has done in Christ.`,
      historical_development: `The early fathers (Chrysostom, Theodoret) read pleroma in relational, doxological terms. Medieval interpreters like Aquinas engaged the Aristotelian head-body logic but kept ecclesiology subordinate to Christology. The Reformation—especially Calvin—stressed divine sovereignty against any reading that implies the church adds to Christ. Modern scholarship since J.A. Robinson's 1903 commentary has reopened the active-passive debate with fresh philological rigor.`,
      secondary_disputes: [
        `The precise referent of "the spirit of wisdom and revelation" (v. 17)—the Holy Spirit personally, a disposition given by the Spirit, or an attitude Paul prays God will cultivate.`,
        `How "principality, power, might, and dominion" (v. 21) should be understood—spiritual/demonic hierarchies, political and institutional powers, or a rhetorical device expressing totality with no specific referent.`,
      ],
      pastoral_wisdom: `Preachers should name the interpretive question honestly—acknowledging that faithful scholars read verse 23 differently—because doing so models the intellectual integrity that builds long-term trust. At the same time, the shared theological core is sufficient for powerful proclamation: Christ is exalted above all things, the church is genuinely united to him, and this union is the ground of both identity and hope. Say, "Scholars debate the precise force of this phrase, but every serious reading agrees on this..." and drive home the shared substance. The uncertainty about the periphery should never cloud the luminous center.`,
    },
  }),

  leadership: done({
    leadership: {
      principle: `A leader's power to influence is only as real as their connection to a power far greater than themselves—the resurrection power of Christ that seated Him above all authority. Pray for enlightened eyes to see what your team is truly capable of becoming, not just what they currently are.`,
      inner_life: `Paul begins not with commands but with thanksgiving and intercession—revealing that a leader's interior posture must be gratitude and spiritual hunger before it can be directive. The leader is not the source of vision or power but a conduit who must continuously petition God for wisdom to see reality as it is. This exposes a critical vulnerability: leaders often act confident when they should be on their knees admitting their need. Sustainable leadership is marked by humility, constant prayer for discernment, and the recognition that enlightenment is a gift, not an achievement.`,
      leading_through_it: `Lead your team first into prayer for spiritual sight—ask God to enlighten the eyes of understanding about the true potential and calling of your organization and each person in it. Stop confusing busyness with momentum; regularly reframe work in light of ultimate purpose and dignity. Because Christ's headship over the church is integrative rather than tyrannical, your leadership should create coherence and mutual belonging, not fragmentation. This week, identify one conversation where you can help someone see their role as participation in something transcendent.`,
      blind_spot: `Leaders resist the implication that their authority is derivative, not original—that they lead only insofar as they remain submitted to a greater power. The emphasis on Christ being "far above all principality and power" threatens the subtle idolatry of organizational autonomy and self-sufficiency that even Christian leaders harbor. Most will read this passage and feel affirmed in their authority without feeling the more uncomfortable call to radical dependence.`,
      difficult_conversations: `When you must confront a leader about their influence, use this passage to reframe the conversation away from personality toward power source and accountability: "Are you leading from prayerful dependence on God's wisdom, or from your own confidence? Is Christ genuinely the head of what you're doing, or have you quietly taken that position?" This gives you permission to ask the hard question without it being personal—it's about alignment with reality, and all authority is ultimately accountable to Christ's.`,
      team_questions: [
        `Paul prays our "eyes be enlightened" to see the hope of Christ's calling, the riches of His inheritance, and His transcendent power. Right now, in our leadership, what are we blind to that we need God to show us?`,
        `Christ's power is the same that raised Him from the dead. What in our organization feels "dead"—what needs resurrection power, not just better processes?`,
        `Christ is "head over all things to the church, which is His body." How well are we actually functioning as a body, and where are we fragmented or disconnected?`,
        `Paul ceases not to pray and give thanks for them. Who on your team do you regularly intercede for by name? What would change if every leader committed to that?`,
      ],
      weekly_practice: `Beginning tomorrow, spend 10 minutes each morning praying specifically for one person you lead—not for what they accomplish, but that their eyes would be enlightened to see their true identity and calling in Christ, and that they would experience His power working in them. Write down one insight about each person that came during prayer, and find one moment this week to reflect that insight back to them genuinely.`,
    },
  }),

  essayoutline: done({
    essay_outline: {
      suggested_title: `The Apostolic Intercession and Cosmic Christology in Ephesians 1:15-23: Paul's Theology of Enlightenment, Power, and Ecclesial Fullness`,
      thesis: `Ephesians 1:15-23 presents Paul's intercessory prayer as the theological linchpin connecting three inseparable realities—the Spirit-enabled knowledge of believers, Christ's cosmic supremacy over all powers, and the Church's ontological identity as Christ's body—thereby establishing that authentic Christian faith necessarily involves comprehending both the subjective experience of divine enlightenment and the objective reality of Christ's universal lordship exercised through the Church.`,
      abstract: `This exegetical study examines Paul's prayer passage as a coherent theological statement on knowledge, Christology, and ecclesiology. Rather than treating these themes separately, the paper argues that Paul constructs an inseparable triad: believers must grasp (through illuminated understanding) both the hope of their calling and the exceeding power of God, which Paul demonstrates through Christ's resurrection and cosmic exaltation, the effects of which manifest in the Church as His body. The analysis addresses grammatical complexities, traces patristic through modern interpretive traditions, and shows that this passage corrects both spiritualized Christianity divorced from cosmic reality and institutional Christianity divorced from experiential encounter with divine power.`,
      sections: [
        { section: `I. Introduction`, content: `Open with the pastoral and theological weight of Paul's intercessory burden in 1:15-23—the longest sentence in Ephesians. Establish why the passage merits attention: it bridges the doctrinal opening (1:3-14) with practical application (2:1ff), contains contested interpretive cruxes, and is often preached in isolated fragments. Identify the scholarly gap (insufficient attention to how Paul coordinates Spirit-given epistemology with Christological cosmology and ecclesiology), state the thesis, and provide a roadmap.` },
        { section: `II. Historical and Literary Context`, content: `Establish authorship (defend Pauline authorship against deutero-Pauline theories, or acknowledge the debate fairly), date (early 60s CE if Paul), and destination (circular letter to Asia Minor). Analyze the thanksgiving-prayer structure following 1:3-14, the unusual length of the single Greek sentence, and structural parallels to Colossians 1:9-14 and Philippians 1:9-11.` },
        { section: `III. Exegetical Analysis`, content: `Three sub-sections: (A) The Petition's Foundation (1:15-17a)—"wherefore" (dio), "faith in the Lord Jesus," "love toward all the saints," and the prayer for "the spirit of wisdom and revelation." (B) The Knowledge Sought (1:18-19a)—the "eyes of the heart" metaphor and the three objects of knowledge (hope, inheritance, power), including the contested phrase about the inheritance "in the saints." (C) The Power Demonstrated (1:19b-23)—the triple intensification of power terminology, resurrection as the paradigm, the Psalm 110:1 session, the cosmic taxonomy of verse 21, and the active/passive grammar of "fullness" in verses 22-23.` },
        { section: `IV. Theological Themes`, content: `Synthesize four themes: (1) Pneumatology and Epistemology—the Spirit enabling relational, transformative knowing; (2) Christology and Cosmic Order—resurrection as vindication of Christ's lordship; (3) Ecclesiology—the church as body and fullness; (4) Eschatology—the "already/not yet" of Christ's reign "in this age and the age to come."` },
      ],
      key_arguments: [
        `Paul's prayer is not a devotional aside but the theological hinge of Ephesians, converting the indicative blessings of 1:3-14 into a petition for their experiential apprehension.`,
        `The "exceeding greatness of his power" is defined christologically and historically—by the resurrection and session—so any abstraction of divine power from the resurrection event distorts the text.`,
        `The grammar of verse 23 ("fullness... that filleth all in all") is genuinely contested, and the interpreter's decision between active and passive senses carries major Christological and ecclesiological stakes.`,
        `Paul's cosmic Christology is best read not as primitive mythology but as a polemical assertion of Christ's supremacy over the named powers his Ephesian readers genuinely feared.`,
      ],
      research_starting_points: [
        `Harold W. Hoehner, Ephesians: An Exegetical Commentary (Baker Academic, 2002)`,
        `Andrew T. Lincoln, Ephesians, Word Biblical Commentary (1990)`,
        `Clinton E. Arnold, Power and Magic: The Concept of Power in Ephesians`,
        `Markus Barth, Ephesians 1-3, Anchor Bible (1974)`,
        `Primary texts: Psalm 110:1, Psalm 8:6, and the Qumran Hodayot (1QH) for the "enlightened eyes" tradition`,
      ],
    },
  }),

  commentary: done({
    commentary: {
      matthew_henry: `Matthew Henry sees Paul's intercessory prayer as a model of pastoral concern—genuine thanksgiving for others' faith naturally overflows into intercession. He emphasizes the three-fold knowledge Paul prays for (hope, inheritance, power) as progressive illumination by the Spirit, and draws attention to the "eyes of understanding" as the inner faculty that must be supernaturally opened. He underscores Christ's cosmic exaltation as the supreme comfort for the church militant.`,
      spurgeon: `Spurgeon seized on this as one of the most electrifying descriptions of divine power in Scripture, preaching that the same resurrection power that burst the bands of death is at work in every regenerate soul. He found in the "exceeding greatness of his power" a rebuke to spiritual lethargy, and was characteristically pastoral in applying Christ's exaltation to suffering believers—no earthly principality can harm those whose Head sits above all powers.`,
      calvin: `Calvin argues that "spirit of wisdom and revelation" refers not to a new Spirit but to specific operations of the one Spirit that open the eyes of the mind to revealed truth. He stresses that the knowledge of God here is experiential and salvific, not speculative. Characteristically Christocentric on verses 20-22, he distinguishes Christ's mediatorial headship over the church (governing and nourishing) from His coercive lordship over all things.`,
      augustine: `Augustine reads the passage through his theology of illumination—the sin-darkened intellect requires a divine interior teacher to perceive eternal realities. He connects the "hope of his calling" to predestinating grace and meditates on verse 23 as one of the most profound expressions of the totus Christus, the whole Christ. He uniquely contributes the insight that Christ in some sense "completes" himself in the church—not ontologically but relationally and missiologically.`,
      luther: `Luther approaches the passage through the distinction between law and gospel, seeing the prayer for wisdom as an assault on human pride that imagines it can know God through unaided reason. He was struck by the resurrection and exaltation as the foundation of all Christian confidence, and saw the subjugation of principalities and powers as directly relevant to the believer's freedom from sin, death, and the devil—the church's dignity being entirely derived from union with its triumphant Head.`,
      modern_reformed: `D.A. Carson emphasizes the grammatical crescendo of the three "that ye may know" clauses, anchoring Christian identity in objective realities. John Piper preaches it as fundamentally about God-centered joy in knowing the hope, inheritance, and power that belong to those united to Christ. R.C. Sproul highlighted the exaltation language as decisive evidence for the full deity and cosmic lordship of Christ, and Tim Keller draws on it to argue that Christian community is constitutive of faith, not a supplement to it.`,
      modern_evangelical: `Evangelical scholarship debates the precise referent of "spirit of wisdom and revelation"—most mainstream commentators (Peter O'Brien, Harold Hoehner) favoring the Holy Spirit in His illuminating function. There is significant discussion of the "principalities and powers" (Clinton Arnold arguing for malevolent spiritual beings in the Greco-Roman cosmic hierarchy), and division over whether the church fills Christ, Christ fills the church, or both. Broadly, evangelical scholars agree on the centrality of Christ's physical resurrection and bodily exaltation as the historical ground for the power Paul describes.`,
      areas_of_agreement: `All commentators agree the passage is fundamentally a prayer rooted in thanksgiving, modeling the inseparable connection between apostolic gratitude and intercession. There is universal agreement that the resurrection and exaltation to God's right hand is the supreme historical demonstration of divine power and defines the believer's hope, that the church is described with extraordinary dignity as the body of Christ, and that Paul's goal is not abstract theology but transformative knowledge.`,
      areas_of_debate: `The most significant debate concerns the syntax of verse 23—whether the church fills Christ (active), Christ fills the church (passive), or it is a middle construction of mutual fullness. A second concerns whether "the spirit of wisdom and revelation" is the Holy Spirit proper or a spiritual quality imparted by the Spirit. The identity of the "principalities and powers" is disputed between purely spiritual-demonic entities, structural and institutional powers, and (like Walter Wink) a both/and reading with sociopolitical implications.`,
      best_insight: `The single most illuminating insight is Calvin's distinction—sharpened by modern Reformed scholarship—that Christ's headship over "all things" and over the church are qualitatively different: over all things he rules with sovereign coercion, but over the church he rules as a living Head nourishing and governing his own body through love and grace. This explains why Paul moves from the cosmic scope of verses 20-21 to the intimate ecclesiological language of verses 22-23, and guards against both a triumphalist and a reductionist ecclesiology.`,
    },
  }),

  fathers: done({
    church_fathers: [
      {
        father: 'John Chrysostom', dates: 'c. 347-407 AD', tradition: 'Antiochene',
        quote: `See how he continually employs the word "knowledge." He said not simply that ye may know, but "that the eyes of your understanding may be enlightened." For as it is possible to see and yet not see clearly, so it is with knowledge. He prays that they may see not as through a mist but with sharp and piercing sight.`,
        context: `Chrysostom delivered these reflections in his homilies on Ephesians, preaching in Antioch and Constantinople. He was concerned to show that Christian knowledge is not merely intellectual but a Spirit-illumined perception of divine realities—insisting that prayer, not scholarship alone, is the proper gateway to theological understanding.`,
      },
      {
        father: 'Jerome', dates: 'c. 347-420 AD', tradition: 'Latin',
        quote: `Paul does not pray that they may receive the Holy Spirit, whom they had already received at baptism, but that the Spirit of wisdom and revelation may deepen within them the knowledge of God. The Church, which is His body, is the fullness of Him who fills all things in every way, so that nothing of Him is lacking where she is present.`,
        context: `Jerome engaged this passage in his commentary on Ephesians, written during his early scholarly years. He was interested in the relationship between the indwelling Spirit and progressive enlightenment, combating any idea that baptism exhausted the Spirit's role. His attention to the Latin text and its Greek antecedents bridges Eastern exegesis and Western theology.`,
      },
      {
        father: 'Origen of Alexandria', dates: 'c. 184-253 AD', tradition: 'Alexandrian',
        quote: `The "spirit of wisdom and revelation" is none other than the Holy Spirit Himself, who draws back the veil of hidden things so that the mind ascends to the knowledge of God. For the eyes of the heart—not those of the body—must be illumined, since divine things are apprehended only by the purified intellect.`,
        context: `Origen treated this passage in his fragmentary commentary on Ephesians, portions of which survive in the catena tradition. He was responding to the question of how finite human minds attain genuine knowledge of an infinite God—pressed sharply by Gnostic opponents who claimed secret illumination. His answer continues to shape Eastern monastic theology and Western mystical traditions.`,
      },
      {
        father: 'Theodore of Mopsuestia', dates: 'c. 350-428 AD', tradition: 'Antiochene',
        quote: `Paul gives thanks for the Ephesians and immediately turns his thanksgiving into intercession, for he knows that gratitude rightly ordered always seeks the further good of the beloved. He anchors this power in history: it is the same power that raised Christ bodily from the dead and exalted Him to the right hand of the Father, high above every cosmic authority.`,
        context: `Theodore commented on this passage in his Pauline commentary, with characteristic attention to its literal-historical sense and coherent argument. His insistence on the bodily resurrection as the ground of Christian hope stands as a corrective to spiritualizing tendencies that detach Christian confidence from historical reality.`,
      },
    ],
  }),

  archaeology: done({
    archaeology: [
      {
        discovery: 'Ephesus Excavations — Temple of Artemis & Imperial Cult Inscriptions',
        location: 'Ephesus (modern Selçuk, Turkey)',
        date_found: 'Excavations begun by John Turtle Wood, 1863; continued by the Austrian Archaeological Institute, 1895-present',
        relevance: `Paul's language of "principality, power, might, and dominion" (v. 21) directly counters the imperial-cult titles and divine honors ascribed to Roman emperors and deities at Ephesus. The city was saturated with claims of divine lordship—Caesar held titles like "Lord" and "Savior"—making Paul's declaration of Christ's supremacy "far above" all such powers a pointed theological confrontation.`,
        details: `Excavations uncovered extensive remains of the Temple of Artemis, one of the Seven Wonders of the Ancient World, along with numerous inscriptions honoring emperors as divine lords. The Tetragonos Agora and the Embolos street yielded dedications to Augustus, Domitian, and Trajan using titles of cosmic sovereignty. Statues, altar inscriptions, and honorific decrees demonstrate a culture deeply invested in hierarchical divine powers.`,
        significance: `These discoveries make viscerally real what was at stake when Paul wrote that Christ sits "far above all principality and power." The congregation lived inside a city where competing lordship claims were carved in stone on every public building, giving Paul's cosmic Christology an immediate, confrontational edge modern readers easily miss.`,
      },
      {
        discovery: 'Dura-Europos House Church & Baptistery',
        location: 'Dura-Europos, eastern Syria on the Euphrates',
        date_found: 'Excavated by Yale University and the French Academy, 1928-1937 (Clark Hopkins, Michael Rostovtzeff)',
        relevance: `The earliest identified Christian church building (c. AD 232-256) shows how early house-church communities worshiped the exalted Christ in a setting surrounded by competing cults and imperial imagery—illuminating the lived context of churches that received letters like Ephesians.`,
        details: `The site preserved a converted private house with a dedicated baptistery and some of the earliest known Christian wall paintings, set within a Roman garrison town crowded with temples to Palmyrene, Greek, and Roman deities. Its artifacts are housed largely at the Yale University Art Gallery.`,
        significance: `For teachers of Ephesians, Dura-Europos shows that Paul's language of Christ's exaltation "above every name that is named" was not abstraction but a direct challenge to the reigning political and religious theology of the Roman world—the crucified and risen Jesus outranking the most powerful figures his readers knew.`,
      },
      {
        discovery: 'Dead Sea Scrolls — Hodayot (Thanksgiving Hymns)',
        location: 'Qumran Caves, northwestern shore of the Dead Sea',
        date_found: 'Cave 1 discovered 1947; systematic excavation by Roland de Vaux and the École Biblique, 1949-1956',
        relevance: `The Hodayot use language strikingly similar to Ephesians 1:17-18, praying for divine illumination of the "eyes of the heart" and the granting of a "spirit of wisdom and understanding"—demonstrating that Paul drew on a living Jewish liturgical and wisdom tradition rather than inventing new vocabulary.`,
        details: `The Hodayot (1QH) contain hymns expressing gratitude to God for revealing hidden knowledge, using phrases like "you have illumined my face" and praying for insight into divine mysteries. The scrolls date from roughly 150 BC to AD 68; scholars including Joseph Fitzmyer and Markus Barth have noted extensive parallels with Pauline prayer texts. They are housed primarily at the Shrine of the Book, Israel Museum, Jerusalem.`,
        significance: `These discoveries ground Paul's intercessory prayer firmly within Jewish liturgical practice—his petition for divine wisdom was a recognizable form of Jewish covenantal prayer, not a Hellenistic mystical formula. The prayer carries the weight of centuries of Israel's longing to know God, now applied to the new community formed in Christ.`,
      },
    ],
  }),

  books: done({
    books: [
      { title: 'Ephesians: An Exegetical Commentary', author: 'Harold W. Hoehner', level: 'Scholar', type: 'Commentary', description: `Exhaustive exegetical analysis of Ephesians 1:15-23, examining Greek grammatical structures, textual variants, and the cosmic Christology at the heart of Paul's prayer. Particularly valuable for the connection between Christ's exaltation and the church's identity.` },
      { title: 'The Epistles to the Colossians, to Philemon, and to the Ephesians', author: 'F.F. Bruce', level: 'Intermediate', type: 'Commentary', description: `Bruce's New International Commentary balances scholarly rigor with pastoral sensitivity, making complex theological concepts accessible. His treatment of the cosmic dimensions of Christ's rule and the church as His body is especially illuminating.` },
      { title: 'Power and Magic: The Concept of Power in Ephesians', author: 'Clinton E. Arnold', level: 'Intermediate', type: 'Background', description: `Contextualizes Ephesians within the magical and spiritual worldview of Ephesian culture, showing why Paul emphasizes Christ's power over cosmic forces in 1:19-21 and how the passage addresses the spiritual anxieties of first-century believers.` },
      { title: 'The Prison Epistles: Colossians, Ephesians, Philippians, Philemon', author: 'Sinclair Ferguson', level: 'Intermediate', type: 'Theology', description: `Theological synthesis of Ephesians within Paul's prison epistles, helping readers see how 1:15-23 functions as the foundation for the whole letter. His analysis of Paul's pneumatology and ecclesiology is particularly strong.` },
      { title: 'Ephesians', author: 'Andrew T. Lincoln (Word Biblical Commentary)', level: 'Advanced', type: 'Commentary', description: `Detailed analysis of the prayer's theological structure, the meaning of spiritual enlightenment (phōtismos), and the eschatological framework underlying Paul's petition. His attention to rhetorical strategy illuminates why Paul structures his intercession as he does.` },
      { title: 'The Heavenlies Opened: A Sketch of the Epistle to the Ephesians', author: 'Watchman Nee', level: 'Beginner', type: 'Devotional', description: `A devotional treatment offering spiritual insight into the passage's emphasis on heavenly perspective and spiritual vision. Less technical, but provides valuable meditative depth for grasping Christ's cosmic authority.` },
      { title: "God's New Humanity: A Biblical Theology of Ephesians", author: 'Stephen B. Clark', level: 'Advanced', type: 'Theology', description: `Synthesizes Ephesians 1:15-23 within Paul's theology of the church as God's new humanity, showing how the passage's cosmic Christology grounds Christian identity and practice. Helpful for ecclesiology.` },
      { title: 'Ephesians: A Linguistic and Rhetorical Analysis', author: 'S.M. Baugh', level: 'Scholar', type: 'Language', description: `Analyzes the Greek linguistic structure and rhetorical patterns of the prayer, illuminating how Paul's word choices convey theological meaning. Essential for readers wanting linguistic precision.` },
    ],
  }),

  citations: done({
    citations: {
      disclaimer: `These sources are AI-generated from the standard scholarly literature on this passage. Verify each against a library catalog or database before citing — confirm author, edition, year, and page numbers.`,
      commentaries: [
        { title: 'The Epistles to the Colossians, to Philemon, and to the Ephesians', series: 'New International Commentary on the New Testament', author_first: 'Frederick F.', author_last: 'Bruce', publisher: 'Eerdmans', location: 'Grand Rapids, MI', year: '1984',
          sbl: `Bruce, Frederick F. The Epistles to the Colossians, to Philemon, and to the Ephesians. NICNT. Grand Rapids, MI: Eerdmans, 1984.`,
          turabian: `Bruce, Frederick F. The Epistles to the Colossians, to Philemon, and to the Ephesians. The New International Commentary on the New Testament. Grand Rapids, MI: William B. Eerdmans, 1984.`,
          mla: `Bruce, Frederick F. The Epistles to the Colossians, to Philemon, and to the Ephesians. William B. Eerdmans, 1984.` },
        { title: 'Ephesians: An Exegetical Commentary', author_first: 'Harold W.', author_last: 'Hoehner', publisher: 'Baker Academic', location: 'Grand Rapids, MI', year: '2002',
          sbl: `Hoehner, Harold W. Ephesians: An Exegetical Commentary. Grand Rapids, MI: Baker Academic, 2002.`,
          turabian: `Hoehner, Harold W. Ephesians: An Exegetical Commentary. Grand Rapids, MI: Baker Academic, 2002.`,
          mla: `Hoehner, Harold W. Ephesians: An Exegetical Commentary. Baker Academic, 2002.` },
        { title: 'The Letter to the Ephesians', series: 'Pillar New Testament Commentary', author_first: 'Peter T.', author_last: "O'Brien", publisher: 'Eerdmans', location: 'Grand Rapids, MI', year: '1999',
          sbl: `O'Brien, Peter T. The Letter to the Ephesians. PNTC. Grand Rapids, MI: Eerdmans, 1999.`,
          turabian: `O'Brien, Peter T. The Letter to the Ephesians. The Pillar New Testament Commentary. Grand Rapids, MI: William B. Eerdmans, 1999.`,
          mla: `O'Brien, Peter T. The Letter to the Ephesians. William B. Eerdmans, 1999.` },
        { title: 'Ephesians', series: 'International Critical Commentary', author_first: 'Ernest', author_last: 'Best', publisher: 'T&T Clark', location: 'Edinburgh', year: '1998',
          sbl: `Best, Ernest. Ephesians. ICC. Edinburgh: T&T Clark, 1998.`,
          turabian: `Best, Ernest. Ephesians. International Critical Commentary. Edinburgh: T&T Clark, 1998.`,
          mla: `Best, Ernest. Ephesians. T&T Clark, 1998.` },
        { title: 'Ephesians', series: 'Word Biblical Commentary', author_first: 'Andrew T.', author_last: 'Lincoln', publisher: 'Word Books', location: 'Dallas, TX', year: '1990',
          sbl: `Lincoln, Andrew T. Ephesians. WBC. Dallas, TX: Word Books, 1990.`,
          turabian: `Lincoln, Andrew T. Ephesians. Word Biblical Commentary. Dallas, TX: Word Books, 1990.`,
          mla: `Lincoln, Andrew T. Ephesians. Word Books, 1990.` },
        { title: 'Ephesians: Translation and Commentary on Chapters 1-3', series: 'Anchor Bible', author_first: 'Markus', author_last: 'Barth', publisher: 'Doubleday', location: 'Garden City, NY', year: '1974',
          sbl: `Barth, Markus. Ephesians: Translation and Commentary on Chapters 1-3. AB. Garden City, NY: Doubleday, 1974.`,
          turabian: `Barth, Markus. Ephesians: Translation and Commentary on Chapters 1-3. The Anchor Bible. Garden City, NY: Doubleday, 1974.`,
          mla: `Barth, Markus. Ephesians: Translation and Commentary on Chapters 1-3. Doubleday, 1974.` },
      ],
      background_works: [
        { title: 'Power and Magic: The Concept of Power in Ephesians', author_first: 'Clinton E.', author_last: 'Arnold', publisher: 'Baker Book House', location: 'Grand Rapids, MI', year: '1992',
          sbl: `Arnold, Clinton E. Power and Magic: The Concept of Power in Ephesians. Grand Rapids, MI: Baker, 1992.`,
          turabian: `Arnold, Clinton E. Power and Magic: The Concept of Power in Ephesians. Grand Rapids, MI: Baker Book House, 1992.`,
          mla: `Arnold, Clinton E. Power and Magic: The Concept of Power in Ephesians. Baker Book House, 1992.` },
        { title: 'The IVP Bible Background Commentary: New Testament', author_first: 'Craig S.', author_last: 'Keener', publisher: 'InterVarsity Press', location: 'Downers Grove, IL', year: '1993',
          sbl: `Keener, Craig S. The IVP Bible Background Commentary: New Testament. Downers Grove, IL: InterVarsity, 1993.`,
          turabian: `Keener, Craig S. The IVP Bible Background Commentary: New Testament. Downers Grove, IL: InterVarsity Press, 1993.`,
          mla: `Keener, Craig S. The IVP Bible Background Commentary: New Testament. InterVarsity Press, 1993.` },
        { title: 'Colossians and Ephesians', series: 'Sacra Pagina', author_first: 'Margaret Y.', author_last: 'MacDonald', publisher: 'Liturgical Press', location: 'Collegeville, MN', year: '2000',
          sbl: `MacDonald, Margaret Y. Colossians and Ephesians. SP. Collegeville, MN: Liturgical Press, 2000.`,
          turabian: `MacDonald, Margaret Y. Colossians and Ephesians. Sacra Pagina. Collegeville, MN: The Liturgical Press, 2000.`,
          mla: `MacDonald, Margaret Y. Colossians and Ephesians. The Liturgical Press, 2000.` },
      ],
      lexicons: [
        { short_name: 'BDAG', full_title: 'A Greek-English Lexicon of the New Testament and Other Early Christian Literature', editor: 'Arndt, Danker & Gingrich', edition: '3rd', publisher: 'University of Chicago Press', year: '2000',
          sbl: `Arndt, William F., Frederick W. Danker, and William F. Gingrich. A Greek-English Lexicon of the New Testament and Other Early Christian Literature. 3rd ed. Chicago: University of Chicago Press, 2000.`,
          turabian: `Arndt, William F., Frederick W. Danker, and William F. Gingrich. A Greek-English Lexicon of the New Testament and Other Early Christian Literature. 3rd edition. Chicago: University of Chicago Press, 2000.` },
      ],
      free_online_resources: [
        { name: 'STEP Bible (Tyndale House)', url: 'https://www.stepbible.org', description: `Free interlinear, lexicon, and morphology tools for working through the Greek of Ephesians 1:15-23.` },
        { name: 'Bible Hub — Ephesians 1', url: 'https://biblehub.com/ephesians/1.htm', description: `Parallel translations, Strong's numbers, and a range of public-domain commentaries on the passage.` },
      ],
    },
  }),
}

/** Controlled practice items for English File private-lesson sheets. */

export const PRIVATE_ENGLISH_EXERCISES = {
  beginner: {
    1: {
      explanation:
        'Use am/are with I and you. Use is with he/she/it. Practise countries and cafe language from File 1.',
      visual: [
        ['I / you', "I'm Sara. Are you a student?"],
        ['he / she / it', "She's from Syria. It's cold."],
      ],
      exercises: [
        { q: "I ____ (be) from Damascus.", a: "am"},
        { q: "____ you on holiday?", a: "Are"},
        { q: "She ____ (be) from Japan.", a: "is"},
        { q: "A cappuccino, ____ (please / thanks).", a: "please"},
      ],
      mistakes: [
        { wrong: "Saying “I is” or “She am”.", tip: "Drill: I am / you are / he-she-it is."},
        { wrong: "Mixing country and nationality.", tip: "Syria (country) vs Syrian (nationality) — File 2 reviews this."},
      ],
    },
    2: {
      explanation:
        'Use are with we/you/they. Ask Wh- and How questions with be. Practise nationalities and numbers 11–100.',
      visual: [
        ['Plural be', "We're on holiday. They're Turkish."],
        ['Wh- + be', 'Where are you from? How old is he?'],
      ],
      exercises: [
        { q: "We ____ (be) from Lebanon.", a: "are"},
        { q: "____ they Egyptian?", a: "Are"},
        { q: "Where ____ you from?", a: "are"},
        { q: "My number is zero ____ five (write 5 as a word).", a: "five"},
      ],
      mistakes: [
        { wrong: "Forgetting are with they/we.", tip: "Chorus drill we/you/they + are."},
        { wrong: "Wrong question order: “Where you are?”", tip: "Wh-word + be + subject."},
      ],
    },
    3: {
      explanation:
        'Use a/an with singular nouns and form regular plurals. Use this/that/these/those for souvenirs and small objects.',
      visual: [
        ['a / an', 'a key, an umbrella'],
        ['this / those', 'This is a bag. Those are souvenirs.'],
      ],
      exercises: [
        { q: "It is ____ umbrella.", a: "an"},
        { q: "Where are my ____ (key)?", a: "keys"},
        { q: "____ is my phone. (near)", a: "This"},
        { q: "____ are postcards. (far)", a: "Those"},
      ],
      mistakes: [
        { wrong: "Using a before vowel sounds (“a apple”).", tip: "Listen for the sound, not the letter."},
        { wrong: "Confusing this/these.", tip: "this/that = singular; these/those = plural."},
      ],
    },
    4: {
      explanation:
        "Use possessive adjectives (my/your/his…) and possessive 's for family. Put colour/adjective before the noun.",
      visual: [
        ['Possessive', "This is my sister. It's Sara's car."],
        ['Adjective + noun', 'a red car / a perfect car'],
      ],
      exercises: [
        { q: "This is ____ (I) brother.", a: "my"},
        { q: "That is ____ (Sara) bag.", a: "Sara's"},
        { q: "It is a ____ car. (colour: blue)", a: "blue"},
        { q: "His family ____ (be) big.", a: "is"},
      ],
      mistakes: [
        { wrong: "Adjective after noun (“car red”).", tip: "English: adjective + noun."},
        { wrong: "Missing 's: “Sara bag”.", tip: "Name + 's for possession."},
      ],
    },
    5: {
      explanation:
        'Present simple with I/you/we/they: affirmative, negative, and questions. Food/drink and common verb phrases.',
      visual: [
        ["[+]", "I like coffee. We eat breakfast."],
        ['[?] / [-]', "Do you drink tea? They don't eat meat."],
      ],
      exercises: [
        { q: "I ____ (like) eggs for breakfast.", a: "like"},
        { q: "We ____ (not / eat) meat.", a: "don't eat"},
        { q: "____ you drink coffee?", a: "Do"},
        { q: "They ____ (have) a long flight.", a: "have"},
      ],
      mistakes: [
        { wrong: "Using does with I/you/we/they.", tip: "do for I/you/we/they; does for he/she/it (File 6)."},
        { wrong: "Double marking: “Do you likes?”", tip: "Do + base verb."},
      ],
    },
    6: {
      explanation:
        'Present simple he/she/it (including -s/-es) and adverbs of frequency for daily routines and jobs.',
      visual: [
        ['he / she / it', 'She works in a hospital. He teaches English.'],
        ['Frequency', 'I usually get up at 7. She never drinks coffee.'],
      ],
      exercises: [
        { q: "She ____ (work) in a bank.", a: "works"},
        { q: "He ____ (not / teach) maths.", a: "doesn't teach"},
        { q: "____ she live in Homs?", a: "Does"},
        { q: "I ____ (always) brush my teeth.", a: "always"},
      ],
      mistakes: [
        { wrong: "Forgetting -s: “She work”.", tip: "Board he/she/it + verb-s."},
        { wrong: "Wrong adverb position: “I go usually”.", tip: "usually before the main verb."},
      ],
    },
    7: {
      explanation:
        'Question word order with be and present simple. Imperatives and object pronouns (me, him, her, us, them).',
      visual: [
        ['Questions', 'Where do you go? What is your favourite film?'],
        ['Imperative + object', 'Watch it! Call me later.'],
      ],
      exercises: [
        { q: "Where ____ you live?", a: "do"},
        { q: "____ open the window. (imperative)", a: "Open"},
        { q: "Please help ____ (I).", a: "me"},
        { q: "I love action films. I watch ____ every weekend.", a: "them"},
      ],
      mistakes: [
        { wrong: "“Where you live?”", tip: "Auxiliary before subject."},
        { wrong: "Subject pronouns after verbs (“help I”).", tip: "Object: me/him/her/us/them."},
      ],
    },
    8: {
      explanation:
        "Use can/can't for ability and permission. Use like/love/hate + -ing for activities.",
      visual: [
        ['can', "I can swim. Can I park here? She can't drive."],
        ['like + -ing', 'I love cooking. He hates running.'],
      ],
      exercises: [
        { q: "____ I sit here?", a: "Can"},
        { q: "She ____ (not / can) speak French.", a: "can't"},
        { q: "I love ____ (cook).", a: "cooking"},
        { q: "They hate ____ (get) up early.", a: "getting"},
      ],
      mistakes: [
        { wrong: "“I can to swim”.", tip: "can + base verb."},
        { wrong: "“I like cook”.", tip: "like/love/hate + verb-ing."},
      ],
    },
    9: {
      explanation:
        'Present continuous for now; contrast with present simple for habits. Clothes and travelling phrases.',
      visual: [
        ['Now', "I'm wearing a jacket. They're travelling."],
        ['Habit vs now', 'I usually wear jeans, but today I am wearing a dress.'],
      ],
      exercises: [
        { q: "Look! She ____ (wear) a red coat.", a: "is wearing"},
        { q: "They ____ (not / travel) today.", a: "aren't travelling"},
        { q: "I usually ____ (get) up at 7, but today I ____ (sleep).", a: "get / am sleeping"},
        { q: "____ you working now?", a: "Are"},
      ],
      mistakes: [
        { wrong: "Using present simple for “now”.", tip: "Highlight time words: now / today / look!"},
        { wrong: "Missing be: “She wearing”.", tip: "am/is/are + -ing."},
      ],
    },
    10: {
      explanation:
        "There's a / There are some for rooms. Past simple be: was/were with in/on/at.",
      visual: [
        ['there is / are', "There's a bed. There are some chairs."],
        ['was / were', 'I was at home. They were on the bus.'],
      ],
      exercises: [
        { q: "____ a bathroom in the room.", a: "There's"},
        { q: "____ some towels under the bed.", a: "There are"},
        { q: "Where ____ you yesterday?", a: "were"},
        { q: "She ____ at school on Monday.", a: "was"},
      ],
      mistakes: [
        { wrong: "“There is some chairs”.", tip: "are + plural noun."},
        { wrong: "“I were / They was”.", tip: "I/he/she/it was; you/we/they were."},
      ],
    },
    11: {
      explanation:
        'Past simple regular verbs (-ed) and high-frequency irregulars: get, go, have, do.',
      visual: [
        ['Regular', 'We started a new life. They visited family.'],
        ['Irregular', 'I got up, went to work, had lunch, did homework.'],
      ],
      exercises: [
        { q: "Yesterday I ____ (start) a new job.", a: "started"},
        { q: "She ____ (visit) her aunt last weekend.", a: "visited"},
        { q: "They ____ (go) to the USA in 2020.", a: "went"},
        { q: "I ____ (have) a good day. I ____ (do) a lot.", a: "had / did"},
      ],
      mistakes: [
        { wrong: "Pronouncing all -ed the same.", tip: "Practise /t/ /d/ /ɪd/ endings from the book."},
        { wrong: "“goed / haved”.", tip: "Memorise get-got, go-went, have-had, do-did."},
      ],
    },
    12: {
      explanation:
        'Revise past simple regular and irregular forms through a short narrative and systematic review.',
      visual: [
        ['Story past', 'They met on a train. He said hello.'],
        ['Revision', 'Check spelling and pronunciation of key past forms.'],
      ],
      exercises: [
        { q: "They ____ (meet) on a train.", a: "met"},
        { q: "He ____ (say) hello.", a: "said"},
        { q: "We ____ (not / know) each other.", a: "didn't know"},
        { q: "____ you see the film yesterday?", a: "Did"},
      ],
      mistakes: [
        { wrong: "Using present forms in a past story.", tip: "Timeline on the board before writing."},
        { wrong: "“Did you went?”", tip: "Did + base verb."},
      ],
    },
  },
  intermediate: {
    1: {
      explanation:
        'Contrast present simple vs continuous (action/non-action verbs). Choose future forms: present continuous, going to, will.',
      visual: [
        ['Present', "I usually cook at home. I'm cooking now. I love food. (not I'm loving)"],
        ['Future', "We're meeting at 8. I'm going to try a new recipe. I'll help you."],
      ],
      exercises: [
        { q: "She usually ____ (eat) out on Fridays.", a: "eats"},
        { q: "Quiet — I ____ (cook) dinner!", a: "am cooking"},
        { q: "We ____ (meet) my cousins tomorrow evening. (arrangement)", a: "are meeting"},
        { q: "I think it ____ (be) delicious.", a: "will be"},
      ],
      mistakes: [
        { wrong: "Continuous with stative verbs (“I’m knowing”).", tip: "List common non-action verbs."},
        { wrong: "Using will for fixed plans.", tip: "Diary arrangements → present continuous."},
      ],
    },
    2: {
      explanation:
        'Present perfect vs past simple; present perfect + for/since and present perfect continuous. Money and strong adjectives.',
      visual: [
        ['Experience vs finished time', "I've been to Beirut. I went last year."],
        ['Duration', "I've lived here for 3 years / since 2021. I've been studying all morning."],
      ],
      exercises: [
        { q: "____ you ever ____ (spend) too much money?", a: "Have / spent"},
        { q: "I ____ (buy) this phone yesterday.", a: "bought"},
        { q: "She ____ (work) here since 2019.", a: "has worked / has been working"},
        { q: "I was ____ — not just tired. (strong adjective)", a: "exhausted"},
      ],
      mistakes: [
        { wrong: "Present perfect with finished past time (“I've gone yesterday”).", tip: "yesterday/last… → past simple."},
        { wrong: "for vs since mix-ups.", tip: "for + period; since + starting point."},
      ],
    },
    3: {
      explanation:
        'Choose comparatives vs superlatives. Articles a/an/the/zero. Transport and verb/adjective + preposition collocations.',
      visual: [
        ['Comparison', 'Trains are safer than cars. The fastest way is the metro.'],
        ['Articles', 'I go to school by bus. The bus was late.'],
      ],
      exercises: [
        { q: "Planes are ____ (fast) than trains.", a: "faster"},
        { q: "This is ____ (bad) traffic I've seen.", a: "the worst"},
        { q: "She goes to ____ university in Aleppo.", a: "—"},
        { q: "I'm interested ____ languages.", a: "in"},
      ],
      mistakes: [
        { wrong: "Double marking (“more faster”).", tip: "short adj + -er; long adj more + adj."},
        { wrong: "Overusing the with institutions.", tip: "Contrast go to school vs the school near my house."},
      ],
    },
    4: {
      explanation:
        'Obligation/prohibition: have to, must, should. Ability: can, could, be able to. Phone language and -ed/-ing adjectives.',
      visual: [
        ['Obligation', "You mustn’t text while driving. You should silence your phone."],
        ['Ability', "I could swim at 5. I wasn't able to call you earlier."],
      ],
      exercises: [
        { q: "You ____ wear a seatbelt. (obligation)", a: "have to / must"},
        { q: "You ____ talk loudly in the cinema. (prohibition)", a: "mustn't / shouldn't"},
        { q: "I ____ finish the report yesterday. (ability in the past)", a: "was able to / could"},
        { q: "The news was ____ (amaze). I felt ____ (amaze).", a: "amazing / amazed"},
      ],
      mistakes: [
        { wrong: "mustn’t vs don’t have to.", tip: "mustn’t = prohibition; don’t have to = no obligation."},
        { wrong: "bored/boring mix-up.", tip: "-ing describes the thing; -ed the feeling."},
      ],
    },
    5: {
      explanation:
        'Combine past simple, continuous, and perfect. Habits/states: used to and present habits. Sport and relationships.',
      visual: [
        ['Past narrative', 'I was running when I fell. I had never tried that before.'],
        ['Habits', 'I used to play tennis. I usually meet friends on Fridays.'],
      ],
      exercises: [
        { q: "While she ____ (warm) up, the coach ____ (arrive).", a: "was warming / arrived"},
        { q: "I ____ (never / see) such a match before that day.", a: "had never seen"},
        { q: "He ____ (used to / play) football every weekend.", a: "used to play"},
        { q: "We ____ (meet) online, then we ____ (start) dating.", a: "met / started"},
      ],
      mistakes: [
        { wrong: "Only past simple in long stories.", tip: "Background = continuous; earlier past = perfect."},
        { wrong: "“I use to”.", tip: "used to + base verb."},
      ],
    },
    6: {
      explanation:
        'Passive across tenses for processes. Modals of deduction: might, can’t, must. Cinema and body vocabulary.',
      visual: [
        ['Passive', 'The scene was filmed at night. The film has been edited.'],
        ['Deduction', "He must be tired. It can't be her — she's abroad. It might rain."],
      ],
      exercises: [
        { q: "The movie ____ (direct) by a new filmmaker.", a: "was directed"},
        { q: "These photos ____ (take) yesterday.", a: "were taken"},
        { q: "She ____ be at home — the lights are on. (strong deduction)", a: "must"},
        { q: "That ____ be true — I saw him myself. (impossible)", a: "can't"},
      ],
      mistakes: [
        { wrong: "Active word order in passives.", tip: "be + past participle; agent with by if needed."},
        { wrong: "Using can for strong certainty now.", tip: "must / can’t for deduction; might for possibility."},
      ],
    },
    7: {
      explanation:
        'First conditional and future time clauses (when/until…). Second conditional for hypothetical situations. Education and houses.',
      visual: [
        ['Real future', "If I pass, I'll celebrate. When I finish, I'll call you."],
        ['Hypothetical', "If I had a bigger flat, I'd invite friends more often."],
      ],
      exercises: [
        { q: "If you study, you ____ (pass).", a: "will pass"},
        { q: "I'll wait until she ____ (arrive).", a: "arrives"},
        { q: "If I ____ (be) you, I ____ (rent) a smaller place.", a: "were / would rent"},
        { q: "If we had more space, we ____ (have) a garden.", a: "would have"},
      ],
      mistakes: [
        { wrong: "will after when/if in time clauses.", tip: "when/until + present; will in the main clause."},
        { wrong: "Mixing 1st and 2nd forms randomly.", tip: "Real vs imaginary — mark on the board."},
      ],
    },
    8: {
      explanation:
        'Gerunds vs infinitives after common verbs. Reported speech for statements and questions. Work and shopping.',
      visual: [
        ['Patterns', 'I enjoy working. I decided to apply. I want to get a raise.'],
        ['Report', "She said she was busy. He asked if the shop opened at 9."],
      ],
      exercises: [
        { q: "She suggested ____ (take) a break.", a: "taking"},
        { q: "They hope ____ (find) a better job.", a: "to find"},
        { q: "“I’m tired,” she said. → She said she ____ tired.", a: "was"},
        { q: "“Where is the till?” he asked. → He asked where the till ____.", a: "was"},
      ],
      mistakes: [
        { wrong: "Wrong pattern after suggest/enjoy/decide.", tip: "Keep a personal verb-pattern list."},
        { wrong: "Keeping question word order in reports.", tip: "Report → statement order."},
      ],
    },
    9: {
      explanation:
        'Third conditional for past regrets/hypotheticals. Quantifiers with device/digital-detox topics.',
      visual: [
        ['3rd conditional', "If I had left earlier, I wouldn't have missed the train."],
        ['Quantifiers', 'too much screen time / a few apps / hardly any free time'],
      ],
      exercises: [
        { q: "If I ____ (charge) my phone, I ____ (not / miss) the call.", a: "had charged / wouldn't have missed"},
        { q: "There is ____ traffic on this road. (too many / too much)", a: "too much"},
        { q: "I have ____ friends online, but ____ close friends offline. (many / a few)", a: "many / a few"},
        { q: "We have ____ privacy if we share everything. (little / few)", a: "little"},
      ],
      mistakes: [
        { wrong: "2nd conditional forms for past regrets.", tip: "if + past perfect → would have + V3."},
        { wrong: "much/many with wrong noun types.", tip: "much/little + uncountable; many/few + countable."},
      ],
    },
    10: {
      explanation:
        'Defining vs non-defining relative clauses. Question tags for confirmation. Compound nouns and crime vocabulary.',
      visual: [
        ['Relative clauses', 'The actor who won is Syrian. Damascus, which is ancient, is beautiful.'],
        ['Tags', "You're coming, aren't you? She didn't call, did she?"],
      ],
      exercises: [
        { q: "That’s the singer ____ wrote the song.", a: "who / that"},
        { q: "Aleppo, ____ is historic, attracts visitors.", a: "which"},
        { q: "You're a fan, ____ you?", a: "aren't"},
        { q: "They didn't catch the thief, ____ they?", a: "did"},
      ],
      mistakes: [
        { wrong: "Commas with defining clauses.", tip: "Extra info (non-defining) needs commas + which/who."},
        { wrong: "Wrong auxiliary in tags.", tip: "Opposite polarity; match tense/auxiliary."},
      ],
    },
  },
}

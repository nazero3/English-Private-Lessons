/** English File 4th edition — private lesson coursebook metadata
 * Sources:
 * - Beginner SB: 1_english-file-Beginner.pdf (PDF page = book page + 2)
 * - Intermediate SB: English File Intermediate 4e (PDF page = book page + 1)
 */

const BEGINNER_PDF_OFFSET = 2
const INTERMEDIATE_PDF_OFFSET = 1

function pdfPage(bookPage, offset) {
  return bookPage + offset
}

export const ENGLISH_FILE_COURSES = [
  {
    id: 'beginner',
    title: 'English File',
    subtitle: 'Beginner',
    level: 'A1',
    cefr: 'Beginner',
    color: '#1a2656',
    softColor: '#fff1c9',
    pdf: '/books/english/english-file/beginner-student-book.pdf',
    pageCount: 138,
    description:
      'English File Beginner 4th edition — start each File from lesson A, then B, then Practical English / Revise and Check when the book shows it.',
    files: [
      {
        file: 1,
        title: 'A cappuccino, please / World music',
        grammar: 'verb be (singular): I/you; he/she/it',
        vocab: 'numbers 0–10, days, goodbye; countries',
        pageStart: pdfPage(6, BEGINNER_PDF_OFFSET),
        bookPageStart: 6,
        summary:
          'Start on 1A cafe dialogues: order a drink, say your name, and practise am/are with I and you. Then move to 1B countries and he/she/it. Finish with Practical English Episode 1 (hotel / booking a table + classroom language and the alphabet).',
        lessons: [
          {
            code: '1A',
            title: 'A cappuccino, please',
            bookPage: 6,
            grammar: 'verb be (singular): I and you',
            vocab: 'numbers 0–10, days of the week, saying goodbye',
            pronunciation: '/h/, /aɪ/, and /iː/',
            startWith: 'Cafe listening/speaking panels — order, names, Nice to meet you.',
          },
          {
            code: '1B',
            title: 'World music',
            bookPage: 8,
            grammar: 'verb be (singular): he, she, it',
            vocab: 'countries',
            pronunciation: '/ɪ/, /əʊ/, /s/, and /ʃ/',
            startWith: 'Countries vocabulary, then he/she/it forms of be.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 1',
          bookPage: 10,
          focus: 'checking into a hotel, booking a table; classroom language; the alphabet',
        },
      },
      {
        file: 2,
        title: 'Are you on holiday? / That’s my bus!',
        grammar: 'verb be (plural); Wh- and How questions with be',
        vocab: 'nationalities; phone numbers, numbers 11–100',
        pageStart: pdfPage(12, BEGINNER_PDF_OFFSET),
        bookPageStart: 12,
        summary:
          'Start 2A with holiday/travel contexts using we/you/they + be and nationalities. Continue into 2B Wh-/How questions, phone numbers, and numbers 11–100. End with Revise and Check 1&2.',
        lessons: [
          {
            code: '2A',
            title: 'Are you on holiday?',
            bookPage: 12,
            grammar: 'verb be (plural): we, you, they',
            vocab: 'nationalities',
            pronunciation: '/dʒ/, /tʃ/, and /ʃ/',
            startWith: 'Plural be in holiday contexts + nationalities.',
          },
          {
            code: '2B',
            title: 'That’s my bus!',
            bookPage: 14,
            grammar: 'Wh- and How questions with be',
            vocab: 'phone numbers, numbers 11–100',
            pronunciation: 'understanding numbers',
            startWith: 'Question forms with be, then numbers practice.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 1&2', bookPage: 16 },
      },
      {
        file: 3,
        title: 'Where are my keys? / Souvenirs',
        grammar: 'singular/plural nouns, a/an; this/that/these/those',
        vocab: 'small things; souvenirs',
        pageStart: pdfPage(18, BEGINNER_PDF_OFFSET),
        bookPageStart: 18,
        summary:
          'Open 3A with everyday objects (keys, etc.), a/an, and singular/plural nouns. Move to 3B souvenirs with this/that/these/those. Close with Practical English Episode 2: prices and buying lunch.',
        lessons: [
          {
            code: '3A',
            title: 'Where are my keys?',
            bookPage: 18,
            grammar: 'singular and plural nouns, a / an',
            vocab: 'small things',
            pronunciation: '/z/ and /s/, plural endings',
            startWith: 'Naming small objects and forming plurals.',
          },
          {
            code: '3B',
            title: 'Souvenirs',
            bookPage: 20,
            grammar: 'this / that / these / those',
            vocab: 'souvenirs',
            pronunciation: '/ð/, sentence rhythm',
            startWith: 'Pointing language with souvenirs.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 2',
          bookPage: 22,
          focus: 'understanding prices, buying lunch',
        },
      },
      {
        file: 4,
        title: 'Meet the family / The perfect car',
        grammar: "possessive adjectives, possessive 's; adjectives",
        vocab: 'people and family; colours and common adjectives',
        pageStart: pdfPage(24, BEGINNER_PDF_OFFSET),
        bookPageStart: 24,
        summary:
          "Begin 4A with family photos/people and possessive adjectives + possessive 's. Then 4B describes cars/things with colours and common adjectives. Finish with Revise and Check 3&4.",
        lessons: [
          {
            code: '4A',
            title: 'Meet the family',
            bookPage: 24,
            grammar: "possessive adjectives, possessive 's",
            vocab: 'people and family',
            pronunciation: '/ʌ/, /æ/, and /ə/',
            startWith: 'Family vocabulary and possession.',
          },
          {
            code: '4B',
            title: 'The perfect car',
            bookPage: 26,
            grammar: 'adjectives',
            vocab: 'colours and common adjectives',
            pronunciation: '/ɑː/ and /ɔː/, linking',
            startWith: 'Describing things with adjective + noun order.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 3&4', bookPage: 28 },
      },
      {
        file: 5,
        title: 'A big breakfast? / A very long flight',
        grammar: 'present simple [+][-][?] I/you/we/they',
        vocab: 'food and drink; common verb phrases 1',
        pageStart: pdfPage(30, BEGINNER_PDF_OFFSET),
        bookPageStart: 30,
        summary:
          'Start 5A with food/drink and present simple affirmative/negative for I/you/we/they. Continue 5B with questions and common verb phrases. Add Practical English Episode 3: telling the time and how you feel.',
        lessons: [
          {
            code: '5A',
            title: 'A big breakfast?',
            bookPage: 30,
            grammar: 'present simple [+] and [-]: I, you, we, they',
            vocab: 'food and drink',
            pronunciation: '/dʒ/ and /g/',
            startWith: 'Food vocabulary then present simple statements.',
          },
          {
            code: '5B',
            title: 'A very long flight',
            bookPage: 32,
            grammar: 'present simple [?]: I, you, we, they',
            vocab: 'common verb phrases 1',
            pronunciation: '/w/ and /v/, sentence rhythm and linking',
            startWith: 'Yes/No and Wh- questions with present simple.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 3',
          bookPage: 34,
          focus: 'telling the time; saying how you feel',
        },
      },
      {
        file: 6,
        title: 'A school reunion / Good morning, goodnight',
        grammar: 'present simple: he/she/it; adverbs of frequency',
        vocab: 'jobs and places of work; a typical day',
        pageStart: pdfPage(36, BEGINNER_PDF_OFFSET),
        bookPageStart: 36,
        summary:
          'Open 6A with jobs/workplaces and present simple he/she/it (including -es). Then 6B daily routines with adverbs of frequency. End with Revise and Check 5&6.',
        lessons: [
          {
            code: '6A',
            title: 'A school reunion',
            bookPage: 36,
            grammar: 'present simple: he, she, it',
            vocab: 'jobs and places of work',
            pronunciation: 'third person -es, sentence rhythm',
            startWith: 'Jobs vocabulary and third-person present simple.',
          },
          {
            code: '6B',
            title: 'Good morning, goodnight',
            bookPage: 38,
            grammar: 'adverbs of frequency',
            vocab: 'a typical day',
            pronunciation: '/j/ and /juː/, sentence rhythm',
            startWith: 'Daily routine timeline + frequency adverbs.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 5&6', bookPage: 40 },
      },
      {
        file: 7,
        title: 'Have a nice weekend! / Lights, camera, action!',
        grammar: 'word order in questions; imperatives, object pronouns',
        vocab: 'free-time verb phrases; kinds of films',
        pageStart: pdfPage(42, BEGINNER_PDF_OFFSET),
        bookPageStart: 42,
        summary:
          'Begin 7A with free-time phrases and correct question word order (be + present simple). Move to 7B films with imperatives and object pronouns. Practical English Episode 4 covers dates and phone language.',
        lessons: [
          {
            code: '7A',
            title: 'Have a nice weekend!',
            bookPage: 42,
            grammar: 'word order in questions: be and present simple',
            vocab: 'common verb phrases 2: free time',
            pronunciation: '/w/, /h/, /eə/, and /aʊ/',
            startWith: 'Weekend activities and question formation.',
          },
          {
            code: '7B',
            title: 'Lights, camera, action!',
            bookPage: 44,
            grammar: 'imperatives, object pronouns: me, him, etc.',
            vocab: 'kinds of films',
            pronunciation: 'sentence rhythm',
            startWith: 'Film types, then instructions and object pronouns.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 4',
          bookPage: 46,
          focus: 'saying the date, talking on the phone; months, ordinal numbers',
        },
      },
      {
        file: 8,
        title: 'Can I park here? / I love cooking',
        grammar: "can / can't; like/love/hate + -ing",
        vocab: 'more verb phrases; activities',
        pageStart: pdfPage(48, BEGINNER_PDF_OFFSET),
        bookPageStart: 48,
        summary:
          "Start 8A with permission/ability using can/can't and verb phrases. Continue 8B with activities and like/love/hate + -ing. Close with Revise and Check 7&8.",
        lessons: [
          {
            code: '8A',
            title: 'Can I park here?',
            bookPage: 48,
            grammar: "can / can't",
            vocab: 'more verb phrases',
            pronunciation: "can / can't: /æ/, /ə/, and /k/; sentence rhythm",
            startWith: 'Permission and ability dialogues.',
          },
          {
            code: '8B',
            title: 'I love cooking',
            bookPage: 50,
            grammar: 'like / love / hate + verb + -ing',
            vocab: 'activities',
            pronunciation: '/ʊ/, /uː/, and /ŋ/; sentence rhythm',
            startWith: 'Talking about likes/dislikes of activities.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 7&8', bookPage: 52 },
      },
      {
        file: 9,
        title: "Everything's fine! / Working undercover",
        grammar: 'present continuous; present continuous vs present simple',
        vocab: 'travelling verb phrases; clothes',
        pageStart: pdfPage(54, BEGINNER_PDF_OFFSET),
        bookPageStart: 54,
        summary:
          'Open 9A with travelling phrases and present continuous for now. Then 9B contrasts present continuous vs present simple with clothes vocabulary. Practical English Episode 5: inviting and offering.',
        lessons: [
          {
            code: '9A',
            title: "Everything's fine!",
            bookPage: 54,
            grammar: 'present continuous',
            vocab: 'common verb phrases 2: travelling',
            pronunciation: 'sentence rhythm',
            startWith: 'What is happening now / travel situations.',
          },
          {
            code: '9B',
            title: 'Working undercover',
            bookPage: 56,
            grammar: 'present continuous or present simple?',
            vocab: 'clothes',
            pronunciation: '/ɜː/, other vowel sounds',
            startWith: 'Clothes + choosing the right present form.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 5',
          bookPage: 58,
          focus: 'inviting and offering',
        },
      },
      {
        file: 10,
        title: 'A room with a view / Where were you?',
        grammar: "there's a / there are some; past simple be",
        vocab: 'hotels, in/on/under; in/on/at',
        pageStart: pdfPage(60, BEGINNER_PDF_OFFSET),
        bookPageStart: 60,
        summary:
          "Begin 10A with hotel rooms using there's a… / there are some… and place prepositions. Move to 10B past simple be (was/were) with in/on/at. End with Revise and Check 9&10.",
        lessons: [
          {
            code: '10A',
            title: 'A room with a view',
            bookPage: 60,
            grammar: "there's a... / there are some...",
            vocab: 'hotels, in, on, under',
            pronunciation: '/ɪə/ and /eə/',
            startWith: 'Describe a hotel room from the start of the lesson.',
          },
          {
            code: '10B',
            title: 'Where were you?',
            bookPage: 62,
            grammar: 'past simple: be',
            vocab: 'in, on, at',
            pronunciation: 'was and were, sentence rhythm',
            startWith: 'Past locations with was/were.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 9&10', bookPage: 64 },
      },
      {
        file: 11,
        title: 'A new life in the USA / How was your day?',
        grammar: 'past simple regular; irregular get/go/have/do',
        vocab: 'regular verbs; verb phrases with get/go/have/do',
        pageStart: pdfPage(66, BEGINNER_PDF_OFFSET),
        bookPageStart: 66,
        summary:
          'Start 11A with regular past simple endings in a new-life story. Continue 11B with high-frequency irregulars get/go/have/do. Practical English Episode 6: directions.',
        lessons: [
          {
            code: '11A',
            title: 'A new life in the USA',
            bookPage: 66,
            grammar: 'past simple: regular verbs',
            vocab: 'regular verbs',
            pronunciation: 'regular past simple endings',
            startWith: 'Story of moving / starting a new life in the past.',
          },
          {
            code: '11B',
            title: 'How was your day?',
            bookPage: 68,
            grammar: 'past simple irregular verbs: get, go, have, do',
            vocab: 'verb phrases with get, go, have, do',
            pronunciation: 'sentence rhythm',
            startWith: 'Retell a day using key irregular verbs.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 6',
          bookPage: 70,
          focus: 'asking for and giving directions; prepositions of place',
        },
      },
      {
        file: 12,
        title: 'Strangers on a train / Revise the past',
        grammar: 'past simple regular + irregular; past simple revision',
        vocab: 'regular and irregular verbs; revision of past forms',
        pageStart: pdfPage(72, BEGINNER_PDF_OFFSET),
        bookPageStart: 72,
        summary:
          'Open 12A with a narrative (Strangers on a train) mixing regular and irregular past forms. Use 12B to revise the past thoroughly. Finish with Revise and Check 11&12.',
        lessons: [
          {
            code: '12A',
            title: 'Strangers on a train',
            bookPage: 72,
            grammar: 'past simple: regular and irregular verbs',
            vocab: 'regular and irregular verbs',
            pronunciation: 'irregular verbs',
            startWith: 'Read/listen to the story from the first lines and collect past forms.',
          },
          {
            code: '12B',
            title: 'Revise the past',
            bookPage: 74,
            grammar: 'past simple revision',
            vocab: 'revision of past verb forms',
            pronunciation: 'revision of vowel sounds',
            startWith: 'Systematic past revision tasks in the book order.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 11&12', bookPage: 76 },
      },
    ],
  },
  {
    id: 'intermediate',
    title: 'English File',
    subtitle: 'Intermediate',
    level: 'B1',
    cefr: 'Intermediate',
    color: '#0b1024',
    softColor: '#e8f0fa',
    pdf: '/books/english/english-file/intermediate-student-book.pdf',
    pageCount: 169,
    description:
      'English File Intermediate 4th edition (Christina Latham-Koenig) — 10 Files. Always start each File at lesson A, then B, then Practical English / Revise and Check.',
    files: [
      {
        file: 1,
        title: 'Eating in...and out / Modern families',
        grammar: 'present simple/continuous; future forms',
        vocab: 'food and cooking; family, personality adjectives',
        pageStart: pdfPage(6, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 6,
        summary:
          'Start on 1A food/cooking: quotes, food adjectives, food profile speaking, then present simple vs continuous (action/non-action). Continue 1B modern families with future forms (present continuous, going to, will). End with Practical English Episode 1: reacting to what people say.',
        lessons: [
          {
            code: '1A',
            title: 'Eating in...and out',
            bookPage: 6,
            grammar: 'present simple and continuous, action and non-action verbs',
            vocab: 'food and cooking',
            pronunciation: 'short and long vowel sounds',
            startWith: 'Food quotes + Your food profile questionnaire, then grammar contrast.',
          },
          {
            code: '1B',
            title: 'Modern families',
            bookPage: 10,
            grammar: 'future forms: present continuous, be going to, will / won\'t',
            vocab: 'family, adjectives of personality',
            pronunciation: 'sentence stress, word stress',
            startWith: 'Family/personality lexis, then choose the right future form.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 1',
          bookPage: 14,
          focus: 'reacting to what people say',
        },
      },
      {
        file: 2,
        title: 'Spending money / Changing lives',
        grammar: 'present perfect vs past simple; for/since + continuous',
        vocab: 'money; strong adjectives',
        pageStart: pdfPage(16, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 16,
        summary:
          'Begin 2A with money vocabulary and present perfect vs past simple. Move to 2B changing lives with present perfect + for/since and present perfect continuous, plus strong adjectives. Close with Revise and Check 1&2.',
        lessons: [
          {
            code: '2A',
            title: 'Spending money',
            bookPage: 16,
            grammar: 'present perfect and past simple',
            vocab: 'money',
            pronunciation: 'o and or',
            startWith: 'Money lexis, then experience vs finished past time.',
          },
          {
            code: '2B',
            title: 'Changing lives',
            bookPage: 20,
            grammar: 'present perfect + for / since, present perfect continuous',
            vocab: 'strong adjectives: exhausted, amazed, etc.',
            pronunciation: 'sentence stress',
            startWith: 'Life-change stories with duration forms.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 1&2', bookPage: 24 },
      },
      {
        file: 3,
        title: 'Survive the drive / Men, women, and children',
        grammar: 'comparatives/superlatives; articles',
        vocab: 'transport; verb/adjective + preposition collocations',
        pageStart: pdfPage(26, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 26,
        summary:
          'Start 3A transport topic with choosing comparatives vs superlatives. Continue 3B articles (a/an, the, no article) and collocations. Practical English Episode 2: giving opinions.',
        lessons: [
          {
            code: '3A',
            title: 'Survive the drive',
            bookPage: 26,
            grammar: 'choosing between comparatives and superlatives',
            vocab: 'transport',
            pronunciation: '/ʃ/, /dʒ/, and /tʃ/, linking',
            startWith: 'Transport discussion, then comparison forms.',
          },
          {
            code: '3B',
            title: 'Men, women, and children',
            bookPage: 30,
            grammar: 'articles: a / an, the, no article',
            vocab: 'collocation: verbs / adjectives + prepositions',
            pronunciation: '/ə/, two pronunciations of the',
            startWith: 'Article rules through the lesson sequence, then collocations.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 2',
          bookPage: 34,
          focus: 'giving opinions',
        },
      },
      {
        file: 4,
        title: 'Bad manners? / Yes, I can!',
        grammar: 'have to / must / should; can / could / be able to',
        vocab: 'phone language; -ed / -ing adjectives',
        pageStart: pdfPage(36, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 36,
        summary:
          'Open 4A with manners/phone language and obligation/prohibition (have to, must, should). Continue 4B ability/possibility (can, could, be able to) with -ed/-ing adjectives. End with Revise and Check 3&4.',
        lessons: [
          {
            code: '4A',
            title: 'Bad manners?',
            bookPage: 36,
            grammar: 'obligation and prohibition: have to, must, should',
            vocab: 'phone language',
            pronunciation: 'silent consonants',
            startWith: 'Phone manners discussion → modal obligation.',
          },
          {
            code: '4B',
            title: 'Yes, I can!',
            bookPage: 40,
            grammar: 'ability and possibility: can, could, be able to',
            vocab: '-ed / -ing adjectives',
            pronunciation: 'sentence stress',
            startWith: 'Ability anecdotes, then adjective endings.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 3&4', bookPage: 44 },
      },
      {
        file: 5,
        title: 'Sporting superstitions / #thewaywemet',
        grammar: 'past tenses; past and present habits/states',
        vocab: 'sport; relationships',
        pageStart: pdfPage(46, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 46,
        summary:
          'Start 5A sport superstitions using past simple/continuous/perfect together. Move to 5B relationships and used to / present habits. Practical English Episode 3: permission and requests.',
        lessons: [
          {
            code: '5A',
            title: 'Sporting superstitions',
            bookPage: 46,
            grammar: 'past tenses: simple, continuous, perfect',
            vocab: 'sport',
            pronunciation: '/ɔː/ and /ɜː/',
            startWith: 'Sport superstition stories from the opening tasks.',
          },
          {
            code: '5B',
            title: '#thewaywemet',
            bookPage: 50,
            grammar: 'past and present habits and states',
            vocab: 'relationships',
            pronunciation: 'the letter s, used to',
            startWith: 'How people met / relationship habits language.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 3',
          bookPage: 54,
          focus: 'permission and requests',
        },
      },
      {
        file: 6,
        title: 'Behind the scenes / Every picture tells a story',
        grammar: 'passive (all tenses); modals of deduction',
        vocab: 'cinema; the body',
        pageStart: pdfPage(56, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 56,
        summary:
          'Begin 6A cinema “behind the scenes” with passives across tenses. Continue 6B photo/body vocabulary with might/can’t/must deduction. Close with Revise and Check 5&6.',
        lessons: [
          {
            code: '6A',
            title: 'Behind the scenes',
            bookPage: 56,
            grammar: 'passive (all tenses)',
            vocab: 'cinema',
            pronunciation: 'regular and irregular past participles',
            startWith: 'Cinema production language → passive forms.',
          },
          {
            code: '6B',
            title: 'Every picture tells a story',
            bookPage: 60,
            grammar: "modals of deduction: might, can't, must",
            vocab: 'the body',
            pronunciation: 'diphthongs',
            startWith: 'Speculate about pictures using deduction modals.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 5&6', bookPage: 64 },
      },
      {
        file: 7,
        title: 'Live and learn / The hotel of Mum and Dad',
        grammar: 'first conditional + future time clauses; second conditional',
        vocab: 'education; houses',
        pageStart: pdfPage(66, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 66,
        summary:
          'Start 7A education with first conditional and future time clauses (when/until…). Continue 7B housing / living with parents using second conditional and choosing between conditionals. Practical English Episode 4: making suggestions.',
        lessons: [
          {
            code: '7A',
            title: 'Live and learn',
            bookPage: 66,
            grammar: 'first conditional and future time clauses + when, until, etc.',
            vocab: 'education',
            pronunciation: 'the letter u',
            startWith: 'Education discussion → real future conditions.',
          },
          {
            code: '7B',
            title: 'The hotel of Mum and Dad',
            bookPage: 70,
            grammar: 'second conditional, choosing between conditionals',
            vocab: 'houses',
            pronunciation: 'sentence stress, the letter c',
            startWith: 'Living-at-home situations → hypothetical conditionals.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 4',
          bookPage: 74,
          focus: 'making suggestions',
        },
      },
      {
        file: 8,
        title: 'The right job for you / Have a nice day!',
        grammar: 'gerunds vs infinitives; reported speech',
        vocab: 'work; shopping, nouns from verbs',
        pageStart: pdfPage(76, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 76,
        summary:
          'Open 8A careers with choosing gerunds vs infinitives and work vocabulary. Continue 8B shopping and reported speech (statements + questions). End with Revise and Check 7&8.',
        lessons: [
          {
            code: '8A',
            title: 'The right job for you',
            bookPage: 76,
            grammar: 'choosing between gerunds and infinitives',
            vocab: 'work',
            pronunciation: 'word stress',
            startWith: 'Job preferences questionnaire → verb patterns.',
          },
          {
            code: '8B',
            title: 'Have a nice day!',
            bookPage: 80,
            grammar: 'reported speech: sentences and questions',
            vocab: 'shopping, making nouns from verbs',
            pronunciation: 'the letters ai',
            startWith: 'Shopping service language → report what people said.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 7&8', bookPage: 84 },
      },
      {
        file: 9,
        title: 'Lucky encounters / Digital detox',
        grammar: 'third conditional; quantifiers',
        vocab: 'making adjectives and adverbs; electronic devices',
        pageStart: pdfPage(86, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 86,
        summary:
          'Start 9A lucky encounters with third conditional and adjective/adverb building. Move to 9B digital detox with quantifiers and device vocabulary. Practical English Episode 5: indirect questions.',
        lessons: [
          {
            code: '9A',
            title: 'Lucky encounters',
            bookPage: 86,
            grammar: 'third conditional',
            vocab: 'making adjectives and adverbs',
            pronunciation: 'sentence rhythm, weak pronunciation of have',
            startWith: 'Lucky/unlucky stories → if + past perfect outcomes.',
          },
          {
            code: '9B',
            title: 'Digital detox',
            bookPage: 90,
            grammar: 'quantifiers',
            vocab: 'electronic devices',
            pronunciation: 'linking, ough and augh',
            startWith: 'Screen-time discussion → quantifier practice.',
          },
        ],
        practicalEnglish: {
          title: 'Practical English Episode 5',
          bookPage: 94,
          focus: 'indirect questions',
        },
      },
      {
        file: 10,
        title: 'Idols and icons / And the murderer is...',
        grammar: 'defining/non-defining relative clauses; question tags',
        vocab: 'compound nouns; crime',
        pageStart: pdfPage(96, INTERMEDIATE_PDF_OFFSET),
        bookPageStart: 96,
        summary:
          'Begin 10A idols/icons with defining and non-defining relative clauses and compound nouns. Continue 10B crime mysteries with question tags and tag intonation. Finish with Revise and Check 9&10.',
        lessons: [
          {
            code: '10A',
            title: 'Idols and icons',
            bookPage: 96,
            grammar: 'relative clauses: defining and non-defining',
            vocab: 'compound nouns',
            pronunciation: 'word stress',
            startWith: 'Talk about famous people → add relative clause detail.',
          },
          {
            code: '10B',
            title: 'And the murderer is...',
            bookPage: 100,
            grammar: 'question tags',
            vocab: 'crime',
            pronunciation: 'intonation in question tags',
            startWith: 'Crime story / mystery tasks → tags for confirmation.',
          },
        ],
        reviseAndCheck: { title: 'Revise and Check 9&10', bookPage: 104 },
      },
    ],
  },
]

export function getEnglishFileCourse(courseId) {
  return ENGLISH_FILE_COURSES.find((c) => c.id === courseId) ?? null
}

export function getEnglishFileUnit(courseId, fileNumber) {
  const course = getEnglishFileCourse(courseId)
  if (!course) return null
  const num = Number(fileNumber)
  const unit = course.files.find((f) => f.file === num)
  if (!unit) return null
  const next = course.files.find((f) => f.file === num + 1)
  return {
    ...unit,
    course,
    pageEnd: next ? next.pageStart - 1 : course.pageCount,
  }
}

/** Build a 60-minute private-lesson flow that starts at the beginning of the File. */
export function getPrivateLessonFlow(unit) {
  const a = unit.lessons?.[0]
  const b = unit.lessons?.[1]
  const pe = unit.practicalEnglish
  const revise = unit.reviseAndCheck

  return [
    {
      step: 'Warm-up',
      minutes: 5,
      detail: a
        ? `Personalize the File theme before opening the book: ${a.title}.`
        : 'Quick personal warm-up linked to the File theme.',
    },
    {
      step: `Start ${a?.code || 'A'} from page ${a?.bookPage || unit.bookPageStart}`,
      minutes: 18,
      detail: a
        ? `${a.startWith} Cover G: ${a.grammar}. V: ${a.vocab}.`
        : 'Work through lesson A from the first exercise on the opening page.',
    },
    {
      step: `Continue ${b?.code || 'B'} from page ${b?.bookPage || ''}`,
      minutes: 18,
      detail: b
        ? `${b.startWith} Cover G: ${b.grammar}. V: ${b.vocab}.`
        : 'Move on to lesson B in book order.',
    },
    {
      step: pe ? pe.title : revise ? revise.title : 'Freer practice',
      minutes: 12,
      detail: pe
        ? `Do Practical English from book p.${pe.bookPage}: ${pe.focus}.`
        : revise
          ? `Use ${revise.title} (book p.${revise.bookPage}) to recycle Files language.`
          : 'Personalised speaking task using today’s grammar and vocabulary.',
    },
    {
      step: 'Wrap-up + homework',
      minutes: 7,
      detail:
        'Board the key forms from A/B. Assign the matching Workbook pages for this File, or unfinished SB exercises.',
    },
  ]
}

/** @deprecated Prefer getPrivateLessonFlow(unit) */
export const PRIVATE_LESSON_FLOW = [
  { step: 'Warm-up', minutes: 5, detail: 'Quick chat using language from the previous File.' },
  { step: 'Start lesson A', minutes: 18, detail: 'Open the File at lesson A and work from the first exercise.' },
  { step: 'Continue lesson B', minutes: 18, detail: 'Move to lesson B in book order.' },
  { step: 'Practical English / Check', minutes: 12, detail: 'Do Practical English or Revise and Check if this File includes it.' },
  { step: 'Wrap-up', minutes: 7, detail: 'Summarise grammar and assign homework.' },
]

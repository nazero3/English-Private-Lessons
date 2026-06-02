export const UNITS = {
  "9": [
    {
      unit: 1,
      theme: "Work Together to Make it Better",
      grammar: "Present simple and present progressive",
      arabic: "المضارع البسيط والمضارع المستمر",
      explanation:
        "Use present simple for habits (I study every day). Use present progressive for actions now (I am studying now).",
      visual: [
        ["Habit", "She walks to school every day."],
        ["Now", "She is walking to school now."],
      ],
      exercises: [
        { q: "He ____ (play) football every Friday.", a: "plays" },
        { q: "Look! They ____ (clean) the room now.", a: "are cleaning" },
        { q: "My mother ____ (cook) lunch every day.", a: "cooks" },
      ],
      quiz: [
        {
          q: "Which sentence is present progressive?",
          options: ["I read books.", "I am reading now.", "I read every day."],
          correct: 1,
        },
        {
          q: "Choose the present simple sentence:",
          options: ["He is running.", "He runs every morning.", "He is run."],
          correct: 1,
        },
        {
          q: "We ____ TV now.",
          options: ["watch", "are watching", "watches"],
          correct: 1,
        },
      ],
    },
    {
      unit: 2,
      theme: "Creativity and Initiatives",
      grammar: "Present perfect",
      arabic: "المضارع التام",
      explanation:
        "Use present perfect for life experience or recent actions with result: have/has + past participle.",
      visual: [
        ["Experience", "I have visited Damascus."],
        ["Result now", "She has finished her project."],
      ],
      exercises: [
        { q: "I ____ (finish) my homework.", a: "have finished" },
        { q: "He ____ (not see) this film.", a: "has not seen" },
        { q: "____ you ever ____ (try) sushi?", a: "have tried" },
      ],
      quiz: [
        {
          q: "Correct form:",
          options: ["She have done it.", "She has done it.", "She did has it."],
          correct: 1,
        },
        {
          q: "Present perfect structure:",
          options: ["have/has + V3", "is/am/are + V-ing", "did + V1"],
          correct: 0,
        },
        {
          q: "They ____ never ____ to Homs.",
          options: ["have / been", "has / been", "are / going"],
          correct: 0,
        },
      ],
    },
    {
      unit: 3,
      theme: "A More Comfortable Life",
      grammar: "Will / going to",
      arabic: "المستقبل بـ will و going to",
      explanation:
        "Use will for instant decisions and predictions. Use going to for planned intentions.",
      visual: [
        ["Decision now", "I will answer the phone."],
        ["Plan", "We are going to build a new house."],
      ],
      exercises: [
        { q: "It is cloudy. It ____ rain.", a: "is going to" },
        { q: "I think robots ____ help people.", a: "will" },
        { q: "She ____ visit her aunt tomorrow (planned).", a: "is going to" },
      ],
      quiz: [
        {
          q: "Planned action:",
          options: [
            "I will maybe go.",
            "I am going to study tonight.",
            "I go study.",
          ],
          correct: 1,
        },
        {
          q: "Instant decision:",
          options: [
            "I am going to answer it.",
            "I will answer it.",
            "I answering.",
          ],
          correct: 1,
        },
        {
          q: "They ____ travel next week (prediction).",
          options: ["will", "are going to", "both can work"],
          correct: 2,
        },
      ],
    },
    {
      unit: 4,
      theme: "Transport and Tourism",
      grammar: "Determiners",
      arabic: "أدوات التحديد",
      explanation:
        "Determiners come before nouns: a/an, the, some, any, much, many, few, little.",
      visual: [
        ["Countable", "many cars, a bus"],
        ["Uncountable", "much traffic, little time"],
      ],
      exercises: [
        { q: "There are ____ tourists in the city.", a: "many" },
        { q: "I need ____ information.", a: "some" },
        { q: "Do you have ____ money?", a: "any" },
      ],
      quiz: [
        {
          q: "Correct: ____ water",
          options: ["many", "much", "a"],
          correct: 1,
        },
        {
          q: "Correct: ____ apples",
          options: ["many", "much", "little"],
          correct: 0,
        },
        {
          q: "Use with singular countable noun:",
          options: ["a/an", "much", "few"],
          correct: 0,
        },
      ],
    },
    {
      unit: 5,
      theme: "Make Up Your Mind",
      grammar: "Past progressive",
      arabic: "الماضي المستمر",
      explanation:
        "Use was/were + V-ing for actions in progress at a specific time in the past.",
      visual: [
        ["Past in progress", "At 8 pm, I was studying."],
        ["Interrupted action", "I was sleeping when the phone rang."],
      ],
      exercises: [
        { q: "They ____ (watch) TV at 9 pm.", a: "were watching" },
        { q: "I ____ (do) homework when he arrived.", a: "was doing" },
        { q: "She ____ (not listen) to music.", a: "was not listening" },
      ],
      quiz: [
        {
          q: "Past progressive form:",
          options: ["was/were + V-ing", "have/has + V3", "did + V1"],
          correct: 0,
        },
        {
          q: "Correct sentence:",
          options: ["He were running.", "He was running.", "He running was."],
          correct: 1,
        },
        {
          q: "We ____ football when it started raining.",
          options: ["played", "were playing", "are playing"],
          correct: 1,
        },
      ],
    },
    {
      unit: 6,
      theme: "Exciting Challenge",
      grammar: "Imperatives",
      arabic: "صيغة الأمر",
      explanation:
        "Imperatives give instructions and advice. Base verb is used directly: Open the book. Don't shout.",
      visual: [
        ["Positive command", "Write your name."],
        ["Negative command", "Don't run in the hall."],
      ],
      exercises: [
        { q: "____ (be) careful on the road.", a: "be" },
        { q: "____ (not touch) that wire.", a: "do not touch" },
        { q: "____ (help) your team.", a: "help" },
      ],
      quiz: [
        {
          q: "Imperative sentence:",
          options: [
            "You are opening the door.",
            "Open the door.",
            "He opens the door.",
          ],
          correct: 1,
        },
        {
          q: "Negative imperative:",
          options: ["No speak.", "Don't speak.", "Not speak."],
          correct: 1,
        },
        {
          q: "Best for instructions:",
          options: ["Present perfect", "Imperatives", "Past perfect"],
          correct: 1,
        },
      ],
    },
    {
      unit: 7,
      theme: "Critical Moments",
      grammar: "Past perfect",
      arabic: "الماضي التام",
      explanation:
        "Use had + V3 for an action completed before another past action.",
      visual: [
        ["Earlier action", "The plane had left before we arrived."],
        ["Later past action", "We arrived at the airport."],
      ],
      exercises: [
        { q: "She ____ (finish) before class started.", a: "had finished" },
        { q: "They ____ (not eat) before the trip.", a: "had not eaten" },
        { q: "By 7, I ____ (complete) the task.", a: "had completed" },
      ],
      quiz: [
        {
          q: "Past perfect structure:",
          options: ["had + V3", "was + V-ing", "has + V3"],
          correct: 0,
        },
        {
          q: "Correct sentence:",
          options: [
            "He had went home.",
            "He had gone home.",
            "He has gone home yesterday.",
          ],
          correct: 1,
        },
        {
          q: "We were tired because we ____ all day.",
          options: ["had worked", "worked", "have worked"],
          correct: 0,
        },
      ],
    },
    {
      unit: 8,
      theme: "At Risk",
      grammar: "Wish sentences",
      arabic: "جمل التمني",
      explanation:
        "Use wish + past simple for present unreal situations. Use wish + could for ability/change.",
      visual: [
        ["Present wish", "I wish I had more time."],
        ["Ability wish", "I wish I could swim fast."],
      ],
      exercises: [
        { q: "I wish I ____ (be) taller.", a: "were" },
        { q: "She wishes she ____ (can) drive.", a: "could" },
        { q: "We wish we ____ (have) less homework.", a: "had" },
      ],
      quiz: [
        {
          q: "Correct wish sentence:",
          options: [
            "I wish I am rich.",
            "I wish I were rich.",
            "I wish I will be rich.",
          ],
          correct: 1,
        },
        {
          q: "Use with ability:",
          options: ["wish + could", "wish + will", "wish + has"],
          correct: 0,
        },
        {
          q: "He wishes he ____ speak English better.",
          options: ["could", "can", "is"],
          correct: 0,
        },
      ],
    },
    {
      unit: 9,
      theme: "Stay Positive",
      grammar: "Relative clauses",
      arabic: "جمل الوصل",
      explanation:
        "Use who/which/that to give extra information about a noun.",
      visual: [
        ["Person", "The student who studies wins."],
        ["Thing", "The book that I bought is useful."],
      ],
      exercises: [
        { q: "The girl ____ lives next door is kind.", a: "who" },
        { q: "This is the car ____ I want.", a: "that" },
        { q: "The school ____ we visited was new.", a: "that" },
      ],
      quiz: [
        {
          q: "Use for people:",
          options: ["which", "who", "where"],
          correct: 1,
        },
        {
          q: "Correct sentence:",
          options: [
            "The man which helped me.",
            "The man who helped me.",
            "The man where helped me.",
          ],
          correct: 1,
        },
        {
          q: "This is the phone ____ broke yesterday.",
          options: ["who", "that", "whose"],
          correct: 1,
        },
      ],
    },
    {
      unit: 10,
      theme: "Time Waits for No One",
      grammar: "Reported questions",
      arabic: "الأسئلة غير المباشرة",
      explanation:
        "Change direct questions into reported form and adjust word order and tense when needed.",
      visual: [
        ["Direct", "He asked, 'Where do you live?'"],
        ["Reported", "He asked where I lived."],
      ],
      exercises: [
        { q: "She asked me where I ____ (go).", a: "was going" },
        { q: "He asked if I ____ (like) coffee.", a: "liked" },
        { q: "They asked when the class ____ (start).", a: "started" },
      ],
      quiz: [
        {
          q: "Reported: 'Do you study?'",
          options: [
            "He asked if I studied.",
            "He asked if did I study.",
            "He asked I studied?",
          ],
          correct: 0,
        },
        {
          q: "Reported questions use:",
          options: ["question order", "statement order", "no order"],
          correct: 1,
        },
        {
          q: "She asked where I ____.",
          options: ["live", "lived", "am live"],
          correct: 1,
        },
      ],
    },
    {
      unit: 11,
      theme: "Ready to Contact?",
      grammar: "Passive voice",
      arabic: "المبني للمجهول",
      explanation:
        "Passive focuses on action/result: be + past participle. Example: Emails are sent quickly.",
      visual: [
        ["Active", "People send emails."],
        ["Passive", "Emails are sent."],
      ],
      exercises: [
        { q: "The message ____ (send) yesterday.", a: "was sent" },
        { q: "Phones ____ (use) everywhere.", a: "are used" },
        { q: "The homework ____ (check) by teacher.", a: "is checked" },
      ],
      quiz: [
        {
          q: "Passive structure:",
          options: ["be + V3", "have + V3", "was + V-ing"],
          correct: 0,
        },
        {
          q: "Active: They built a bridge.",
          options: [
            "A bridge built.",
            "A bridge was built.",
            "A bridge is builded.",
          ],
          correct: 1,
        },
        {
          q: "Arabic meaning of passive voice:",
          options: ["المعلوم", "المجهول", "المضارع"],
          correct: 1,
        },
      ],
    },
    {
      unit: 12,
      theme: "Silent, Yet Talking!",
      grammar: "Possessive and reflexive pronouns",
      arabic: "ضمائر الملكية والضمائر الانعكاسية",
      explanation:
        "Possessive pronouns show ownership (mine, yours). Reflexive pronouns refer back to subject (myself, herself).",
      visual: [
        ["Possessive", "This book is mine."],
        ["Reflexive", "She taught herself English."],
      ],
      exercises: [
        { q: "This pen is ____ (my).", a: "mine" },
        { q: "I fixed the bike by ____ (me).", a: "myself" },
        { q: "They did the project by ____ (them).", a: "themselves" },
      ],
      quiz: [
        {
          q: "Choose possessive pronoun:",
          options: ["myself", "mine", "me"],
          correct: 1,
        },
        {
          q: "Choose reflexive pronoun:",
          options: ["herself", "her", "hers"],
          correct: 0,
        },
        {
          q: "This laptop is ____.",
          options: ["my", "mine", "myself"],
          correct: 1,
        },
      ],
    },
  ],
  "12": [
    {
      unit: 1,
      theme: "Life Choices",
      grammar: "Revision of tenses 1",
      arabic: "مراجعة الأزمنة 1",
      explanation: "Review present and past tenses in career-related contexts.",
      visual: [
        ["Present", "I study medicine."],
        ["Past", "I studied hard last year."],
      ],
      exercises: [
        { q: "She ____ (choose) engineering last year.", a: "chose" },
        { q: "I ____ (prepare) for exams every day.", a: "prepare" },
        { q: "They ____ (work) on a project now.", a: "are working" },
      ],
      quiz: [
        {
          q: "Past form of choose:",
          options: ["choosed", "chose", "choosen"],
          correct: 1,
        },
        {
          q: "Present habit:",
          options: ["I am study", "I study daily", "I studied now"],
          correct: 1,
        },
        {
          q: "Now action:",
          options: ["is studying", "studies", "studied"],
          correct: 0,
        },
      ],
    },
    {
      unit: 2,
      theme: "Success",
      grammar: "Revision of tenses 2",
      arabic: "مراجعة الأزمنة 2",
      explanation:
        "Mix perfect and continuous forms for personal experience writing.",
      visual: [
        ["Present perfect", "I have achieved my goal."],
        ["Past continuous", "I was working late."],
      ],
      exercises: [
        { q: "I ____ (have) many challenges.", a: "have had" },
        { q: "She ____ (study) when I called.", a: "was studying" },
        { q: "They ____ (finish) the task already.", a: "have finished" },
      ],
      quiz: [
        {
          q: "Correct:",
          options: ["He have won.", "He has won.", "He is won."],
          correct: 1,
        },
        {
          q: "Interrupted past action:",
          options: ["was reading", "has read", "reads"],
          correct: 0,
        },
        {
          q: "Already usually with:",
          options: ["present perfect", "future perfect", "imperative"],
          correct: 0,
        },
      ],
    },
    {
      unit: 3,
      theme: "Medicine",
      grammar: "Passive voice",
      arabic: "المبني للمجهول",
      explanation: "Use passive in scientific and medical processes.",
      visual: [
        ["Active", "Doctors treat patients."],
        ["Passive", "Patients are treated."],
      ],
      exercises: [
        { q: "Vaccines ____ (develop) by scientists.", a: "are developed" },
        { q: "The patient ____ (examine) yesterday.", a: "was examined" },
        { q: "Medicine ____ (give) every morning.", a: "is given" },
      ],
      quiz: [
        {
          q: "Passive form:",
          options: ["be + V3", "do + V1", "have + V3"],
          correct: 0,
        },
        {
          q: "Past passive:",
          options: ["was treated", "is treated", "has treated"],
          correct: 0,
        },
        {
          q: "Scientific writing prefers:",
          options: ["passive", "imperatives", "slang"],
          correct: 0,
        },
      ],
    },
    {
      unit: 4,
      theme: "Engineering",
      grammar: "Causative",
      arabic: "التركيب السببي",
      explanation:
        "Use have/get something done when someone does a service for you.",
      visual: [
        ["Have", "I had my laptop repaired."],
        ["Get", "She got her phone fixed."],
      ],
      exercises: [
        { q: "I ____ my bike repaired.", a: "had" },
        { q: "He ____ his room painted.", a: "got" },
        { q: "We had the engineer ____ the system.", a: "check" },
      ],
      quiz: [
        {
          q: "Causative example:",
          options: [
            "I repaired my car.",
            "I had my car repaired.",
            "My car repaired.",
          ],
          correct: 1,
        },
        {
          q: "Common verbs in causative:",
          options: ["have/get", "be/do", "can/must"],
          correct: 0,
        },
        {
          q: "She got her glasses ____.",
          options: ["repair", "repaired", "repairs"],
          correct: 1,
        },
      ],
    },
    {
      unit: 5,
      theme: "Civil Rights",
      grammar: "Relative clauses",
      arabic: "جمل الوصل",
      explanation:
        "Use relative clauses to write precise arguments about rights and duties.",
      visual: [
        ["Defining", "Citizens who vote shape policy."],
        ["Non-defining", "The UN, which was founded in 1945, ..."],
      ],
      exercises: [
        { q: "People ____ respect law are responsible citizens.", a: "who" },
        { q: "The article ____ we read was useful.", a: "that" },
        { q: "The city, ____ is very old, attracts tourists.", a: "which" },
      ],
      quiz: [
        {
          q: "For things:",
          options: ["who", "which/that", "whose only"],
          correct: 1,
        },
        {
          q: "For people:",
          options: ["who", "which", "where"],
          correct: 0,
        },
        {
          q: "Clause adds info about noun?",
          options: ["Relative clause", "Imperative", "Modal"],
          correct: 0,
        },
      ],
    },
    {
      unit: 6,
      theme: "United Nations",
      grammar: "Future forms",
      arabic: "صيغ المستقبل",
      explanation:
        "Use will, going to, present continuous and present simple for future meaning.",
      visual: [
        ["Plan", "We are meeting tomorrow."],
        ["Prediction", "This policy will help students."],
      ],
      exercises: [
        { q: "The meeting ____ at 9 tomorrow (fixed).", a: "starts" },
        { q: "I think it ____ improve education.", a: "will" },
        {
          q: "We ____ visit the center next week (planned).",
          a: "are going to",
        },
      ],
      quiz: [
        {
          q: "Timetable future:",
          options: ["present simple", "past simple", "wish"],
          correct: 0,
        },
        { q: "Prediction:", options: ["will", "had", "did"], correct: 0 },
        {
          q: "Planned intention:",
          options: ["going to", "was", "has"],
          correct: 0,
        },
      ],
    },
    {
      unit: 7,
      theme: "Microorganism",
      grammar: "Conditionals II and III",
      arabic: "الشرط الثاني والثالث",
      explanation:
        "Type II for unreal present/future; Type III for unreal past.",
      visual: [
        ["Type II", "If I were a scientist, I would research viruses."],
        [
          "Type III",
          "If we had acted earlier, we would have saved time.",
        ],
      ],
      exercises: [
        { q: "If I ____ (be) rich, I would fund labs.", a: "were" },
        { q: "If she had studied, she ____ (pass).", a: "would have passed" },
        { q: "If they ____ (know), they would help.", a: "knew" },
      ],
      quiz: [
        {
          q: "Type III pattern:",
          options: ["if + past perfect", "if + present simple", "if + infinitive"],
          correct: 0,
        },
        {
          q: "Type II uses:",
          options: ["real facts", "unreal present/future", "commands"],
          correct: 1,
        },
        {
          q: "If he had left early, he ____ the bus.",
          options: ["would catch", "would have caught", "catches"],
          correct: 1,
        },
      ],
    },
    {
      unit: 8,
      theme: "Facts about Human Body",
      grammar: "Expressing wishes",
      arabic: "التمني",
      explanation:
        "Use wish to express unreal desires in present/past contexts.",
      visual: [
        ["Present wish", "I wish I were healthier."],
        ["Past regret", "I wish I had slept earlier."],
      ],
      exercises: [
        { q: "I wish I ____ (have) more energy.", a: "had" },
        { q: "She wishes she ____ (study) medicine.", a: "had studied" },
        { q: "We wish we ____ (can) exercise daily.", a: "could" },
      ],
      quiz: [
        {
          q: "Present unreal wish:",
          options: ["wish + past simple", "wish + present simple", "wish + will"],
          correct: 0,
        },
        {
          q: "Past regret:",
          options: ["wish + had + V3", "wish + V1", "wish + am"],
          correct: 0,
        },
        {
          q: "He wishes he ____ drive.",
          options: ["could", "can", "is"],
          correct: 0,
        },
      ],
    },
    {
      unit: 9,
      theme: "Citizenship",
      grammar: "Paired conjunctions",
      arabic: "الروابط الثنائية",
      explanation:
        "Use both...and, not only...but also, either...or, neither...nor.",
      visual: [
        ["Balance", "Both rights and duties matter."],
        ["Emphasis", "Not only citizens but also schools must act."],
      ],
      exercises: [
        { q: "____ students ____ teachers should cooperate.", a: "both and" },
        { q: "____ Ali ____ Omar won the prize.", a: "either or" },
        { q: "He is ____ polite ____ helpful.", a: "not only but also" },
      ],
      quiz: [
        {
          q: "Negative pair:",
          options: ["both...and", "neither...nor", "either...or"],
          correct: 1,
        },
        {
          q: "Choice pair:",
          options: ["either...or", "not only...but also", "both...and"],
          correct: 0,
        },
        {
          q: "Add emphasis:",
          options: ["not only...but also", "if...then", "because"],
          correct: 0,
        },
      ],
    },
    {
      unit: 10,
      theme: "Culture Shock",
      grammar: "Modals",
      arabic: "الأفعال الناقصة",
      explanation:
        "Use modals for advice, obligation, permission, and possibility.",
      visual: [
        ["Advice", "You should respect local customs."],
        ["Obligation", "Visitors must follow rules."],
      ],
      exercises: [
        { q: "You ____ be polite in formal emails.", a: "should" },
        { q: "Students ____ submit work on time.", a: "must" },
        { q: "____ I ask a question?", a: "may" },
      ],
      quiz: [
        {
          q: "Strong obligation:",
          options: ["must", "might", "could"],
          correct: 0,
        },
        {
          q: "Polite permission:",
          options: ["may", "must", "should"],
          correct: 0,
        },
        {
          q: "Might expresses:",
          options: ["certainty", "possibility", "past regret"],
          correct: 1,
        },
      ],
    },
    {
      unit: 11,
      theme: "Artificial Intelligence",
      grammar: "Reported speech",
      arabic: "الكلام غير المباشر",
      explanation:
        "Report what others say with tense backshift when needed.",
      visual: [
        ["Direct", "She said, 'AI helps doctors.'"],
        ["Reported", "She said that AI helped doctors."],
      ],
      exercises: [
        { q: "He said he ____ (be) tired.", a: "was" },
        { q: "They said AI ____ (change) education.", a: "would change" },
        { q: "She said she ____ (have) a new idea.", a: "had" },
      ],
      quiz: [
        {
          q: "Reported speech often uses:",
          options: ["that-clause", "imperative only", "question marks"],
          correct: 0,
        },
        {
          q: "Direct: 'I am happy.' => He said he ____ happy.",
          options: ["is", "was", "be"],
          correct: 1,
        },
        {
          q: "Backshift from will:",
          options: ["would", "shall", "can"],
          correct: 0,
        },
      ],
    },
    {
      unit: 12,
      theme: "Digital Literacy",
      grammar: "Inversion",
      arabic: "القلب في الترتيب",
      explanation:
        "Use inversion for formal emphasis: Never have I seen..., Not only did he..., Rarely do we...",
      visual: [
        ["Normal", "I have never seen such speed."],
        ["Inversion", "Never have I seen such speed."],
      ],
      exercises: [
        { q: "Never ____ I seen such a result.", a: "have" },
        { q: "Rarely ____ students use this method.", a: "do" },
        { q: "Not only ____ he study, but he also worked.", a: "did" },
      ],
      quiz: [
        {
          q: "Inversion is common in:",
          options: ["formal emphasis", "basic greetings", "commands"],
          correct: 0,
        },
        {
          q: "Correct inversion:",
          options: ["Never I have seen", "Never have I seen", "Never seen I have"],
          correct: 1,
        },
        {
          q: "Rarely ____ we find such data.",
          options: ["do", "does", "did"],
          correct: 0,
        },
      ],
    },
  ],
}

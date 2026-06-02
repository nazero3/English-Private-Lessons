import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { UNITS } from './data/units'

const STORAGE_KEYS = {
  progress: 'englishTutorProgress',
  customUnits: 'englishTutorCustomUnits',
  overrides: 'englishTutorUnitOverrides',
}

const defaultExercise = [{ q: 'Write one sentence using this grammar.', a: '' }]
const defaultQuiz = [
  {
    q: 'Choose the best answer based on the lesson.',
    options: ['Option A', 'Option B', 'Option C'],
    correct: 0,
  },
]

function App() {
  const [grade, setGrade] = useState('9')
  const [unitIndex, setUnitIndex] = useState(0)
  const [studentName, setStudentName] = useState('')
  const [exerciseAnswers, setExerciseAnswers] = useState({})
  const [quizAnswers, setQuizAnswers] = useState({})
  const [exerciseScore, setExerciseScore] = useState(null)
  const [quizScore, setQuizScore] = useState(null)
  const [progressStore, setProgressStore] = useState({})
  const [progressMessage, setProgressMessage] = useState('')
  const [teacherMode, setTeacherMode] = useState(false)
  const [customUnits, setCustomUnits] = useState({ '9': [], '12': [] })
  const [unitOverrides, setUnitOverrides] = useState({})
  const [teacherForm, setTeacherForm] = useState({
    theme: '',
    grammar: '',
    arabic: '',
    explanation: '',
    visualText: '',
    exercisesText: '',
    quizText: '',
  })
  const [newUnitForm, setNewUnitForm] = useState({
    unit: '',
    theme: '',
    grammar: '',
    arabic: '',
    explanation: '',
  })

  useEffect(() => {
    try {
      const progress = localStorage.getItem(STORAGE_KEYS.progress)
      const extras = localStorage.getItem(STORAGE_KEYS.customUnits)
      const overrides = localStorage.getItem(STORAGE_KEYS.overrides)
      if (progress) setProgressStore(JSON.parse(progress))
      if (extras) setCustomUnits(JSON.parse(extras))
      if (overrides) setUnitOverrides(JSON.parse(overrides))
    } catch {
      // Keep defaults if localStorage parsing fails.
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progressStore))
  }, [progressStore])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.customUnits, JSON.stringify(customUnits))
  }, [customUnits])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.overrides, JSON.stringify(unitOverrides))
  }, [unitOverrides])

  const units = useMemo(() => {
    const base = UNITS[grade].map((item) => {
      const override = unitOverrides[`${grade}-${item.unit}`] || {}
      return { ...item, ...override, sourceType: 'base', sourceId: `${grade}-${item.unit}` }
    })
    const extras = (customUnits[grade] || []).map((item) => ({
      ...item,
      sourceType: 'custom',
      sourceId: item.id,
    }))
    return [...base, ...extras].sort((a, b) => Number(a.unit) - Number(b.unit))
  }, [grade, customUnits, unitOverrides])

  useEffect(() => {
    if (unitIndex >= units.length) {
      setUnitIndex(0)
    }
  }, [units, unitIndex])

  const unit = units[unitIndex]

  const quizPercent = useMemo(() => {
    if (quizScore === null) return null
    return Math.round((quizScore / unit.quiz.length) * 100)
  }, [quizScore, unit.quiz.length])

  const normalize = (value) => value.toLowerCase().trim().replace(/\s+/g, ' ')
  const currentStudent = studentName.trim() || 'Guest Student'
  const progressKey = `${currentStudent}|${grade}|${unit.unit}`

  useEffect(() => {
    if (!unit) return
    setExerciseAnswers({})
    setQuizAnswers({})
    const saved = progressStore[progressKey]
    setExerciseScore(saved?.exerciseScore ?? null)
    setQuizScore(saved?.quizScore ?? null)
    setProgressMessage('')
  }, [progressKey, progressStore, unit])

  useEffect(() => {
    if (!unit) return
    setTeacherForm({
      theme: unit.theme,
      grammar: unit.grammar,
      arabic: unit.arabic || '',
      explanation: unit.explanation || '',
      visualText: JSON.stringify(unit.visual || [], null, 2),
      exercisesText: JSON.stringify(unit.exercises || [], null, 2),
      quizText: JSON.stringify(unit.quiz || [], null, 2),
    })
  }, [unit])

  const onChangeGrade = (event) => {
    setGrade(event.target.value)
    setUnitIndex(0)
  }

  const onChangeUnit = (index) => {
    setUnitIndex(index)
  }

  const saveProgress = (nextExerciseScore = exerciseScore, nextQuizScore = quizScore) => {
    setProgressStore((prev) => ({
      ...prev,
      [progressKey]: {
        student: currentStudent,
        grade,
        unit: unit.unit,
        exerciseScore: nextExerciseScore,
        quizScore: nextQuizScore,
        quizPercent:
          nextQuizScore === null
            ? null
            : Math.round((nextQuizScore / unit.quiz.length) * 100),
        updatedAt: new Date().toISOString(),
      },
    }))
    setProgressMessage(`Progress saved for ${currentStudent}.`)
  }

  const checkExercises = () => {
    let score = 0
    unit.exercises.forEach((exercise, index) => {
      const value = normalize(exerciseAnswers[index] || '')
      if (value === normalize(exercise.a)) score += 1
    })
    setExerciseScore(score)
    saveProgress(score, quizScore)
  }

  const checkQuiz = () => {
    let score = 0
    unit.quiz.forEach((question, index) => {
      if (Number(quizAnswers[index]) === question.correct) score += 1
    })
    setQuizScore(score)
    saveProgress(exerciseScore, score)
  }

  const parseJsonField = (raw, fallback) => {
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return fallback
      return parsed
    } catch {
      return fallback
    }
  }

  const saveUnitEdits = () => {
    const payload = {
      theme: teacherForm.theme,
      grammar: teacherForm.grammar,
      arabic: teacherForm.arabic,
      explanation: teacherForm.explanation,
      visual: parseJsonField(teacherForm.visualText, unit.visual),
      exercises: parseJsonField(teacherForm.exercisesText, unit.exercises),
      quiz: parseJsonField(teacherForm.quizText, unit.quiz),
    }

    if (unit.sourceType === 'base') {
      setUnitOverrides((prev) => ({ ...prev, [`${grade}-${unit.unit}`]: payload }))
      setProgressMessage('Base unit override saved.')
      return
    }

    setCustomUnits((prev) => ({
      ...prev,
      [grade]: (prev[grade] || []).map((item) =>
        item.id === unit.sourceId ? { ...item, ...payload } : item,
      ),
    }))
    setProgressMessage('Custom unit updated.')
  }

  const addCustomUnit = () => {
    const numericUnit = Number(newUnitForm.unit || unit.unit + 1)
    if (!newUnitForm.theme || !newUnitForm.grammar) {
      setProgressMessage('Theme and grammar are required for new custom units.')
      return
    }

    const custom = {
      id: `custom-${Date.now()}`,
      unit: Number.isNaN(numericUnit) ? unit.unit + 1 : numericUnit,
      theme: newUnitForm.theme,
      grammar: newUnitForm.grammar,
      arabic: newUnitForm.arabic,
      explanation: newUnitForm.explanation || 'Custom unit added by teacher.',
      visual: [['Teacher note', 'Add visual examples here.']],
      exercises: defaultExercise,
      quiz: defaultQuiz,
    }

    setCustomUnits((prev) => ({
      ...prev,
      [grade]: [...(prev[grade] || []), custom],
    }))
    setNewUnitForm({ unit: '', theme: '', grammar: '', arabic: '', explanation: '' })
    setProgressMessage('Custom unit added.')
  }

  const printLessonSheet = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `
      <html>
        <head>
          <title>Printable Lesson Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
            h1,h2,h3,p { margin: 0 0 10px; }
            .box { border:1px solid #222; padding:10px; margin-bottom:10px; }
            table { width:100%; border-collapse: collapse; margin-top:8px; }
            th,td { border:1px solid #222; padding:6px; text-align:left; vertical-align:top; }
          </style>
        </head>
        <body>
          <h1>Private English Lesson Sheet</h1>
          <div class="box">
            <p><strong>Student:</strong> ${currentStudent}</p>
            <p><strong>Grade:</strong> ${grade}</p>
            <p><strong>Unit:</strong> ${unit.unit} - ${unit.theme}</p>
            <p><strong>Grammar:</strong> ${unit.grammar}</p>
            <p><strong>Arabic:</strong> ${unit.arabic}</p>
            <p><strong>Current exercise score:</strong> ${exerciseScore ?? '-'}</p>
            <p><strong>Current quiz score:</strong> ${quizScore ?? '-'}</p>
          </div>
          <h2>Visual Explanation</h2>
          <div class="box">
            ${unit.visual
              .map((item) => `<p><strong>${item[0]}:</strong> ${item[1]}</p>`)
              .join('')}
            <p>${unit.explanation}</p>
          </div>
          <h2>Exercises</h2>
          <table>
            <tr><th>#</th><th>Question</th></tr>
            ${unit.exercises
              .map((item, index) => `<tr><td>${index + 1}</td><td>${item.q}</td></tr>`)
              .join('')}
          </table>
          <h2>Quiz</h2>
          <table>
            <tr><th>#</th><th>Question</th><th>Options</th></tr>
            ${unit.quiz
              .map(
                (item, index) =>
                  `<tr><td>${index + 1}</td><td>${item.q}</td><td>${item.options.join(' / ')}</td></tr>`,
              )
              .join('')}
          </table>
          <script>window.print()</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>English Tutor App</h1>
        <p>Visual lessons, practice, and quizzes for Grades 9 and 12</p>
      </header>

      <main className="layout">
        <aside className="sidebar card">
          <label htmlFor="studentName">Student Name</label>
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="Type student name"
          />

          <label htmlFor="gradeSelect">Choose Grade</label>
          <select id="gradeSelect" value={grade} onChange={onChangeGrade}>
            <option value="9">Grade 9</option>
            <option value="12">Grade 12</option>
          </select>

          <button
            type="button"
            className={`btn ${teacherMode ? 'btn-secondary' : ''}`}
            onClick={() => setTeacherMode((prev) => !prev)}
          >
            {teacherMode ? 'Teacher Mode: ON' : 'Teacher Mode: OFF'}
          </button>

          <h2>Units</h2>
          <div className="unit-list">
            {units.map((item, index) => (
              <button
                key={item.unit}
                className={`unit-btn ${index === unitIndex ? 'active' : ''}`}
                onClick={() => onChangeUnit(index)}
                type="button"
              >
                Unit {item.unit}: {item.theme}
              </button>
            ))}
          </div>
        </aside>

        <section className="content">
          <article className="card">
            <h2>
              Grade {grade} - Unit {unit.unit}
            </h2>
            <p className="theme">{unit.theme}</p>
            <p>
              <strong>Grammar focus:</strong> {unit.grammar}
            </p>
            <p>
              <strong>Arabic support:</strong> {unit.arabic}
            </p>
            <div className="action-row">
              <button className="btn" onClick={() => saveProgress()} type="button">
                Save Progress
              </button>
              <button className="btn btn-secondary" onClick={printLessonSheet} type="button">
                Printable Lesson Sheet
              </button>
            </div>
            {progressMessage && <p className="feedback ok">{progressMessage}</p>}
          </article>

          <article className="card">
            <h3>Visual Explanation</h3>
            <div className="visual-row">
              {unit.visual.map(([title, sentence]) => (
                <div className="visual-box" key={title}>
                  <strong>{title}</strong>
                  <p>{sentence}</p>
                </div>
              ))}
            </div>
            <p className="description">{unit.explanation}</p>
          </article>

          <article className="card">
            <h3>Practice Exercises</h3>
            {unit.exercises.map((exercise, index) => (
              <div className="exercise-item" key={exercise.q}>
                <p>
                  <strong>{index + 1}.</strong> {exercise.q}
                </p>
                <input
                  type="text"
                  value={exerciseAnswers[index] || ''}
                  onChange={(event) =>
                    setExerciseAnswers((prev) => ({
                      ...prev,
                      [index]: event.target.value,
                    }))
                  }
                  placeholder="Type your answer"
                />
              </div>
            ))}
            <button className="btn" onClick={checkExercises} type="button">
              Check Exercises
            </button>
            {exerciseScore !== null && (
              <p className={`feedback ${exerciseScore >= 2 ? 'ok' : 'bad'}`}>
                Exercise score: {exerciseScore}/{unit.exercises.length}
              </p>
            )}
          </article>

          <article className="card">
            <h3>End of Lesson Quiz</h3>
            {unit.quiz.map((question, qIndex) => (
              <div className="quiz-item" key={question.q}>
                <p>
                  <strong>{qIndex + 1}.</strong> {question.q}
                </p>
                {question.options.map((option, optionIndex) => (
                  <label className="quiz-option" key={`${question.q}-${option}`}>
                    <input
                      type="radio"
                      name={`quiz-${qIndex}`}
                      value={optionIndex}
                      checked={Number(quizAnswers[qIndex]) === optionIndex}
                      onChange={(event) =>
                        setQuizAnswers((prev) => ({
                          ...prev,
                          [qIndex]: event.target.value,
                        }))
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            ))}
            <button className="btn" onClick={checkQuiz} type="button">
              Submit Quiz
            </button>
            {quizScore !== null && (
              <p className={`feedback ${quizPercent >= 70 ? 'ok' : 'bad'}`}>
                Quiz result: {quizScore}/{unit.quiz.length} ({quizPercent}%)
              </p>
            )}
          </article>

          {teacherMode && (
            <>
              <article className="card">
                <h3>Teacher Mode: Edit Current Unit</h3>
                <div className="form-grid">
                  <label>
                    Theme
                    <input
                      value={teacherForm.theme}
                      onChange={(event) =>
                        setTeacherForm((prev) => ({ ...prev, theme: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Grammar
                    <input
                      value={teacherForm.grammar}
                      onChange={(event) =>
                        setTeacherForm((prev) => ({ ...prev, grammar: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Arabic
                    <input
                      value={teacherForm.arabic}
                      onChange={(event) =>
                        setTeacherForm((prev) => ({ ...prev, arabic: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label>
                  Explanation
                  <textarea
                    value={teacherForm.explanation}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, explanation: event.target.value }))
                    }
                  />
                </label>
                <p className="hint">JSON arrays for advanced editing:</p>
                <label>
                  Visual pairs JSON (e.g. [["Title","Sentence"]])
                  <textarea
                    value={teacherForm.visualText}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, visualText: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Exercises JSON (e.g. [{"{"}"q":"...","a":"..."{"}"}])
                  <textarea
                    value={teacherForm.exercisesText}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, exercisesText: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Quiz JSON (e.g. [{"{"}"q":"...","options":["a","b"],"correct":0{"}"}])
                  <textarea
                    value={teacherForm.quizText}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, quizText: event.target.value }))
                    }
                  />
                </label>
                <button className="btn" onClick={saveUnitEdits} type="button">
                  Save Unit Edits
                </button>
              </article>

              <article className="card">
                <h3>Teacher Mode: Add Custom Unit</h3>
                <div className="form-grid">
                  <label>
                    Unit Number
                    <input
                      value={newUnitForm.unit}
                      onChange={(event) =>
                        setNewUnitForm((prev) => ({ ...prev, unit: event.target.value }))
                      }
                      placeholder="13"
                    />
                  </label>
                  <label>
                    Theme
                    <input
                      value={newUnitForm.theme}
                      onChange={(event) =>
                        setNewUnitForm((prev) => ({ ...prev, theme: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Grammar
                    <input
                      value={newUnitForm.grammar}
                      onChange={(event) =>
                        setNewUnitForm((prev) => ({ ...prev, grammar: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Arabic
                    <input
                      value={newUnitForm.arabic}
                      onChange={(event) =>
                        setNewUnitForm((prev) => ({ ...prev, arabic: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label>
                  Explanation
                  <textarea
                    value={newUnitForm.explanation}
                    onChange={(event) =>
                      setNewUnitForm((prev) => ({ ...prev, explanation: event.target.value }))
                    }
                  />
                </label>
                <button className="btn" onClick={addCustomUnit} type="button">
                  Add Custom Unit
                </button>
              </article>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

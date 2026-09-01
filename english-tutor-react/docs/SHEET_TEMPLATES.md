# Sheet templates — content outline (P0)
# Used by UI components under src/components/sheets/

## 1. Teacher Lesson Brief (`TeacherBrief`)
Header: Course | Unit N | Theme | Student (optional) | Date
Sections:
- Learning objectives (bullets)
- Grammar focus + Arabic label
- Explanation (short)
- Visual contrast table
- Session flow (timed steps, 45–60 min)
- Common L1 mistakes + tips
- Teacher notes
- Answer keys: worksheet + homework (teacher-only)

## 2. In-lesson Worksheet (`Worksheet`)
Header: Student name line | Unit | Theme | Date
Body:
- Warm-up prompt (1 line)
- Controlled fill items (from worksheet[])
- Production write task with lined space
Footer: no answers

## 3. Checkpoint Quiz — every 3 units (`ReviewQuiz`)
Only on units **3, 6, 9, 12**.
Header: Units in block (e.g. 4–6) | Student | Date
Body: ~10–12 items from that block’s quiz banks only
Mix MCQ + fill-in
Footer: no answers on student print; score via grade RPC in check mode

Units 1–2, 4–5, 7–8, 10–11: no quiz card in the lesson pack.

## 4. Homework (`Homework`)
Header: Due next session | Unit | Theme
Body: homework[] items + reflection/write
Footer: teacher signature line; no answers on student copy

## 5. Coursebook packs (Private English + Math Grade 9)
Same three sheet types as units 1–4 above, built from coursebook File/unit metadata:

- Private English File: `/teacher/private-lessons/:courseId/file/:n/{brief|worksheet|homework}`
  Print: `/print/private/:courseId/:n/:kind`
- Math Grade 9 unit: `/teacher/math-grade9/:courseId/unit/:n/{brief|worksheet|homework}`
  Print: `/print/math/:courseId/:n/:kind` (RTL Arabic chrome)

Content builders: `src/lib/coursebookSheets.js` + exercise banks in `src/data/privateEnglishExercises.js` and `src/data/mathGrade9Exercises.js`.
No checkpoint quiz on coursebook packs (book Revise & Check / unit exercises cover that).

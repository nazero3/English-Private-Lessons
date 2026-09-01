import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { AppLayout, RequireAuth, RequireCoursebookAccess, RequirePrivateLessons } from './components/AppLayout'
import PwaChrome from './components/PwaChrome'
import { AuthProvider, useAuth } from './lib/AuthContext'
import CheckModePage from './pages/CheckModePage'
import LessonPackPage from './pages/LessonPackPage'
import LoginPage from './pages/LoginPage'
import ManagerCoursePage from './pages/ManagerCoursePage'
import ManagerHome from './pages/ManagerHome'
import MathCoursePage from './pages/MathCoursePage'
import MathGradeHubPage from './pages/MathGradeHubPage'
import MathUnitPage from './pages/MathUnitPage'
import CoursebookPrintPage from './pages/CoursebookPrintPage'
import {
  MathBriefPage,
  MathHomeworkPage,
  MathWorksheetPage,
  PrivateBriefPage,
  PrivateHomeworkPage,
  PrivateWorksheetPage,
} from './pages/CoursebookSheetPages'
import PrintPage from './pages/PrintPage'
import SessionsPage from './pages/SessionsPage'
import HoursPage from './pages/HoursPage'
import KinzMount from './kinz/KinzMount'
import {
  BriefPage,
  HomeworkPage,
  ReviewQuizPage,
  WorksheetPage,
} from './pages/SheetPages'
import PrivateLessonCoursePage from './pages/PrivateLessonCoursePage'
import PrivateLessonFilePage from './pages/PrivateLessonFilePage'
import PrivateLessonsPage from './pages/PrivateLessonsPage'
import TeacherCoursePage from './pages/TeacherCoursePage'
import TeacherHome from './pages/TeacherHome'
import StudentHome from './pages/StudentHome'
import StudentsPage from './pages/StudentsPage'
import StudentProfilePage from './pages/StudentProfilePage'
import ParentsPage from './pages/ParentsPage'
import { homePath } from './lib/permissions'
import './styles/app.css'

function HomeRedirect() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={homePath(profile.role)} replace />
}

function LegacyMathGrade9Redirect() {
  const { courseId, unitNumber } = useParams()
  const [search] = useSearchParams()
  const q = search.toString() ? `?${search.toString()}` : ''
  if (courseId && unitNumber) {
    return <Navigate to={`/teacher/math/grade9/${courseId}/unit/${unitNumber}${q}`} replace />
  }
  if (courseId) {
    return <Navigate to={`/teacher/math/grade9/${courseId}${q}`} replace />
  }
  return <Navigate to="/teacher/math/grade9" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PwaChrome />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/print/lessons/:lessonId/:kind" element={<PrintPage />} />
            <Route
              path="/print/private/:courseId/:fileNumber/:kind"
              element={<CoursebookPrintPage source="private" />}
            />
            <Route
              path="/print/math/:courseId/:unitNumber/:kind"
              element={<CoursebookPrintPage source="math" />}
            />
            <Route
              path="/print/physics/:courseId/:unitNumber/:kind"
              element={<CoursebookPrintPage source="physics" />}
            />

            <Route element={<RequireAuth role="operations" />}>
              <Route path="/operations/families/*" element={<KinzMount />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeRedirect />} />

              <Route element={<RequireAuth role="manager" />}>
                <Route path="/manager" element={<ManagerHome />} />
                <Route path="/manager/courses/:courseId" element={<ManagerCoursePage />} />
                <Route path="/manager/sessions" element={<SessionsPage />} />
                <Route path="/manager/hours" element={<HoursPage />} />
                <Route path="/manager/students" element={<StudentsPage />} />
                <Route path="/manager/students/:studentId" element={<StudentProfilePage />} />
                <Route path="/manager/parents" element={<ParentsPage />} />
              </Route>

              <Route element={<RequireAuth role="operations" />}>
                <Route path="/operations" element={<HoursPage />} />
                <Route path="/operations/sessions" element={<SessionsPage />} />
              </Route>

              <Route element={<RequireAuth role="student" />}>
                <Route path="/student" element={<StudentHome />} />
              </Route>

              <Route element={<RequireAuth roles={['teacher', 'manager']} />}>
                <Route path="/teacher" element={<TeacherHome />} />
                <Route path="/teacher/courses/:courseId" element={<TeacherCoursePage />} />
                <Route element={<RequirePrivateLessons />}>
                  <Route path="/teacher/private-lessons" element={<PrivateLessonsPage />} />
                  <Route path="/teacher/private-lessons/:courseId" element={<PrivateLessonCoursePage />} />
                  <Route
                    path="/teacher/private-lessons/:courseId/file/:fileNumber"
                    element={<PrivateLessonFilePage />}
                  />
                  <Route
                    path="/teacher/private-lessons/:courseId/file/:fileNumber/brief"
                    element={<PrivateBriefPage />}
                  />
                  <Route
                    path="/teacher/private-lessons/:courseId/file/:fileNumber/worksheet"
                    element={<PrivateWorksheetPage />}
                  />
                  <Route
                    path="/teacher/private-lessons/:courseId/file/:fileNumber/homework"
                    element={<PrivateHomeworkPage />}
                  />
                </Route>

                <Route element={<RequireCoursebookAccess />}>
                  <Route path="/teacher/math/:gradeKey" element={<MathGradeHubPage />} />
                  <Route path="/teacher/math/:gradeKey/:courseId" element={<MathCoursePage />} />
                  <Route
                    path="/teacher/math/:gradeKey/:courseId/unit/:unitNumber"
                    element={<MathUnitPage />}
                  />
                  <Route
                    path="/teacher/math/:gradeKey/:courseId/unit/:unitNumber/brief"
                    element={<MathBriefPage />}
                  />
                  <Route
                    path="/teacher/math/:gradeKey/:courseId/unit/:unitNumber/worksheet"
                    element={<MathWorksheetPage />}
                  />
                  <Route
                    path="/teacher/math/:gradeKey/:courseId/unit/:unitNumber/homework"
                    element={<MathHomeworkPage />}
                  />
                  <Route path="/teacher/physics/:gradeKey" element={<MathGradeHubPage />} />
                  <Route path="/teacher/physics/:gradeKey/:courseId" element={<MathCoursePage />} />
                  <Route
                    path="/teacher/physics/:gradeKey/:courseId/unit/:unitNumber"
                    element={<MathUnitPage />}
                  />
                  <Route
                    path="/teacher/physics/:gradeKey/:courseId/unit/:unitNumber/brief"
                    element={<MathBriefPage />}
                  />
                  <Route
                    path="/teacher/physics/:gradeKey/:courseId/unit/:unitNumber/worksheet"
                    element={<MathWorksheetPage />}
                  />
                  <Route
                    path="/teacher/physics/:gradeKey/:courseId/unit/:unitNumber/homework"
                    element={<MathHomeworkPage />}
                  />
                </Route>

                <Route path="/teacher/math-grade9" element={<Navigate to="/teacher/math/grade9" replace />} />
                <Route
                  path="/teacher/math-grade9/:courseId/unit/:unitNumber/*"
                  element={<LegacyMathGrade9Redirect />}
                />
                <Route path="/teacher/math-grade9/:courseId/*" element={<LegacyMathGrade9Redirect />} />

                <Route path="/teacher/lessons/:lessonId" element={<LessonPackPage />} />
                <Route path="/teacher/lessons/:lessonId/brief" element={<BriefPage />} />
                <Route path="/teacher/lessons/:lessonId/worksheet" element={<WorksheetPage />} />
                <Route path="/teacher/lessons/:lessonId/homework" element={<HomeworkPage />} />
                <Route path="/teacher/lessons/:lessonId/review-quiz" element={<ReviewQuizPage />} />
                <Route path="/teacher/lessons/:lessonId/check/:kind" element={<CheckModePage />} />
                <Route path="/teacher/sessions" element={<SessionsPage />} />
                <Route path="/teacher/students" element={<StudentsPage />} />
                <Route path="/teacher/students/:studentId" element={<StudentProfilePage />} />
                <Route path="/teacher/parents" element={<ParentsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

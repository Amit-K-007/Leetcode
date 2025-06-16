import { Route, Routes } from "react-router-dom"
import { Home } from "./pages/Home"
import { Login } from "./pages/Login"
import { Signup } from "./pages/Signup"
import { ForgotPassword } from "./pages/ForgotPassword"
import { ProblemSet } from "./pages/ProblemSet"
import { Problem } from "./pages/Problem"
import { Description } from "./components/problem/Description"
import { Submissions } from "./components/problem/Submissions"
import "@/styles/App.css";
import { SubmissionDetail } from "./components/problem/SubmissionDetail"

function App() {

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/problemset" element={<ProblemSet />} />
      <Route path="/problems/:slug" element={<Problem />}>
        <Route index element={<Description />} />
        <Route path="description" element={<Description />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="submissions/:submissionId" element={<SubmissionDetail />} />
      </Route>
    </Routes>
  )
}

export default App

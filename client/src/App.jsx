import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./pages/auth";
import RouteGuard from "./components/route-guard";
import { useSelector } from "react-redux";
import Student from "./pages/student/Student";
import Student_Dashboard from "./pages/student/Student_Dashboard";
import InvitationPage from "./pages/student/InvitationPage";
import ProjectFileUpload from "./pages/student/ProjectFileUpload";
import Project_Details from "./pages/student/Project_Details";
import Queries from "./pages/student/Queries";
import Progress_Update from "./pages/student/Progress_Update";
import WeeklyLogsHistory from "./pages/student/week";
import Admin from "./pages/admin/Admin";
import Admin_Dashboard from "./pages/admin/Admin_Dashboard";
import Add_Users from "./pages/admin/Add_Users";
import BulkUploadUsers from "./pages/admin/BulkUploadUsers";
import Posted_project from "./pages/admin/Posted_project";
import Admin_project_details from "./pages/admin/Admin_project_details";
import TimeLine from "./pages/admin/Timeline";
import TeamListByDepartment from "./pages/admin/TeamListByDepartment";
import ChangeTimeLine from "./pages/admin/ChangeTimeLine";
import AssignGuideExpert from "./pages/admin/AssignGuideExpert";
import WeekLogUpdate from "./pages/admin/WeekLogUpdate";
import Guide from "./pages/staff/guide";
import Staff_dashboard from "./pages/staff/Staff_dashboard";
import Guide_queries from "./pages/staff/Guide_queries";
import Guide_team_progress from "./pages/staff/Guide_team_progress";
import ReviewProjects from "./pages/staff/Review_projects";
import Team_Details from "./pages/staff/Team_Details";
import NotFoundPage from "./pages/not-found";
import AddUsers from "./pages/auth/addUsers";
import ScheduleReview from "./pages/student/Schedule_review";

function App() {
  const { auth, loading } = useSelector((state) => state.userSlice);
  const location = useLocation();
  const teamselector = useSelector((state) => state.teamSlice.data || null);
  const userselector = useSelector((state) => state.userSlice.auth?.user || null);
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  // console.log(userselector, "App.jsx");
  return (
    <Routes location={location} key={location.pathname}>
      {/* Auth Route - accessible to unauthenticated users */}
      <Route
        path="/auth"
        element={
          <RouteGuard
            element={<AuthPage />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <RouteGuard
            // element={<StudentDashboard />}
            element={<Student />}
            authenticated={auth?.authenticate}
            user={auth?.user}
            allowedRoles={["student"]}
            loading={loading}
          />
        }
      >
        <Route index element={<Student_Dashboard />} />
        <Route path="invitations" element={<InvitationPage />} />
        <Route path="upload-project-files" element={<ProjectFileUpload />} />

        {teamselector && (
          <>
            <Route path="Project_Details" element={<Project_Details />} />
            {userselector?.guide_reg_num && (
              <>
                <Route path="queries" element={<Queries />} />
                <Route path="review" element={<ScheduleReview />} />
                <Route path="Progress_update" element={<Progress_Update />} />
                <Route path="week" element={<WeeklyLogsHistory />} />
              </>
            )}
          </>
        )}
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <RouteGuard
            // element={<AdminDashboard />}
            element={<Admin />}
            authenticated={auth?.authenticate}
            user={auth?.user}
            allowedRoles={["admin"]}
          />
        }
      >
        <Route index element={<Admin_Dashboard />} />
        <Route path="add_users" element={<AddUsers />} />
        <Route path="Bulk_Upload_Users" element={<BulkUploadUsers />} />
        <Route path="posted_projects" element={<Posted_project />} />
        <Route path="posted_projects/:project_id" element={<Admin_project_details />} />
        <Route path="student_progress/:cluster" element={<Admin_project_details />} />
        <Route path="TimeLine" element={<TimeLine />} />
        <Route path="team_list/:department" element={<TeamListByDepartment />} />
        <Route path="team_progress/:project_id" element={<Admin_project_details />} />
        <Route path="TimeLine/change-timeline" element={<ChangeTimeLine />} />
        {/* <Route path="TimeLine/challenge-review" element={<ChallengeReviewAdmin />} /> */}
        <Route path="timeline/assignguideexpert" element={<AssignGuideExpert />} />
        <Route path="timeline/weeklogupdate" element={<WeekLogUpdate />} />
        <Route path="timeline/weekloginsert" element={<WeekLogUpdate />} />
      </Route>

      {/* Guide Routes */}
      <Route
        path="/guide"
        element={
          <RouteGuard
            // element={<StaffDAshboard />}
            element={<Guide />}

            authenticated={auth?.authenticate}
            user={auth?.user}
            allowedRoles={["staff"]}
          />
        }
      >
        <Route index element={<Staff_dashboard />} />
        <Route path="queries" element={<Guide_queries />} />
        <Route path="team_progress" element={<Guide_team_progress />} />
        <Route path="review_progress" element={<ReviewProjects />} />
        <Route path="team-details/:teamId" element={<Team_Details />} />
      </Route>

      {/* Root redirect based on role */}
      <Route
        path="/"
        element={
          <RouteGuard
            element={<Navigate
              to={getDefaultRoute(auth?.user?.role)}
              state={{ from: location }}
              replace
            />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      />

      {/* Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Helper function to get default route based on role
function getDefaultRoute(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/guide";
    case "student":
      return "/student";
    default:
      return "/auth";
  }
}

export default App;








// import { Navigate, Route, Routes } from "react-router-dom";
// import AuthPage from "./pages/auth";
// import RouteGuard from "./components/route-guard";
// import { useSelector } from "react-redux";
// import NotFoundPage from "./pages/not-found";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import StaffDAshboard from "./pages/staff/StaffDAshboard";
// import StudentDashboard from "./pages/student/StudentDashboard";

// function App() {
//   // Get auth state from Redux store
//   // const { auth } = useSelector((state) => state.auth);
//   const { auth } = useSelector((state) => state.userSlice);
//   console.log(auth, "authhhhhhhh");

//   return (
//     <Routes>
//       {/* Auth Route - accessible to unauthenticated users */}
//       <Route
//         path="/auth"
//         element={
//           <RouteGuard
//             element={<AuthPage />}
//             authenticated={auth?.authenticate}
//             user={auth?.user}
//           />
//         }
//       />

//       {/* Admin Routes */}
//       <Route
//         path="/admin"
//         element={
//           <RouteGuard
//             element={<AdminDashboard />}
//             authenticated={auth?.authenticate}
//             user={auth?.user}
//             allowedRoles={["admin"]}
//           />
//         }
//       />

//       {/* Staff Routes */}
//       <Route
//         path="/guide"
//         element={
//           <RouteGuard
//             element={<StaffDAshboard />}
//             authenticated={auth?.authenticate}
//             user={auth?.user}
//             allowedRoles={["staff"]}
//           />
//         }
//       />

//       {/* Student Routes */}
//       <Route
//         path="/student"
//         element={
//           <RouteGuard
//             element={<StudentDashboard />}
//             authenticated={auth?.authenticate}
//             user={auth?.user}
//             allowedRoles={["student"]}
//           />
//         }
//       />

//       {/* Root redirect based on role */}
//       <Route
//         path="/"
//         element={
//           <RouteGuard
//             element={<Navigate to={getDefaultRoute(auth?.user?.role)} />}
//             authenticated={auth?.authenticate}
//             user={auth?.user}
//           />
//         }
//       />

//       {/* Not Found */}
//       <Route path="*" element={<NotFoundPage />} />
//     </Routes>
//   );
// }

// // Helper function to get default route based on role
// function getDefaultRoute(role) {
//   switch (role) {
//     case "admin":
//       return "/admin";
//     case "staff":
//       return "/guide";
//     case "student":
//       return "/student";
//     default:
//       return "/auth";
//   }
// }

// export default App;
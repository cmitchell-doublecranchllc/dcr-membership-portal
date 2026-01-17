import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import StaffDashboard from "./pages/StaffDashboard";
import Contracts from "./pages/Contracts";
import AdminContracts from "./pages/AdminContracts";
import Messages from "./pages/Messages";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import AdminEvents from "./pages/AdminEvents";
import AdminRecurringEvents from "./pages/AdminRecurringEvents";
import StaffLessons from "./pages/StaffLessons";
import StaffAttendance from "./pages/StaffAttendance";
import StaffProgressNotes from "./pages/StaffProgressNotes";
import MyProgressNotes from "./pages/MyProgressNotes";
import InstructorStudents from "./pages/InstructorStudents";
import StaffStudentEdit from "./pages/StaffStudentEdit";
import PendingApproval from "./pages/PendingApproval";
import StaffPendingMembers from "./pages/StaffPendingMembers";
import StaffPendingCheckIns from "./pages/StaffPendingCheckIns";
import StaffUserManagement from "./pages/StaffUserManagement";
import Signup from "./pages/Signup";
import Documents from "./pages/Documents";
import MyGoals from "./pages/MyGoals";
import MyProgress from "./pages/MyProgress";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile" component={Profile} />
      <Route path="/staff" component={StaffDashboard} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/documents" component={Documents} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/messages" component={Messages} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetails} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/recurring-events" component={AdminRecurringEvents} />
      <Route path="/staff/lessons" component={StaffLessons} />
      <Route path="/staff/attendance" component={StaffAttendance} />
      <Route path="/staff/progress-notes" component={StaffProgressNotes} />
      <Route path="/staff/students" component={InstructorStudents} />
      <Route path="/staff/students/:id/edit" component={StaffStudentEdit} />
      <Route path="/staff/pending-members" component={StaffPendingMembers} />
      <Route path="/staff/pending-checkins" component={StaffPendingCheckIns} />
      <Route path="/staff/users" component={StaffUserManagement} />
      <Route path="/my-progress-notes" component={MyProgressNotes} />
      <Route path="/my-progress" component={MyProgress} />
      <Route path="/my-goals" component={MyGoals} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

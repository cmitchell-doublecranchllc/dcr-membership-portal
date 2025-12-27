import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import StaffDashboard from "./pages/StaffDashboard";
import Contracts from "./pages/Contracts";
import AdminContracts from "./pages/AdminContracts";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import AdminEvents from "./pages/AdminEvents";
import AdminRecurringEvents from "./pages/AdminRecurringEvents";
import StaffLessons from "./pages/StaffLessons";
import MyLessons from "./pages/MyLessons";
import StaffAttendance from "./pages/StaffAttendance";
import StaffProgressNotes from "./pages/StaffProgressNotes";
import MyProgressNotes from "./pages/MyProgressNotes";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/profile" component={Profile} />
      <Route path="/staff" component={StaffDashboard} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/messages" component={Messages} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetails} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/recurring-events" component={AdminRecurringEvents} />
      <Route path="/staff/lessons" component={StaffLessons} />
      <Route path="/staff/attendance" component={StaffAttendance} />
      <Route path="/staff/progress-notes" component={StaffProgressNotes} />
      <Route path="/my-lessons" component={MyLessons} />
      <Route path="/my-progress" component={MyProgressNotes} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

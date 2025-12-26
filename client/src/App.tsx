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

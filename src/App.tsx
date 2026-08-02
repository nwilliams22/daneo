import { Routes, Route, Navigate } from "react-router";
import { useApplyTheme } from "./theme/useTheme";
import AppShell from "./components/AppShell";
import LearnPage from "./features/learn/LearnPage";
import DrillHubPage from "./features/drills/DrillHubPage";
import ReviewPage from "./features/review/ReviewPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ExplorePage from "./features/explore/ExplorePage";
import SettingsPage from "./features/settings/SettingsPage";

export default function App() {
  useApplyTheme();

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/learn" replace />} />
        <Route path="/learn/*" element={<LearnPage />} />
        <Route path="/drill/*" element={<DrillHubPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
    </AppShell>
  );
}

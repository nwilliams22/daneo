import { Routes, Route, Navigate } from "react-router";
import { useApplyTheme } from "./theme/useTheme";
import { useSettings } from "./state/settings";
import AppShell from "./components/AppShell";
import Onboarding from "./features/onboarding/Onboarding";
import LearnPage from "./features/learn/LearnPage";
import ModulePage from "./features/learn/ModulePage";
import DrillHubPage from "./features/drills/DrillHubPage";
import ConfusablesDrill from "./features/drills/confusables/ConfusablesDrill";
import CrossFontReader from "./features/drills/crossfont/CrossFontReader";
import AnatomyDrill from "./features/drills/anatomy/AnatomyDrill";
import GapDrill from "./features/drills/gap/GapDrill";
import TypingDrill from "./features/drills/typing/TypingDrill";
import ReviewPage from "./features/review/ReviewPage";
import ReviewSessionRoute from "./features/review/ReviewSession";
import DashboardPage from "./features/dashboard/DashboardPage";
import ExplorePage from "./features/explore/ExplorePage";
import SettingsPage from "./features/settings/SettingsPage";

export default function App() {
  useApplyTheme();
  const onboardingDone = useSettings((s) => s.onboardingDone);

  if (!onboardingDone) return <Onboarding />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/learn" replace />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:moduleId" element={<ModulePage />} />
        <Route path="/drill" element={<DrillHubPage />} />
        <Route path="/drill/confusables" element={<ConfusablesDrill />} />
        <Route path="/drill/fonts" element={<CrossFontReader />} />
        <Route path="/drill/anatomy" element={<AnatomyDrill />} />
        <Route path="/drill/gap" element={<GapDrill />} />
        <Route path="/drill/typing" element={<TypingDrill />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/review/session" element={<ReviewSessionRoute />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
    </AppShell>
  );
}

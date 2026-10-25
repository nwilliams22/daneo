import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useApplyTheme } from "./theme/useTheme";
import { useSettings } from "./state/settings";
import AppShell from "./components/AppShell";
import Onboarding from "./features/onboarding/Onboarding";
import TodayPage from "./features/today/TodayPage";
import LearnPage from "./features/learn/LearnPage";
import ModulePage from "./features/learn/ModulePage";
import ModuleTestRoute from "./features/learn/ModuleTest";
import MissedPracticeRoute from "./features/learn/MissedPractice";
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

const TutorPage = import.meta.env.DEV
  ? lazy(() => import("./features/tutor/TutorPage"))
  : null;

export default function App() {
  useApplyTheme();
  const onboardingDone = useSettings((s) => s.onboardingDone);

  if (!onboardingDone) return <Onboarding />;

  return (
    <AppShell>
      <Routes>
        {/* Today is the landing page (BAD-281): "/" used to drop the learner
            straight into the 164-module list. */}
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:moduleId" element={<ModulePage />} />
        <Route path="/learn/:moduleId/test" element={<ModuleTestRoute />} />
        <Route
          path="/learn/:moduleId/practice"
          element={<MissedPracticeRoute />}
        />
        <Route path="/drill" element={<DrillHubPage />} />
        <Route
          path="/drill/confusables"
          element={<Navigate to="/drill/confusables/flashcards" replace />}
        />
        <Route path="/drill/confusables/:mode" element={<ConfusablesDrill />} />
        <Route path="/drill/fonts" element={<CrossFontReader />} />
        <Route path="/drill/anatomy" element={<AnatomyDrill />} />
        <Route
          path="/drill/gap"
          element={<Navigate to="/drill/gap/browse" replace />}
        />
        <Route path="/drill/gap/:mode" element={<GapDrill />} />
        <Route path="/drill/typing" element={<TypingDrill />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/review/session" element={<ReviewSessionRoute />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        {TutorPage && <Route path="/tutor" element={<Suspense fallback={null}><TutorPage /></Suspense>} />}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </AppShell>
  );
}

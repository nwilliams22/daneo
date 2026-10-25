import { clearAllProgress } from "../../db/repo";
import { useSettings } from "../../state/settings";

/** The one funnel for wiping a learner clean: every Dexie learner table plus
 *  the persisted settings store, onboardingDone included, so the app comes
 *  back at onboarding.
 *
 *  Not touched: downloaded model files. They are content the learner paid
 *  bandwidth for, not progress, and they are not listed here.
 *
 *  Profile-ready: when accounts/profiles land, the profile id arrives here and
 *  goes to clearAllProgress(); the UI keeps calling this one function. */
export async function resetAllProgress() {
  await clearAllProgress();
  useSettings.getState().resetSettings();
  // Drop the persisted copy as well, so a reload cannot resurrect it.
  useSettings.persist.clearStorage();
}

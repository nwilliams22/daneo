import { useEffect } from "react";
import { useSettings } from "../state/settings";

/** Applies the theme setting to <html> (class "dark") and follows the OS
 *  preference live while the setting is "system". Mount once in App. */
export function useApplyTheme() {
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

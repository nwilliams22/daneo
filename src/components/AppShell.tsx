import type { ReactNode } from "react";
import { NavLink } from "react-router";

const NAV = [
  { to: "/today", label: "Today" },
  { to: "/learn", label: "Learn" },
  { to: "/drill", label: "Drill" },
  { to: "/review", label: "Review" },
  { to: "/dashboard", label: "Stats" },
  { to: "/explore", label: "Explore" },
  ...(import.meta.env.DEV ? [{ to: "/tutor", label: "Ask Daneo" }] : []),
  { to: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Dancheong's masthead is a rule under a wordmark, not a toolbar: no
          fill of its own, and the current section is marked by a vermilion
          underline rather than a filled pill (BAD-281). */}
      <header className="sticky top-0 z-20 border-b border-ink/70 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-baseline gap-1 px-5 pt-3 pb-2.5">
          <NavLink
            to="/today"
            className="mr-3 flex items-baseline gap-2 select-none"
          >
            <span className="font-myeongjo text-xl leading-none font-semibold">
              단어
            </span>
            <span className="text-[10px] tracking-[0.26em] text-muted uppercase">
              Daneo
            </span>
          </NavLink>
          <nav className="flex flex-1 items-baseline justify-end gap-4 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `border-b-2 pb-1 text-[13px] whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-teal font-semibold text-teal"
                      : "border-transparent text-muted hover:text-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-20">
        {children}
      </main>
    </div>
  );
}

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
      {/* Slate's appbar is a surface, not an outlined strip: panel fill and a
          hairline shadow instead of a bottom border (BAD-281). */}
      <header className="sticky top-0 z-20 bg-panel/95 shadow-[0_1px_0_0_var(--line)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-2.5">
          <NavLink
            to="/today"
            className="mr-2 flex items-baseline gap-1.5 select-none"
          >
            <span className="font-korean text-xl leading-none font-bold">
              단어
            </span>
            <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
              Daneo
            </span>
          </NavLink>
          <nav className="flex flex-1 items-center justify-end gap-0.5 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-ink text-panel"
                      : "text-muted hover:bg-fill hover:text-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pt-7 pb-16">
        {children}
      </main>
    </div>
  );
}

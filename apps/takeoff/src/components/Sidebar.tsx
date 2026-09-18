"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Goals",
    match: (pathname: string) => pathname === "/",
    icon: GoalsIcon,
  },
  {
    href: "/today",
    label: "Today",
    match: (pathname: string) => pathname === "/today",
    icon: TodayIcon,
  },
] as const;

function MountainLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="h-7 w-7 shrink-0"
    >
      <path
        d="M4 24L12.5 10l4.2 7.2L20.5 12 28 24H4z"
        fill="currentColor"
        className="text-[var(--brand)]"
      />
      <path
        d="M12.5 10l4.2 7.2L20.5 12 28 24H16.5L12.5 10z"
        fill="currentColor"
        className="text-[var(--brand)] opacity-70"
      />
    </svg>
  );
}

function GoalsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TodayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3" strokeLinecap="round" />
      <path d="M16 3.5v3" strokeLinecap="round" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-dvh w-60 shrink-0 flex-col self-stretch border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-5">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <MountainLogo />
        <span className="text-[1.05rem] font-semibold tracking-tight text-[var(--foreground)]">
          MyMomentum
        </span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Main">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--nav-active)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--foreground)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

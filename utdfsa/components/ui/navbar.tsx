"use client";

import Link from "next/link";

const links = [
  { label: "About", href: "/about" },
  { label: "Pamilya", href: "/Pamilya" },
  { label: "Events", href: "/events" },
  { label: "Members", href: "/members" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-orange-400 font-semibold tracking-wide text-sm"
        >
          UTD FSA
        </Link>

        <ul className="flex items-center gap-8">
          {links.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-white/50 hover:text-orange-400 text-sm tracking-wide transition-colors duration-200"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="text-sm tracking-wide px-4 py-1.5 rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-400 transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm tracking-wide px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-medium transition-all duration-150 shadow-lg shadow-orange-500/20"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}

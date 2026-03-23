"use client";

import Link from "next/link";

const links = [
  { label: "About", href: "/about" },
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
      </nav>
    </header>
  );
}

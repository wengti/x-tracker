'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiURL } from "@/lib/api";

const links = [
  { href: "/1vs1", label: "1 vs 1" },
  { href: "/3vs3", label: "3 vs 3" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem("x-tracker-name"));
  }, [pathname]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch(apiURL("/auth/logout"), { method: "POST", credentials: "include" });
    localStorage.removeItem("x-tracker-name");
    setName(null);
    router.push("/");
  }

  const navLinkClass = (href: string) =>
    pathname === href
      ? "text-blue-400"
      : "text-neutral-400 transition-colors hover:text-white";

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className={navLinkClass(href)}>
            {label}
          </Link>
        ))}
        {name && (
          <>
            <Link href="/profile" className={navLinkClass("/profile")}>
              {name}
            </Link>
            <button onClick={logout} className="text-neutral-400 transition-colors hover:text-white">
              Log out
            </button>
          </>
        )}
      </nav>

      {/* Mobile hamburger */}
      <div className="relative md:hidden">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex flex-col gap-1.5 p-2 text-neutral-400 hover:text-white"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-neutral-800 bg-black/95 py-2 shadow-xl backdrop-blur-md">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block px-4 py-2 text-sm font-medium ${navLinkClass(href)}`}
              >
                {label}
              </Link>
            ))}
            {name && (
              <>
                <div className="my-1.5 border-t border-neutral-800" />
                <Link
                  href="/profile"
                  className={`block px-4 py-2 text-sm font-medium ${navLinkClass("/profile")}`}
                >
                  {name}
                </Link>
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-left text-sm font-medium text-neutral-400 hover:text-white"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

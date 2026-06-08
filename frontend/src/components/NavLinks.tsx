'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/1vs1", label: "1 vs 1" },
  { href: "/3vs3", label: "3 vs 3" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("x-trakcer-name"));
  }, []);

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname === href
              ? "text-blue-400"
              : "text-neutral-400 transition-colors hover:text-white"
          }
        >
          {label}
        </Link>
      ))}

      {name && (
        <Link
          href="/profile"
          className={
            pathname === "/profile"
              ? "text-blue-400"
              : "text-neutral-400 transition-colors hover:text-white"
          }
        >
          {name}
        </Link>
      )}
    </nav>
  );
}

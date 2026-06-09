'use client'

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Greeting() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("x-tracker-name"));
  }, [pathname]);

  if (!name) return null;
  return <span className="text-sm text-neutral-400 font-bold">Hi, {name}</span>;
}

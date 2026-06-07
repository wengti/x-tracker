import Image from "next/image";
import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-(--header-height) border-b border-blue-900/40 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="X Tracker"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            X <span className="text-blue-400">Tracker</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo with glow */}
        <div className="relative">
          <div className="absolute inset-0 scale-110 rounded-3xl bg-blue-500/25 blur-3xl" />
          <Image
            src="/logo.png"
            alt="X Tracker Logo"
            width={160}
            height={160}
            className="relative rounded-2xl"
            priority
          />
        </div>

        {/* Title & tagline */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-6xl font-black tracking-tight text-white">
            X <span className="text-blue-400">Tracker</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-neutral-400">
            Let it rip — and prove it.
            <br />
            Track every clash, dominate every stadium, and forge your legacy one spin at a time.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-blue-500 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-400 active:scale-95"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-blue-500/60 px-8 py-3 font-semibold text-blue-400 transition-all hover:border-blue-400 hover:text-blue-300 active:scale-95"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}

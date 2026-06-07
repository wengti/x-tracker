'use client'

import Scoreboard from "@/components/Scoreboard";
import { useState } from "react";

type Score = { you: number; opponent: number };

export default function OneVsOnePage() {
  const [score] = useState<Score>({ you: 0, opponent: 0 });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-4xl space-y-10">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            1 <span className="text-blue-400">vs</span> 1
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Record your test matchups</p>
        </div>

        {/* 1. Bey Setups — coming soon */}
        <section aria-label="Bey Setups" />

        {/* 2. Scoreboard */}
        <section aria-label="Scoreboard">
          <Scoreboard youScore={score.you} opponentScore={score.opponent} />
        </section>

        {/* 3. Finish Buttons — coming soon */}
        <section aria-label="Finish Buttons" />

        {/* 4. Submit / Clear — coming soon */}
        <section aria-label="Actions" />

      </div>
    </main>
  );
}

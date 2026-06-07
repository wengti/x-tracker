'use client'

import { useState } from "react";
import Scoreboard from "@/components/Scoreboard";
import FinishButtons from "@/components/FinishButtons";

type Score = { you: number; opponent: number };

export default function OneVsOnePage() {
  const [score, setScore] = useState<Score>({ you: 0, opponent: 0 });
  const [roundLocked, setRoundLocked] = useState(false);

  function addPoints(side: "you" | "opponent", points: number) {
    setScore((prev) => ({ ...prev, [side]: prev[side] + points }));
    setRoundLocked(true);
  }

  function handleSubmit() {
    // TODO: send match result to backend
    setScore({ you: 0, opponent: 0 });
    setRoundLocked(false);
  }

  function handleClear() {
    setScore({ you: 0, opponent: 0 }); 
    setRoundLocked(false);
  }

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

        {/* 3. Finish Buttons */}
        <section aria-label="Finish Buttons">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <FinishButtons side="you" onFinish={(pts) => addPoints("you", pts)} disabled={roundLocked} />
            <FinishButtons side="opponent" onFinish={(pts) => addPoints("opponent", pts)} disabled={roundLocked} />
          </div>
        </section>

        {/* 4. Submit / Clear */}
        <section aria-label="Actions">
          <div className="flex gap-3">
            <button
              disabled={score.you === 0 && score.opponent === 0}
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-all hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Submit
            </button>
            <button
              disabled={score.you === 0 && score.opponent === 0}
              onClick={() => {handleClear() }}
              className="flex-1 rounded-xl border border-neutral-700 py-3 font-semibold text-neutral-300 transition-all hover:border-neutral-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Clear
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}

'use client'

import { useState } from "react";
import Scoreboard from "@/components/Scoreboard";
import FinishButtons from "@/components/FinishButtons";
import BeySetupPanel from "@/components/BeySetupPanel";
import BeyPicker from "@/components/BeyPicker";
import { type BeySetup, DEFAULT_BEY_SETUP, getBeyName, findDuplicateParts } from "@/types/bey";

type Score = { you: number; opponent: number };

const EMPTY_SETUPS = (): BeySetup[] => [
  { ...DEFAULT_BEY_SETUP },
  { ...DEFAULT_BEY_SETUP },
  { ...DEFAULT_BEY_SETUP },
];

export default function ThreeVsThreePage() {
  const [score, setScore] = useState<Score>({ you: 0, opponent: 0 });
  const [isYourFriend, setIsYourFriend] = useState(false);
  const [youSetups, setYouSetups] = useState<BeySetup[]>(EMPTY_SETUPS());
  const [opponentSetups, setOpponentSetups] = useState<BeySetup[]>(EMPTY_SETUPS());
  const [selectedYouBey, setSelectedYouBey] = useState(0);
  const [selectedOpponentBey, setSelectedOpponentBey] = useState(0);

  const youDuplicates = findDuplicateParts(youSetups);
  const opponentDuplicates = findDuplicateParts(opponentSetups);

  function updateYouSetup(index: number, setup: BeySetup) {
    setYouSetups((prev) => prev.map((s, i) => (i === index ? setup : s)));
  }

  function updateOpponentSetup(index: number, setup: BeySetup) {
    setOpponentSetups((prev) => prev.map((s, i) => (i === index ? setup : s)));
  }

  function addPoints(side: "you" | "opponent", points: number) {
    setScore((prev) => ({ ...prev, [side]: prev[side] + points }));
  }

  function handleSubmit() {
    // TODO: send 3v3 match result and 1v1 match results to backend
    setScore({ you: 0, opponent: 0 });
  }

  function handleClear() {
    setScore({ you: 0, opponent: 0 });
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-4xl space-y-10">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            3 <span className="text-blue-400">vs</span> 3
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Record your 3v3 matchups</p>
        </div>

        {/* 1. Bey Setups */}
        <section aria-label="Bey Setups">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              {youSetups.map((setup, i) => (
                <BeySetupPanel
                  key={i}
                  label={`Your Bey ${i + 1}`}
                  setup={setup}
                  onSetupChange={(s) => updateYouSetup(i, s)}
                  duplicateParts={youDuplicates}
                />
              ))}
            </div>
            <div className="space-y-4">
              {opponentSetups.map((setup, i) => (
                <BeySetupPanel
                  key={i}
                  label={`Opponent's Bey ${i + 1}`}
                  setup={setup}
                  onSetupChange={(s) => updateOpponentSetup(i, s)}
                  duplicateParts={opponentDuplicates}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 2. Bey Selection */}
        <section aria-label="Bey Selection">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BeyPicker
              label="Your Bey"
              setups={youSetups}
              selectedIndex={selectedYouBey}
              onSelect={setSelectedYouBey}
            />
            <BeyPicker
              label="Opponent's Bey"
              setups={opponentSetups}
              selectedIndex={selectedOpponentBey}
              onSelect={setSelectedOpponentBey}
            />
          </div>
        </section>

        {/* 3. Scoreboard */}
        <section aria-label="Scoreboard">
          <Scoreboard
            youScore={score.you}
            opponentScore={score.opponent}
            isYourFriend={isYourFriend}
            onToggleYourFriend={() => setIsYourFriend((v) => !v)}
            youBeyName={getBeyName(youSetups[selectedYouBey])}
            opponentBeyName={getBeyName(opponentSetups[selectedOpponentBey])}
          />
        </section>

        {/* 4. Finish Buttons */}
        <section aria-label="Finish Buttons">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <FinishButtons side="you" onFinish={(pts) => addPoints("you", pts)} />
            <FinishButtons side="opponent" onFinish={(pts) => addPoints("opponent", pts)} />
          </div>
        </section>

        {/* 5. Submit / Clear */}
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
              onClick={handleClear}
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

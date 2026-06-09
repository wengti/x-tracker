'use client'

import { useState } from "react";
import Scoreboard from "@/components/Scoreboard";
import FinishButtons from "@/components/FinishButtons";
import BeySetupPanel from "@/components/BeySetupPanel";
import BeyPicker from "@/components/BeyPicker";
import { type BeySetup, DEFAULT_BEY_SETUP, getBeyName } from "@/types/bey";
import { fetchParts, type Part } from "@/data/parts";
import { apiURL } from "@/lib/api";

type Score = { you: number; opponent: number };

function partId(list: Part[], name: string): number | null {
  return name ? (list.find((p) => p.name === name)?.id ?? null) : null;
}

export default function OneVsOnePage() {
  const [score, setScore] = useState<Score>({ you: 0, opponent: 0 });
  const [roundLocked, setRoundLocked] = useState(false);
  const [lastFinishType, setLastFinishType] = useState<string | null>(null);
  const [isYourFriend, setIsYourFriend] = useState(false);
  const [youSetup, setYouSetup] = useState<BeySetup>(DEFAULT_BEY_SETUP);
  const [opponentSetup, setOpponentSetup] = useState<BeySetup>(DEFAULT_BEY_SETUP);
  const [selectedYouBey, setSelectedYouBey] = useState(0);
  const [selectedOpponentBey, setSelectedOpponentBey] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function addPoints(side: "you" | "opponent", points: number, finishType: string) {
    setScore((prev) => ({ ...prev, [side]: prev[side] + points }));
    setLastFinishType(finishType);
    setRoundLocked(true);
  }

  async function handleSubmit() {
    if (!isYourFriend && lastFinishType) {
      setSubmitError(null);
      try {
        const catalog = await fetchParts();
        const body = {
          blade_a1_id:        partId(catalog.blade,        youSetup.blade),
          metal_blade_a1_id:  partId(catalog.metal_blade,  youSetup.metalBlade),
          over_blade_a1_id:   partId(catalog.over_blade,   youSetup.overBlade),
          assist_blade_a1_id: partId(catalog.assist_blade, youSetup.assistBlade),
          lock_chip_a1_id:    partId(catalog.lock_chip,    youSetup.lockChip),
          ratchet_a1_id:      partId(catalog.ratchet,      youSetup.ratchet),
          bit_a1_id:          partId(catalog.bit,          youSetup.bit),

          blade_b1_id:        partId(catalog.blade,        opponentSetup.blade),
          metal_blade_b1_id:  partId(catalog.metal_blade,  opponentSetup.metalBlade),
          over_blade_b1_id:   partId(catalog.over_blade,   opponentSetup.overBlade),
          assist_blade_b1_id: partId(catalog.assist_blade, opponentSetup.assistBlade),
          lock_chip_b1_id:    partId(catalog.lock_chip,    opponentSetup.lockChip),
          ratchet_b1_id:      partId(catalog.ratchet,      opponentSetup.ratchet),
          bit_b1_id:          partId(catalog.bit,          opponentSetup.bit),

          win:         score.you > score.opponent ? 1 : 0,
          finish_type: lastFinishType,
        };

        const res = await fetch(apiURL("/matches/1v1"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setSubmitError(data.error ?? "Failed to save match.");
          return;
        }
      } catch {
        setSubmitError("Unable to reach the server. Please try again.");
        return;
      }
    }

    setScore({ you: 0, opponent: 0 });
    setRoundLocked(false);
    setLastFinishType(null);
    setSubmitError(null);
  }

  function handleClear() {
    setScore({ you: 0, opponent: 0 });
    setRoundLocked(false);
    setLastFinishType(null);
    setSubmitError(null);
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

        {/* 1. Bey Setups */}
        <section aria-label="Bey Setups">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BeySetupPanel
              label="Your Bey"
              setup={youSetup}
              onSetupChange={setYouSetup}
              enableSavedBeys
            />
            <BeySetupPanel
              label="Opponent's Bey"
              setup={opponentSetup}
              onSetupChange={setOpponentSetup}
              enableSavedBeys
            />
          </div>
        </section>

        {/* 2. Bey Selection */}
        <section aria-label="Bey Selection">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BeyPicker
              label="Your Bey"
              setups={[youSetup]}
              selectedIndex={selectedYouBey}
              onSelect={setSelectedYouBey}
            />
            <BeyPicker
              label="Opponent's Bey"
              setups={[opponentSetup]}
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
            youBeyName={getBeyName([youSetup][selectedYouBey])}
            opponentBeyName={getBeyName([opponentSetup][selectedOpponentBey])}
          />
        </section>

        {/* 4. Finish Buttons */}
        <section aria-label="Finish Buttons">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <FinishButtons side="you"      onFinish={(pts, type) => addPoints("you",      pts, type)} disabled={roundLocked} />
            <FinishButtons side="opponent" onFinish={(pts, type) => addPoints("opponent", pts, type)} disabled={roundLocked} />
          </div>
        </section>

        {/* 5. Submit / Clear */}
        <section aria-label="Actions">
          {submitError && (
            <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {submitError}
            </p>
          )}
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

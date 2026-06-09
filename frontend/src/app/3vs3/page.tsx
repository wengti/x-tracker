'use client'

import React, { useState } from "react";
import Scoreboard from "@/components/Scoreboard";
import FinishButtons from "@/components/FinishButtons";
import BeySetupPanel from "@/components/BeySetupPanel";
import BeyPicker from "@/components/BeyPicker";
import { type BeySetup, DEFAULT_BEY_SETUP, getBeyName, findDuplicateParts } from "@/types/bey";
import { fetchParts, type Part } from "@/data/parts";
import { apiURL } from "@/lib/api";

function partId(list: Part[], name: string): number | null {
  return name ? (list.find((p) => p.name === name)?.id ?? null) : null;
}

type Score = { you: number; opponent: number };

type HistoryEntry = {
  hasWon: boolean;
  finishType: string;
  youBeyName: string;
  opponentBeyName: string;
  youSetup: BeySetup;
  opponentSetup: BeySetup;
};

const FINISH_POINTS: Record<string, number> = {
  "Spin Finish": 1,
  "Burst Finish": 2,
  "Over Finish": 2,
  "Extreme Finish": 3,
};

const EMPTY_SETUPS = (): BeySetup[] => [
  { ...DEFAULT_BEY_SETUP },
  { ...DEFAULT_BEY_SETUP },
  { ...DEFAULT_BEY_SETUP },
];

export default function ThreeVsThreePage() {
  const [score, setScore] = useState<Score>({ you: 0, opponent: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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

  const [submitError, setSubmitError] = useState<string | null>(null);

  function addPoints(side: "you" | "opponent", points: number, finishType: string) {
    setScore((prev) => ({ ...prev, [side]: prev[side] + points }));
    setHistory((prev) => [...prev, {
      hasWon: side === "you",
      finishType,
      youBeyName: getBeyName(youSetups[selectedYouBey]),
      opponentBeyName: getBeyName(opponentSetups[selectedOpponentBey]),
      youSetup: { ...youSetups[selectedYouBey] },
      opponentSetup: { ...opponentSetups[selectedOpponentBey] },
    }]);
  }

  function buildBeyPayload(setup: BeySetup, catalog: Awaited<ReturnType<typeof fetchParts>>) {
    return {
      blade_id:        partId(catalog.blade,        setup.blade),
      metal_blade_id:  partId(catalog.metal_blade,  setup.metalBlade),
      over_blade_id:   partId(catalog.over_blade,   setup.overBlade),
      assist_blade_id: partId(catalog.assist_blade, setup.assistBlade),
      lock_chip_id:    partId(catalog.lock_chip,    setup.lockChip),
      ratchet_id:      partId(catalog.ratchet,      setup.ratchet),
      bit_id:          partId(catalog.bit,          setup.bit),
    };
  }

  async function handleSubmit() {
    if (!isYourFriend && history.length > 0) {
      setSubmitError(null);
      try {
        const catalog = await fetchParts();
        const body = {
          you_setups:      youSetups.map((s) => buildBeyPayload(s, catalog)),
          opponent_setups: opponentSetups.map((s) => buildBeyPayload(s, catalog)),
          your_score:      score.you,
          opponent_score:  score.opponent,
          rounds: history.map((entry) => ({
            you_bey:      buildBeyPayload(entry.youSetup,      catalog),
            opponent_bey: buildBeyPayload(entry.opponentSetup, catalog),
            win:          entry.hasWon ? 1 : 0,
            finish_type:  entry.finishType,
          })),
        };

        const res = await fetch(apiURL("/matches/3v3"), {
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
    setHistory([]);
    setSubmitError(null);
  }

  function handleClear() {
    setScore({ you: 0, opponent: 0 });
    setHistory([]);
    setSubmitError(null);
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
                  enableSavedBeys
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
                  enableSavedBeys
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
            <FinishButtons side="you" onFinish={(pts, type) => addPoints("you", pts, type)} />
            <FinishButtons side="opponent" onFinish={(pts, type) => addPoints("opponent", pts, type)} />
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

        {/* 6. History */}
        <section aria-label="History">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            History
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-neutral-600">No rounds recorded yet.</p>
          ) : (
            <>
              {/* Card layout — mobile only */}
              <div className="space-y-3 sm:hidden">
                {history.map((entry, i) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm space-y-1.5">
                    <p className="text-xs font-semibold text-neutral-600">#{i + 1}</p>
                    <Row label="Winner">
                      <span className={entry.hasWon ? "text-blue-400" : "text-red-400"}>
                        {entry.hasWon ? (isYourFriend ? "Your Friend" : "You") : "Opponent"}
                      </span>
                    </Row>
                    <Row label="Finish Type">
                      {entry.finishType} (+{FINISH_POINTS[entry.finishType] ?? 0})
                    </Row>
                    <Row label={isYourFriend ? "Your Friend's Bey" : "Your Bey"}>
                      {entry.youBeyName}
                    </Row>
                    <Row label="Opponent's Bey">
                      {entry.opponentBeyName}
                    </Row>
                  </div>
                ))}
              </div>

              {/* Table layout — sm and above */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Winner</th>
                      <th className="px-4 py-3">Finish Type</th>
                      <th className="px-4 py-3">{isYourFriend ? "Your Friend's Bey" : "Your Bey"}</th>
                      <th className="px-4 py-3">Opponent's Bey</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, i) => (
                      <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                        <td className="px-4 py-3 text-neutral-600 font-semibold">{i + 1}</td>
                        <td className={`px-4 py-3 font-medium ${entry.hasWon ? "text-blue-400" : "text-red-400"}`}>
                          {entry.hasWon ? (isYourFriend ? "Your Friend" : "You") : "Opponent"}
                        </td>
                        <td className="px-4 py-3 text-neutral-300">
                          {entry.finishType} (+{FINISH_POINTS[entry.finishType] ?? 0})
                        </td>
                        <td className="px-4 py-3 text-neutral-300">{entry.youBeyName}</td>
                        <td className="px-4 py-3 text-neutral-300">{entry.opponentBeyName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-neutral-300">{children}</span>
    </div>
  );
}

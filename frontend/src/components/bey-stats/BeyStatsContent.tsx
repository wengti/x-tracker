'use client'

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type BeySetup, DEFAULT_BEY_SETUP } from "@/types/bey";
import { fetchParts, type Part, type PartsCatalog } from "@/data/parts";
import {
  fetchBeyStats,
  winRate, finishDist, gameWinRate,
  type BeyStatRound, type BeyStatGame,
} from "@/data/beyStats";
import BeySetupPanel from "@/components/BeySetupPanel";

// ── URL helpers ──────────────────────────────────────────────────────────────

function buildUrl(setup: BeySetup, catalog: PartsCatalog): string {
  const params = new URLSearchParams();
  const add = (key: string, name: string, list: Part[]) => {
    const id = list.find((x) => x.name === name)?.id;
    if (id) params.set(key, String(id));
  };
  add("blade_id",        setup.blade,       catalog.blade);
  add("metal_blade_id",  setup.metalBlade,  catalog.metal_blade);
  add("over_blade_id",   setup.overBlade,   catalog.over_blade);
  add("assist_blade_id", setup.assistBlade, catalog.assist_blade);
  add("lock_chip_id",    setup.lockChip,    catalog.lock_chip);
  add("ratchet_id",      setup.ratchet,     catalog.ratchet);
  add("bit_id",          setup.bit,         catalog.bit);
  return params.toString() ? "?" + params.toString() : "";
}

// ── Sub-components ───────────────────────────────────────────────────────────

const FINISH_LABEL: Record<string, string> = {
  "Spin Finish": "Spin", "Burst Finish": "Burst",
  "Over Finish": "Over", "Extreme Finish": "Extreme",
};

function FinishBar({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist);
  if (entries.length === 0) return <span className="text-neutral-600 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([ft, pct]) => (
        <span key={ft} className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
          {FINISH_LABEL[ft] ?? ft} {pct}%
        </span>
      ))}
    </div>
  );
}

const HISTORY_PAGE_SIZE = 10;

function formatDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BeyStatsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [catalog, setCatalog] = useState<PartsCatalog | null>(null);
  const [setup, setSetup]     = useState<BeySetup>(DEFAULT_BEY_SETUP);

  const [rounds, setRounds]           = useState<BeyStatRound[]>([]);
  const [games, setGames]             = useState<BeyStatGame[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]     = useState<string | null>(null);

  const [activeTab, setActiveTab]       = useState<"1v1" | "3v3" | "total">("total");
  const [historyPage, setHistoryPage]   = useState(0);

  // Load catalog on mount and resolve URL params → setup names
  useEffect(() => {
    fetchParts().then((c) => {
      setCatalog(c);
      const find = (list: Part[], id: string | null) =>
        id ? (list.find((x) => x.id === Number(id))?.name ?? "") : "";
      setSetup({
        isCX:        !!params.get("lock_chip_id"),
        blade:       find(c.blade,        params.get("blade_id")),
        metalBlade:  find(c.metal_blade,  params.get("metal_blade_id")),
        overBlade:   find(c.over_blade,   params.get("over_blade_id")),
        assistBlade: find(c.assist_blade, params.get("assist_blade_id")),
        lockChip:    find(c.lock_chip,    params.get("lock_chip_id")),
        ratchet:     find(c.ratchet,      params.get("ratchet_id")),
        bit:         find(c.bit,          params.get("bit_id")),
      });
    }).catch(() => {});
  }, []);

  // Fetch stats whenever URL params change and bit_id is present
  useEffect(() => {
    if (!params.get("bit_id")) { setRounds([]); setGames([]); return; }
    setStatsLoading(true);
    setStatsError(null);
    setHistoryPage(0);
    fetchBeyStats(params)
      .then((data) => { setRounds(data.rounds); setGames(data.games); })
      .catch(() => setStatsError("Failed to load stats."))
      .finally(() => setStatsLoading(false));
  }, [params]);

  // When user changes the setup via the panel, sync URL
  function handleSetupChange(next: BeySetup) {
    setSetup(next);
    if (catalog) router.replace("/bey-stats" + buildUrl(next, catalog), { scroll: false });
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const rounds1v1 = rounds.filter((r) => r.match3v3Id === null);
  const rounds3v3 = rounds.filter((r) => r.match3v3Id !== null);

  function statsFor(rs: BeyStatRound[]) {
    return {
      total:    rs.length,
      winRate:  winRate(rs),
      winDist:  finishDist(rs.filter((r) => r.win)),
      loseDist: finishDist(rs.filter((r) => !r.win)),
    };
  }

  const stats = { "1v1": statsFor(rounds1v1), "3v3": statsFor(rounds3v3), "total": statsFor(rounds) };

  const hasSetup    = setup.bit !== "";
  const totalHistPages = Math.ceil(rounds.length / HISTORY_PAGE_SIZE);
  const historyRows = rounds.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bey Stats</h1>
          <p className="mt-1 text-sm text-neutral-500">View performance stats for a bey setup</p>
        </div>

        <BeySetupPanel
          label="Bey Setup"
          setup={setup}
          onSetupChange={handleSetupChange}
          collapsible={false}
          enableSavedBeys
        />

        {/* Stats */}
        {hasSetup && (
          <>
            {statsLoading && <p className="text-sm text-neutral-500">Loading stats…</p>}
            {statsError   && <p className="text-sm text-red-400">{statsError}</p>}

            {!statsLoading && !statsError && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
                  {(["total", "1v1", "3v3"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                        activeTab === tab ? "bg-blue-500 text-white" : "text-neutral-400 hover:text-white"
                      }`}>
                      {tab === "total" ? "Total" : tab}
                    </button>
                  ))}
                </div>

                {/* Stat cards */}
                {(() => {
                  const s = stats[activeTab];
                  return (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Rounds</p>
                          <p className="mt-1 text-2xl font-bold text-white">{s.total}</p>
                        </div>
                        <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Win Rate</p>
                          <p className="mt-1 text-2xl font-bold text-white">{s.winRate}%</p>
                        </div>
                        {activeTab === "3v3" && (
                          <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Games</p>
                            <p className="mt-1 text-2xl font-bold text-white">{games.length}</p>
                          </div>
                        )}
                      </div>

                      {activeTab === "3v3" && games.length > 0 && (
                        <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Game Win Rate</p>
                          <p className="mt-1 text-2xl font-bold text-white">{gameWinRate(games)}%</p>
                        </div>
                      )}

                      {s.total > 0 ? (
                        <div className="space-y-3">
                          <div>
                            <p className="mb-1.5 text-xs font-semibold text-neutral-500">When winning</p>
                            <FinishBar dist={s.winDist} />
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-semibold text-neutral-500">When losing</p>
                            <FinishBar dist={s.loseDist} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-600">No data for this context.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Match history */}
                {rounds.length > 0 && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Match History</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-800 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                            <th className="pb-2 pr-4">Date</th>
                            <th className="pb-2 pr-4">Result</th>
                            <th className="pb-2 pr-4">Finish</th>
                            <th className="pb-2">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {historyRows.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 pr-4 text-neutral-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                              <td className="py-2 pr-4">
                                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${r.win ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                                  {r.win ? "W" : "L"}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-neutral-300">{r.finishType}</td>
                              <td className="py-2">
                                <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                                  {r.match3v3Id !== null ? "3v3" : "1v1"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalHistPages > 1 && (
                      <div className="flex items-center justify-between pt-1">
                        <button onClick={() => setHistoryPage((p) => p - 1)} disabled={historyPage === 0}
                          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                          Previous
                        </button>
                        <span className="text-xs text-neutral-500">{historyPage + 1} / {totalHistPages}</span>
                        <button onClick={() => setHistoryPage((p) => p + 1)} disabled={historyPage >= totalHistPages - 1}
                          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </main>
  );
}

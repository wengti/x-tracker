'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchParts, type Part, type PartsCatalog } from "@/data/parts";
import { fetchPlayerStats, type PlayerRound, type PlayerGame } from "@/data/playerStats";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUND_POINTS: Record<string, number> = {
  "Spin Finish": 1, "Burst Finish": 2, "Over Finish": 2, "Extreme Finish": 3,
};

const FINISH_LABEL: Record<string, string> = {
  "Spin Finish": "Spin", "Burst Finish": "Burst",
  "Over Finish": "Over", "Extreme Finish": "Extreme",
};

const FINISH_STYLE: Record<string, string> = {
  "Spin Finish":    "border border-blue-700/60   bg-blue-950/40   text-blue-400",
  "Burst Finish":   "border border-red-700/60    bg-red-950/40    text-red-400",
  "Over Finish":    "border border-amber-700/60  bg-amber-950/40  text-amber-400",
  "Extreme Finish": "border border-violet-700/60 bg-violet-950/40 text-violet-400",
};

const FINISH_TYPES = ["Spin Finish", "Burst Finish", "Over Finish", "Extreme Finish"] as const;
const HISTORY_PAGE_SIZE = 10;
const LEADERBOARD_SIZE  = 10;

// ── Sub-components ────────────────────────────────────────────────────────────

function FinishTag({ ft, suffix }: { ft: string; suffix?: string }) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${FINISH_STYLE[ft] ?? "bg-neutral-800 text-neutral-300"}`}>
      {FINISH_LABEL[ft] ?? ft}{suffix}
    </span>
  );
}

type FinishDist = Record<string, { count: number; pct: number }>;

function FinishBar({ dist }: { dist: FinishDist }) {
  const entries = Object.entries(dist);
  if (entries.length === 0) return <span className="text-neutral-600 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([ft, { pct, count }]) => (
        <FinishTag key={ft} ft={ft} suffix={` ${pct}% (${count})`} />
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(s: string): string {
  const d = new Date(s.includes("Z") ? s : s.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return s;
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function resolveName(list: Part[], id: number | null): string {
  return id ? (list.find((p) => p.id === id)?.name ?? "") : "";
}

function beyName(r: PlayerRound, catalog: PartsCatalog | null): string {
  if (!catalog) return "—";
  const parts = r.lockChipA1Id
    ? [resolveName(catalog.lock_chip, r.lockChipA1Id), resolveName(catalog.metal_blade, r.metalBladeA1Id),
       resolveName(catalog.over_blade, r.overBladeA1Id), resolveName(catalog.assist_blade, r.assistBladeA1Id),
       resolveName(catalog.ratchet, r.ratchetA1Id), resolveName(catalog.bit, r.bitA1Id)]
    : [resolveName(catalog.blade, r.bladeA1Id), resolveName(catalog.ratchet, r.ratchetA1Id),
       resolveName(catalog.bit, r.bitA1Id)];
  return parts.filter(Boolean).join(" ") || "—";
}

function oppName(r: PlayerRound, catalog: PartsCatalog | null): string {
  if (!catalog) return "—";
  const parts = r.lockChipB1Id
    ? [resolveName(catalog.lock_chip, r.lockChipB1Id), resolveName(catalog.metal_blade, r.metalBladeB1Id),
       resolveName(catalog.over_blade, r.overBladeB1Id), resolveName(catalog.assist_blade, r.assistBladeB1Id),
       resolveName(catalog.ratchet, r.ratchetB1Id), resolveName(catalog.bit, r.bitB1Id)]
    : [resolveName(catalog.blade, r.bladeB1Id), resolveName(catalog.ratchet, r.ratchetB1Id),
       resolveName(catalog.bit, r.bitB1Id)];
  return parts.filter(Boolean).join(" ") || "—";
}

function beyUrl(r: PlayerRound): string {
  const p = new URLSearchParams();
  const add = (k: string, id: number | null) => { if (id) p.set(k, String(id)); };
  add("blade_id", r.bladeA1Id); add("metal_blade_id", r.metalBladeA1Id);
  add("over_blade_id", r.overBladeA1Id); add("assist_blade_id", r.assistBladeA1Id);
  add("lock_chip_id", r.lockChipA1Id); add("ratchet_id", r.ratchetA1Id);
  p.set("bit_id", String(r.bitA1Id));
  return "/bey-stats?" + p.toString();
}

function oppUrl(r: PlayerRound): string {
  const p = new URLSearchParams();
  const add = (k: string, id: number | null) => { if (id) p.set(k, String(id)); };
  add("blade_id", r.bladeB1Id); add("metal_blade_id", r.metalBladeB1Id);
  add("over_blade_id", r.overBladeB1Id); add("assist_blade_id", r.assistBladeB1Id);
  add("lock_chip_id", r.lockChipB1Id); add("ratchet_id", r.ratchetB1Id);
  p.set("bit_id", String(r.bitB1Id));
  return "/bey-stats?" + p.toString();
}

function beyKey(r: PlayerRound): string {
  return `${r.lockChipA1Id ?? 0}_${r.bladeA1Id ?? 0}_${r.metalBladeA1Id ?? 0}_${r.overBladeA1Id ?? 0}_${r.assistBladeA1Id ?? 0}_${r.ratchetA1Id ?? 0}_${r.bitA1Id}`;
}

function finishDistFn(rounds: PlayerRound[]): FinishDist {
  if (rounds.length === 0) return {};
  const counts: Record<string, number> = {};
  for (const r of rounds) counts[r.finishType] = (counts[r.finishType] ?? 0) + 1;
  const result: FinishDist = {};
  for (const ft of FINISH_TYPES) {
    if (counts[ft]) result[ft] = { count: counts[ft], pct: Math.round((counts[ft] / rounds.length) * 100) };
  }
  return result;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlayerStatsContent() {
  const [catalog, setCatalog] = useState<PartsCatalog | null>(null);
  const [rounds, setRounds] = useState<PlayerRound[]>([]);
  const [games, setGames]   = useState<PlayerGame[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<"total" | "1v1" | "3v3">("total");
  const [historyPage, setHistoryPage] = useState(0);

  useEffect(() => {
    fetchParts().then(setCatalog).catch(() => {});
    fetchPlayerStats()
      .then((data) => { setRounds(data.rounds); setGames(data.games); })
      .catch(() => setError("Failed to load player stats."))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const rounds1v1 = rounds.filter((r) => r.match3v3Id === null);
  const rounds3v3 = rounds.filter((r) => r.match3v3Id !== null);

  function statsFor(rs: PlayerRound[]) {
    const wins = rs.filter((r) => r.win).length;
    const totalPoints = rs.reduce((acc, r) => {
      const pts = ROUND_POINTS[r.finishType] ?? 0;
      return acc + (r.win ? pts : -pts);
    }, 0);
    return {
      total: rs.length,
      wins,
      winRate: rs.length === 0 ? 0 : Math.round((wins / rs.length) * 100),
      totalPoints,
      winDist:  finishDistFn(rs.filter((r) => r.win)),
      loseDist: finishDistFn(rs.filter((r) => !r.win)),
    };
  }

  const stats = { total: statsFor(rounds), "1v1": statsFor(rounds1v1), "3v3": statsFor(rounds3v3) };

  const activeRounds  = activeTab === "1v1" ? rounds1v1 : activeTab === "3v3" ? rounds3v3 : rounds;
  const activeGames   = activeTab === "1v1" ? [] : games;
  const totalHistPages = Math.ceil(activeRounds.length / HISTORY_PAGE_SIZE);
  const historyRows    = activeRounds.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE);

  const uniqueGameIds: number[] = [];
  for (const r of activeRounds) {
    if (r.match3v3Id !== null && !uniqueGameIds.includes(r.match3v3Id)) uniqueGameIds.push(r.match3v3Id);
  }
  const gameNumberMap = new Map<number, number>();
  uniqueGameIds.forEach((id, i) => gameNumberMap.set(id, uniqueGameIds.length - i));
  const showGameCol = activeTab !== "1v1";

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Player Stats</h1>
          <p className="mt-1 text-sm text-neutral-500">Your overall performance across all beys</p>
        </div>

        {loading && <p className="text-sm text-neutral-500">Loading stats…</p>}
        {error   && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              {(["total", "1v1", "3v3"] as const).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setHistoryPage(0); }}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab ? "bg-blue-500 text-white" : "text-neutral-400 hover:text-white"
                  }`}>
                  {tab === "total" ? "Total" : tab}
                </button>
              ))}
            </div>

            {/* Stat panel */}
            {(() => {
              const s = stats[activeTab];
              const avgRound = s.total > 0 ? s.totalPoints / s.total : 0;
              const avgGame  = activeGames.length > 0 ? s.totalPoints / activeGames.length : null;
              const fmtPts   = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1).replace(".0", "");
              const ptColor  = (n: number) => n >= 0 ? "text-green-400" : "text-red-400";

              return (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">

                  {/* Rounds */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-neutral-500">Rounds</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <StatCard label="Total"    value={s.total} />
                      <StatCard label="Won"      value={s.wins} />
                      <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-800/40 p-3 sm:col-span-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Win Rate</p>
                        <p className="mt-1 text-2xl font-bold text-white">{s.winRate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Games */}
                  {activeTab !== "1v1" && (() => {
                    const gameWins = activeGames.filter((g) => g.yourScore > g.opponentScore).length;
                    return (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-neutral-500">Games</p>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          <StatCard label="Total" value={activeGames.length} />
                          <StatCard label="Won"   value={gameWins} />
                          <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-800/40 p-3 sm:col-span-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Win Rate</p>
                            <p className="mt-1 text-2xl font-bold text-white">
                              {activeGames.length === 0 ? 0 : Math.round((activeGames.filter(g => g.yourScore > g.opponentScore).length / activeGames.length) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Points +/- */}
                  {s.total > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-neutral-500">Points +/-</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Total</p>
                          <p className={`mt-1 text-2xl font-bold ${ptColor(s.totalPoints)}`}>
                            {s.totalPoints >= 0 ? "+" : ""}{s.totalPoints}
                          </p>
                        </div>
                        <div className={`rounded-lg border border-neutral-800 bg-neutral-800/40 p-3 ${activeTab === "1v1" || avgGame === null ? "col-span-2" : ""}`}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Avg / Round</p>
                          <p className={`mt-1 text-2xl font-bold ${ptColor(avgRound)}`}>{fmtPts(avgRound)}</p>
                        </div>
                        {activeTab !== "1v1" && avgGame !== null && (
                          <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Avg / Game</p>
                            <p className={`mt-1 text-2xl font-bold ${ptColor(avgGame)}`}>{fmtPts(avgGame)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bey leaderboard */}
                  {s.total > 0 && (() => {
                    type BeyEntry = { key: string; name: string; round: PlayerRound; count: number; points: number };
                    const map = new Map<string, BeyEntry>();
                    for (const r of activeRounds) {
                      const k    = beyKey(r);
                      const name = beyName(r, catalog);
                      if (name === "—") continue;
                      const e = map.get(k) ?? { key: k, name, round: r, count: 0, points: 0 };
                      const pts = ROUND_POINTS[r.finishType] ?? 0;
                      e.count  += 1;
                      e.points += r.win ? pts : -pts;
                      map.set(k, e);
                    }
                    const all = [...map.values()];
                    if (all.length < 2) return null;
                    const avg      = (e: BeyEntry) => e.points / e.count;
                    const cmpBest  = (a: BeyEntry, b: BeyEntry) => avg(b) !== avg(a) ? avg(b) - avg(a) : b.count - a.count;
                    const cmpWorst = (a: BeyEntry, b: BeyEntry) => avg(a) !== avg(b) ? avg(a) - avg(b) : b.count - a.count;
                    const byBest   = [...all].sort(cmpBest).slice(0, LEADERBOARD_SIZE);
                    const byWorst  = [...all].sort(cmpWorst).slice(0, LEADERBOARD_SIZE);
                    const fmtAvg   = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1).replace(".0", "");
                    const color    = (n: number) => n >= 0 ? "text-green-400" : "text-red-400";
                    const Row = ({ entry, rank }: { entry: BeyEntry; rank: number }) => (
                      <div className="flex items-center gap-3 py-2">
                        <span className="w-4 shrink-0 text-xs font-bold text-neutral-600">{rank}</span>
                        <Link href={beyUrl(entry.round)} className="min-w-0 flex-1 wrap-break-word text-sm text-neutral-300 hover:text-blue-400 transition-colors">
                          {entry.name}
                        </Link>
                        <span className="shrink-0 text-xs text-neutral-500">{entry.count}R</span>
                        <span className={`w-10 shrink-0 text-right text-sm font-semibold ${color(avg(entry))}`}>{fmtAvg(avg(entry))}</span>
                      </div>
                    );
                    return (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-semibold text-neutral-500">Best Beys</p>
                          <div className="divide-y divide-neutral-800/60">
                            {byBest.map((e, i) => <Row key={e.key} entry={e} rank={i + 1} />)}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-neutral-500">Worst Beys</p>
                          <div className="divide-y divide-neutral-800/60">
                            {byWorst.map((e, i) => <Row key={e.key} entry={e} rank={i + 1} />)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Finish distribution */}
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
                    <p className="text-sm text-neutral-600">No data yet.</p>
                  )}

                </div>
              );
            })()}

            {/* Match history */}
            {rounds.length > 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Match History</p>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-neutral-800">
                  {historyRows.map((r) => (
                    <div key={r.id} className="py-3 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${r.win ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                          {r.win ? "W" : "L"}
                        </span>
                        <Link href={beyUrl(r)} className="min-w-0 flex-1 truncate text-sm text-neutral-300 hover:text-blue-400 transition-colors">
                          {beyName(r, catalog)}
                        </Link>
                        <FinishTag ft={r.finishType} />
                      </div>
                      <p className="pl-9 text-xs text-neutral-500">
                        vs <Link href={oppUrl(r)} className="text-neutral-400 hover:text-blue-400 transition-colors">{oppName(r, catalog)}</Link>
                      </p>
                      <p className="pl-9 text-xs text-neutral-500">
                        {showGameCol && r.match3v3Id !== null && (
                          <>Game {gameNumberMap.get(r.match3v3Id)}<span className="mx-1">·</span></>
                        )}
                        {formatDate(r.createdAt)}<span className="mx-1">·</span>{r.match3v3Id !== null ? "3v3" : "1v1"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        {showGameCol && <th className="pb-2 pr-4">Game</th>}
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Your Bey</th>
                        <th className="pb-2 pr-4">Opponent</th>
                        <th className="pb-2 pr-4">Result</th>
                        <th className="pb-2">Finish</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {historyRows.map((r) => (
                        <tr key={r.id}>
                          {showGameCol && (
                            <td className="py-2 pr-4 text-xs text-neutral-500">
                              {r.match3v3Id !== null ? gameNumberMap.get(r.match3v3Id) : null}
                            </td>
                          )}
                          <td className="py-2 pr-4 text-xs text-neutral-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                          <td className="py-2 pr-4">
                            <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                              {r.match3v3Id !== null ? "3v3" : "1v1"}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <Link href={beyUrl(r)} className="text-neutral-300 hover:text-blue-400 transition-colors">
                              {beyName(r, catalog)}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">
                            <Link href={oppUrl(r)} className="text-neutral-300 hover:text-blue-400 transition-colors">
                              {oppName(r, catalog)}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${r.win ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                              {r.win ? "W" : "L"}
                            </span>
                          </td>
                          <td className="py-2"><FinishTag ft={r.finishType} /></td>
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
      </div>
    </main>
  );
}

import { apiURL } from "@/lib/api";

export type BeyStatRound = {
  id: number;
  createdAt: string;
  win: boolean;
  finishType: string;
  match3v3Id: number | null;
  oppBladeId: number | null;
  oppMetalBladeId: number | null;
  oppOverBladeId: number | null;
  oppAssistBladeId: number | null;
  oppLockChipId: number | null;
  oppRatchetId: number | null;
  oppBitId: number | null;
};

export type BeyStatGame = {
  id: number;
  createdAt: string;
  yourScore: number;
  opponentScore: number;
};

export type BeyStatsResponse = {
  rounds: BeyStatRound[];
  games: BeyStatGame[];
};

export async function fetchBeyStats(params: URLSearchParams): Promise<BeyStatsResponse> {
  const res = await fetch(apiURL(`/stats/bey?${params.toString()}`), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bey stats");
  return res.json();
}

// ── Frontend stat helpers ────────────────────────────────────────────────────

const FINISH_TYPES = ["Spin Finish", "Burst Finish", "Over Finish", "Extreme Finish"] as const;

export type FinishDist = Record<string, number>; // finish type → percentage (0–100)

export function winRate(rounds: BeyStatRound[]): number {
  if (rounds.length === 0) return 0;
  return Math.round((rounds.filter((r) => r.win).length / rounds.length) * 100);
}

export function finishDist(rounds: BeyStatRound[]): FinishDist {
  if (rounds.length === 0) return {};
  const counts: Record<string, number> = {};
  for (const r of rounds) counts[r.finishType] = (counts[r.finishType] ?? 0) + 1;
  const result: FinishDist = {};
  for (const ft of FINISH_TYPES) {
    if (counts[ft]) result[ft] = Math.round((counts[ft] / rounds.length) * 100);
  }
  return result;
}

export function gameWinRate(games: BeyStatGame[]): number {
  if (games.length === 0) return 0;
  return Math.round((games.filter((g) => g.yourScore > g.opponentScore).length / games.length) * 100);
}

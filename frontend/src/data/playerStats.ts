import { apiURL } from "@/lib/api";

export type PlayerRound = {
  id: number;
  createdAt: string;
  win: boolean;
  finishType: string;
  match3v3Id: number | null;
  bladeA1Id: number | null;       metalBladeA1Id: number | null;  overBladeA1Id: number | null;
  assistBladeA1Id: number | null; lockChipA1Id: number | null;    ratchetA1Id: number | null;
  bitA1Id: number;
  bladeB1Id: number | null;       metalBladeB1Id: number | null;  overBladeB1Id: number | null;
  assistBladeB1Id: number | null; lockChipB1Id: number | null;    ratchetB1Id: number | null;
  bitB1Id: number;
};

export type PlayerGame = {
  id: number;
  createdAt: string;
  yourScore: number;
  opponentScore: number;
  bladeA1Id: number | null;       metalBladeA1Id: number | null;  overBladeA1Id: number | null;
  assistBladeA1Id: number | null; lockChipA1Id: number | null;    ratchetA1Id: number | null;
  bitA1Id: number;
  bladeA2Id: number | null;       metalBladeA2Id: number | null;  overBladeA2Id: number | null;
  assistBladeA2Id: number | null; lockChipA2Id: number | null;    ratchetA2Id: number | null;
  bitA2Id: number;
  bladeA3Id: number | null;       metalBladeA3Id: number | null;  overBladeA3Id: number | null;
  assistBladeA3Id: number | null; lockChipA3Id: number | null;    ratchetA3Id: number | null;
  bitA3Id: number;
  bladeB1Id: number | null;       metalBladeB1Id: number | null;  overBladeB1Id: number | null;
  assistBladeB1Id: number | null; lockChipB1Id: number | null;    ratchetB1Id: number | null;
  bitB1Id: number;
  bladeB2Id: number | null;       metalBladeB2Id: number | null;  overBladeB2Id: number | null;
  assistBladeB2Id: number | null; lockChipB2Id: number | null;    ratchetB2Id: number | null;
  bitB2Id: number;
  bladeB3Id: number | null;       metalBladeB3Id: number | null;  overBladeB3Id: number | null;
  assistBladeB3Id: number | null; lockChipB3Id: number | null;    ratchetB3Id: number | null;
  bitB3Id: number;
};

export type PlayerStatsResponse = {
  rounds: PlayerRound[];
  games: PlayerGame[];
};

export async function fetchPlayerStats(): Promise<PlayerStatsResponse> {
  const res = await fetch(apiURL("/stats/player"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch player stats");
  return res.json();
}

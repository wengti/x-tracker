import { apiURL } from "@/lib/api";

export type SavedBey = {
  id: number;
  isCX: boolean;
  blade: string;       bladeImage: string;
  metalBlade: string;  metalBladeImage: string;
  overBlade: string;   overBladeImage: string;
  assistBlade: string; assistBladeImage: string;
  lockChip: string;    lockChipImage: string;
  ratchet: string;     ratchetImage: string;
  bit: string;         bitImage: string;
};

export function savedBeyName(bey: SavedBey): string {
  const parts = bey.isCX
    ? [bey.lockChip, bey.metalBlade, bey.overBlade, bey.assistBlade, bey.ratchet, bey.bit]
    : [bey.blade, bey.ratchet, bey.bit];
  return parts.filter(Boolean).join(" ") || "Unnamed Bey";
}

let cache: SavedBey[] | null = null;

export async function fetchSavedBeys(): Promise<SavedBey[]> {
  if (cache) return cache;
  const res = await fetch(apiURL("/profile/beys"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch saved beys");
  cache = await res.json();
  return cache!;
}

export function invalidateSavedBeysCache(): void {
  cache = null;
}

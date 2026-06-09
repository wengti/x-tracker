import { apiURL } from "@/lib/api";

export type Part = {
  id: number;
  name: string;
  imageUrl: string;
};

export type PartsCatalog = {
  blade: Part[];
  bit: Part[];
  ratchet: Part[];
  lock_chip: Part[];
  metal_blade: Part[];
  assist_blade: Part[];
  over_blade: Part[];
};

type RawPart = { id: number; name: string; image_url: string };
type RawCatalog = Record<string, RawPart[]>;

let cache: PartsCatalog | null = null;

function toParts(arr: RawPart[] = []): Part[] {
  return arr.map(({ id, name, image_url }) => ({ id, name, imageUrl: image_url }));
}

export function clearPartsCache(): void { cache = null; }

export async function fetchParts(): Promise<PartsCatalog> {
  if (cache) return cache;
  const res = await fetch(apiURL("/parts"));
  if (!res.ok) throw new Error("Failed to fetch parts");
  const raw: RawCatalog = await res.json();
  cache = {
    blade:        toParts(raw.blade),
    bit:          toParts(raw.bit),
    ratchet:      toParts(raw.ratchet),
    lock_chip:    toParts(raw.lock_chip),
    metal_blade:  toParts(raw.metal_blade),
    assist_blade: toParts(raw.assist_blade),
    over_blade:   toParts(raw.over_blade),
  };
  return cache;
}

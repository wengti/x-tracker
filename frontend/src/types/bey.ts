export type BeySetup = {
  isCX: boolean;
  // CX-only parts
  lockChip: string;
  metalBlade: string;
  assistBlade: string;
  overBlade: string;
  // Non-CX only
  blade: string;
  // Shared
  ratchet: string;
  bit: string;
};

export function getBeyName(setup: BeySetup): string {
  const parts = setup.isCX
    ? [setup.lockChip, setup.metalBlade, setup.overBlade, setup.assistBlade, setup.ratchet, setup.bit]
    : [setup.blade, setup.ratchet, setup.bit];
  return parts.filter(Boolean).join(" ") || "Not configured";
}

// Returns "field:value" strings for parts that appear in more than one setup.
// Ratchet and bit are always checked; blade vs CX parts depend on setup type.
export function findDuplicateParts(setups: BeySetup[]): Set<string> {
  const counts = new Map<string, number>();
  for (const setup of setups) {
    const entries: [keyof BeySetup, string][] = [
      ["ratchet", setup.ratchet],
      ["bit", setup.bit],
      ...(setup.isCX
        ? ([
            ["lockChip", setup.lockChip],
            ["metalBlade", setup.metalBlade],
            ["assistBlade", setup.assistBlade],
            ["overBlade", setup.overBlade],
          ] as [keyof BeySetup, string][])
        : ([["blade", setup.blade]] as [keyof BeySetup, string][])),
    ];
    for (const [field, value] of entries) {
      if (!value) continue;
      const key = `${field}:${value}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
}

export const DEFAULT_BEY_SETUP: BeySetup = {
  isCX: false,
  lockChip: "",
  metalBlade: "",
  assistBlade: "",
  overBlade: "",
  blade: "",
  ratchet: "",
  bit: "",
};

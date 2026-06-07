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

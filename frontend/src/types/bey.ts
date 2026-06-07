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

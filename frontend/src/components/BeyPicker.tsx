'use client'

import { getBeyName, type BeySetup } from "@/types/bey";

type Props = {
  label: string;
  setups: BeySetup[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function BeyPicker({ label, setups, selectedIndex, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="space-y-1.5">
        {setups.map((setup, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-800/60"
          >
            <input
              type="radio"
              name={label}
              checked={selectedIndex === i}
              onChange={() => onSelect(i)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-blue-500"
            />
            <span className="text-sm text-neutral-300">{getBeyName(setup)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

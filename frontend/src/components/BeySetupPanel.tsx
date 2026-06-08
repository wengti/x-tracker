'use client'

import { useState } from "react";
import type { BeySetup } from "@/types/bey";
import PartSelector from "./PartSelector";
import {
  BLADES, BITS, RATCHETS,
  LOCK_CHIPS, METAL_BLADES, ASSIST_BLADES, OVER_BLADES,
} from "@/data/parts";

type Props = {
  label: string;
  setup: BeySetup;
  onSetupChange: (setup: BeySetup) => void;
  duplicateParts?: Set<string>;
};

const FIELD_LABELS: Partial<Record<keyof BeySetup, string>> = {
  blade: "Blade",
  ratchet: "Ratchet",
  bit: "Bit",
  lockChip: "Lock Chip",
  metalBlade: "Metal Blade",
  assistBlade: "Assist Blade",
  overBlade: "Over Blade",
};

function getDuplicatedLabels(setup: BeySetup, duplicateParts: Set<string>): string[] {
  const fields: (keyof BeySetup)[] = setup.isCX
    ? ["lockChip", "metalBlade", "assistBlade", "overBlade", "ratchet", "bit"]
    : ["blade", "ratchet", "bit"];
  return fields
    .filter((f) => setup[f] && duplicateParts.has(`${f}:${setup[f]}`))
    .map((f) => FIELD_LABELS[f]!);
}

export default function BeySetupPanel({ label, setup, onSetupChange, duplicateParts }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const duplicatedLabels = duplicateParts ? getDuplicatedLabels(setup, duplicateParts) : [];
  const hasDuplicates = duplicatedLabels.length > 0;

  function update<K extends keyof BeySetup>(field: K, value: BeySetup[K]) {
    onSetupChange({ ...setup, [field]: value });
  }

  const summaryParts = setup.isCX
    ? [setup.lockChip, setup.metalBlade, setup.overBlade, setup.assistBlade, setup.ratchet, setup.bit]
    : [setup.blade, setup.ratchet, setup.bit];
  const summary = summaryParts.filter(Boolean).join(" ") || "Not configured";

  return (
    <div className={`rounded-xl border bg-neutral-900 ${hasDuplicates ? "border-amber-600/60" : "border-neutral-800"}`}>

      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-800/50 ${
          isOpen ? "rounded-t-xl" : "rounded-xl"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {!isOpen && (
            <p className={`mt-0.5 text-xs ${hasDuplicates ? "text-amber-500" : "text-neutral-500"}`}>
              {hasDuplicates ? `Duplicate: ${duplicatedLabels.join(", ")}` : summary}
            </p>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="space-y-4 border-t border-neutral-800 px-4 py-4">

          {hasDuplicates && (
            <p className="text-xs text-amber-500">
              Duplicate parts detected: {duplicatedLabels.join(", ")}
            </p>
          )}

          {/* isCX toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Is CX?
            </span>
            <Toggle isOn={setup.isCX} onToggle={() => update("isCX", !setup.isCX)} />
          </div>

          {/* Part selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {setup.isCX ? (
              <>
                <PartSelector label="Lock Chip"    options={LOCK_CHIPS}    value={setup.lockChip}    onChange={(v) => update("lockChip", v)}    />
                <PartSelector label="Metal Blade"  options={METAL_BLADES}  value={setup.metalBlade}  onChange={(v) => update("metalBlade", v)}  />
                <PartSelector label="Assist Blade" options={ASSIST_BLADES} value={setup.assistBlade} onChange={(v) => update("assistBlade", v)} />
                <PartSelector label="Over Blade"   options={OVER_BLADES}   value={setup.overBlade}   onChange={(v) => update("overBlade", v)}   />
                <PartSelector label="Ratchet"      options={RATCHETS}      value={setup.ratchet}     onChange={(v) => update("ratchet", v)}     />
                <PartSelector label="Bit"          options={BITS}          value={setup.bit}         onChange={(v) => update("bit", v)}         />
              </>
            ) : (
              <>
                <PartSelector label="Blade"   options={BLADES}   value={setup.blade}   onChange={(v) => update("blade", v)}   />
                <PartSelector label="Ratchet" options={RATCHETS} value={setup.ratchet} onChange={(v) => update("ratchet", v)} />
                <PartSelector label="Bit"     options={BITS}     value={setup.bit}     onChange={(v) => update("bit", v)}     />
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isOn}
      className={`flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        isOn ? "bg-blue-500" : "bg-neutral-600"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
          isOn ? "translate-x-3" : "translate-x-0"
        }`}
      />
    </button>
  );
}

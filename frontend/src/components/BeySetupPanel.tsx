'use client'

import { useState, useEffect, useRef } from "react";
import { type BeySetup, DEFAULT_BEY_SETUP } from "@/types/bey";
import PartSelector from "./PartSelector";
import { fetchParts, type Part } from "@/data/parts";
import { fetchSavedBeys, savedBeyName, refreshSavedBeysCache, type SavedBey } from "@/data/savedBeys";

type Parts = {
  blades: Part[];
  bits: Part[];
  ratchets: Part[];
  lockChips: Part[];
  metalBlades: Part[];
  assistBlades: Part[];
  overBlades: Part[];
};

const EMPTY: Parts = {
  blades: [], bits: [], ratchets: [],
  lockChips: [], metalBlades: [], assistBlades: [], overBlades: [],
};

type Props = {
  label: string;
  setup: BeySetup;
  onSetupChange: (setup: BeySetup) => void;
  duplicateParts?: Set<string>;
  collapsible?: boolean;
  enableSavedBeys?: boolean;
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

export default function BeySetupPanel({ label, setup, onSetupChange, duplicateParts, collapsible = true, enableSavedBeys = false }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [parts, setParts] = useState<Parts>(EMPTY);
  const [savedBeys, setSavedBeys] = useState<SavedBey[]>([]);
  const [beyQuery, setBeyQuery] = useState("");
  const [beyOpen, setBeyOpen] = useState(false);
  const [savedBeysLoading, setSavedBeysLoading] = useState(false);
  const beyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchParts()
      .then((c) => setParts({
        blades:       c.blade,
        bits:         c.bit,
        ratchets:     c.ratchet,
        lockChips:    c.lock_chip,
        metalBlades:  c.metal_blade,
        assistBlades: c.assist_blade,
        overBlades:   c.over_blade,
      }))
      .catch(console.error);
  }, []);

  async function loadSavedBeys(forceRefresh = false) {
    setSavedBeysLoading(true);
    try {
      const data = forceRefresh ? await refreshSavedBeysCache() : await fetchSavedBeys();
      setSavedBeys(data);
    } catch {
      // silently fail — user can retry with the refresh button
    } finally {
      setSavedBeysLoading(false);
    }
  }

  useEffect(() => {
    if (!enableSavedBeys) return;
    loadSavedBeys();
  }, [enableSavedBeys]);

  useEffect(() => {
    if (!enableSavedBeys) return;
    function handleClickOutside(e: MouseEvent) {
      if (beyContainerRef.current && !beyContainerRef.current.contains(e.target as Node)) {
        setBeyOpen(false);
        setBeyQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [enableSavedBeys]);

  const duplicatedLabels = duplicateParts ? getDuplicatedLabels(setup, duplicateParts) : [];
  const hasDuplicates = duplicatedLabels.length > 0;

  function update<K extends keyof BeySetup>(field: K, value: BeySetup[K]) {
    onSetupChange({ ...setup, [field]: value });
  }

  const summaryParts = setup.isCX
    ? [setup.lockChip, setup.metalBlade, setup.overBlade, setup.assistBlade, setup.ratchet, setup.bit]
    : [setup.blade, setup.ratchet, setup.bit];
  const summary = summaryParts.filter(Boolean).join(" ") || "Not configured";

  const filteredSavedBeys = savedBeys.filter((b) =>
    savedBeyName(b).toLowerCase().includes(beyQuery.toLowerCase())
  );

  const content = (
    <div className="space-y-4 px-4 py-4">

      {enableSavedBeys && (
        <div ref={beyContainerRef} className="relative">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Load Saved Bey
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={beyQuery}
              onChange={(e) => { setBeyQuery(e.target.value); setBeyOpen(true); }}
              onFocus={() => setBeyOpen(true)}
              placeholder="Select a saved bey…"
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => loadSavedBeys(true)}
              disabled={savedBeysLoading}
              aria-label="Refresh saved beys"
              className="rounded-lg border border-neutral-700 p-2 text-neutral-500 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                className={`h-4 w-4 ${savedBeysLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {beyOpen && (
            <ul className="scrollbar-blue absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
              {filteredSavedBeys.length > 0 ? (
                filteredSavedBeys.map((bey) => (
                  <li key={bey.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        onSetupChange({
                          isCX: bey.isCX,
                          blade: bey.blade,
                          lockChip: bey.lockChip,
                          metalBlade: bey.metalBlade,
                          assistBlade: bey.assistBlade,
                          overBlade: bey.overBlade,
                          ratchet: bey.ratchet,
                          bit: bey.bit,
                        });
                        setBeyQuery("");
                        setBeyOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                      {savedBeyName(bey)}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-neutral-600">
                  {savedBeys.length === 0 ? "No saved beys" : "No matches"}
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {hasDuplicates && (
        <p className="text-xs text-amber-500">
          Duplicate parts detected: {duplicatedLabels.join(", ")}
        </p>
      )}

      {/* isCX toggle + Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Is CX?
          </span>
          <Toggle isOn={setup.isCX} onToggle={() => {
            if (!setup.isCX) {
              onSetupChange({ ...setup, isCX: true, blade: "" });
            } else {
              onSetupChange({ ...setup, isCX: false, lockChip: "", metalBlade: "", assistBlade: "", overBlade: "" });
            }
          }} />
        </div>
        <button
          type="button"
          onClick={() => onSetupChange(DEFAULT_BEY_SETUP)}
          className="text-xs text-neutral-500 transition-colors hover:text-white"
        >
          Clear
        </button>
      </div>

      {/* Part selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {setup.isCX ? (
          <>
            <PartSelector label="Lock Chip"    options={parts.lockChips}    value={setup.lockChip}    onChange={(v) => update("lockChip", v)}    />
            <PartSelector label="Metal Blade"  options={parts.metalBlades}  value={setup.metalBlade}  onChange={(v) => update("metalBlade", v)}  />
            <PartSelector label="Assist Blade" options={parts.assistBlades} value={setup.assistBlade} onChange={(v) => update("assistBlade", v)} />
            <PartSelector label="Over Blade"   options={parts.overBlades}   value={setup.overBlade}   onChange={(v) => update("overBlade", v)}   />
            <PartSelector label="Ratchet"      options={parts.ratchets}     value={setup.ratchet}     onChange={(v) => update("ratchet", v)}     />
            <PartSelector label="Bit"          options={parts.bits}         value={setup.bit}         onChange={(v) => update("bit", v)}         />
          </>
        ) : (
          <>
            <PartSelector label="Blade"   options={parts.blades}   value={setup.blade}   onChange={(v) => update("blade", v)}   />
            <PartSelector label="Ratchet" options={parts.ratchets} value={setup.ratchet} onChange={(v) => update("ratchet", v)} />
            <PartSelector label="Bit"     options={parts.bits}     value={setup.bit}     onChange={(v) => update("bit", v)}     />
          </>
        )}
      </div>

    </div>
  );

  if (!collapsible) {
    return (
      <div className={`rounded-xl border bg-neutral-900 ${hasDuplicates ? "border-amber-600/60" : "border-neutral-800"}`}>
        <p className="px-4 pt-4 text-sm font-semibold text-white">{label}</p>
        {content}
      </div>
    );
  }

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
        <div className="border-t border-neutral-800">
          {content}
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

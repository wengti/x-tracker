'use client'

import { useState } from "react";
import BeySetupPanel from "@/components/BeySetupPanel";
import { type BeySetup, DEFAULT_BEY_SETUP, getBeyName } from "@/types/bey";
import { fetchParts, type Part } from "@/data/parts";
import { apiURL } from "@/lib/api";

function partId(list: Part[], name: string): number | null {
  return name ? (list.find((p) => p.name === name)?.id ?? null) : null;
}

export default function SaveNewBeySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [setup, setSetup] = useState<BeySetup>(DEFAULT_BEY_SETUP);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const beyName = getBeyName(setup);
  const isEmpty = beyName === "Not configured";

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const catalog = await fetchParts();
      const body = {
        blade_id:        partId(catalog.blade,        setup.blade),
        metal_blade_id:  partId(catalog.metal_blade,  setup.metalBlade),
        over_blade_id:   partId(catalog.over_blade,   setup.overBlade),
        assist_blade_id: partId(catalog.assist_blade, setup.assistBlade),
        lock_chip_id:    partId(catalog.lock_chip,    setup.lockChip),
        ratchet_id:      partId(catalog.ratchet,      setup.ratchet),
        bit_id:          partId(catalog.bit,          setup.bit),
      };

      const res = await fetch(apiURL("/profile/bey"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save.");
        return;
      }

      setSetup(DEFAULT_BEY_SETUP);
    } catch {
      setSaveError("Unable to reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setSetup(DEFAULT_BEY_SETUP);
    setSaveError(null);
  }

  return (
    <div className={`rounded-xl border bg-neutral-900 ${isOpen ? "border-neutral-700" : "border-neutral-800"}`}>

      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-800/50 ${
          isOpen ? "rounded-t-xl" : "rounded-xl"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-white">Save New Bey</p>
          {!isOpen && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {isEmpty ? "No bey saved yet" : beyName}
            </p>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
          <BeySetupPanel label="Bey Setup" setup={setup} onSetupChange={setSetup} collapsible={false} />

          {saveError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {saveError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isEmpty || isSaving}
              className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-all hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleClear}
              disabled={isEmpty}
              className="flex-1 rounded-xl border border-neutral-700 py-3 font-semibold text-neutral-300 transition-all hover:border-neutral-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

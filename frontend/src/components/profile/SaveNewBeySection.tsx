'use client'

import { useState } from "react";
import BeySetupPanel from "@/components/BeySetupPanel";
import { type BeySetup, DEFAULT_BEY_SETUP, getBeyName } from "@/types/bey";

export default function SaveNewBeySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [setup, setSetup] = useState<BeySetup>(DEFAULT_BEY_SETUP);

  const beyName = getBeyName(setup);
  const isEmpty = beyName === "Not configured";

  function handleSave() {
    // TODO: PUT /profile/bey
  }

  function handleClear() {
    setSetup(DEFAULT_BEY_SETUP);
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

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isEmpty}
              className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-all hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Save
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

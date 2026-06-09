'use client'

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchParts, type Part } from "@/data/parts";

type ResolvedPart = { name: string; imageUrl: string } | null;

type Setup = {
  blade:       ResolvedPart;
  metalBlade:  ResolvedPart;
  overBlade:   ResolvedPart;
  assistBlade: ResolvedPart;
  lockChip:    ResolvedPart;
  ratchet:     ResolvedPart;
  bit:         ResolvedPart;
};

function findById(list: Part[], id: string | null): ResolvedPart {
  if (!id) return null;
  const p = list.find((p) => p.id === Number(id));
  return p ? { name: p.name, imageUrl: p.imageUrl } : null;
}

function PartChip({ part }: { part: ResolvedPart }) {
  if (!part) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2">
      {part.imageUrl && (
        <img src={part.imageUrl} alt={part.name} className="h-8 w-8 object-contain" />
      )}
      <span className="text-xs text-neutral-300">{part.name}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function BeyStatsContent() {
  const params = useSearchParams();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bladeId       = params.get("blade_id");
    const metalBladeId  = params.get("metal_blade_id");
    const overBladeId   = params.get("over_blade_id");
    const assistBladeId = params.get("assist_blade_id");
    const lockChipId    = params.get("lock_chip_id");
    const ratchetId     = params.get("ratchet_id");
    const bitId         = params.get("bit_id");

    if (!bladeId && !lockChipId && !bitId) {
      setSetup(null);
      return;
    }

    setLoading(true);
    fetchParts()
      .then((catalog) => {
        setSetup({
          blade:       findById(catalog.blade,        bladeId),
          metalBlade:  findById(catalog.metal_blade,  metalBladeId),
          overBlade:   findById(catalog.over_blade,   overBladeId),
          assistBlade: findById(catalog.assist_blade, assistBladeId),
          lockChip:    findById(catalog.lock_chip,    lockChipId),
          ratchet:     findById(catalog.ratchet,      ratchetId),
          bit:         findById(catalog.bit,          bitId),
        });
      })
      .catch(() => setSetup(null))
      .finally(() => setLoading(false));
  }, [params]);

  const parts = setup
    ? [setup.blade, setup.lockChip, setup.metalBlade, setup.overBlade, setup.assistBlade, setup.ratchet, setup.bit]
    : [];
  const hasAnyPart = parts.some(Boolean);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bey Stats</h1>
          <p className="mt-1 text-sm text-neutral-500">View performance stats for a bey setup</p>
        </div>

        {/* Search bar — coming soon */}

        {/* Selected setup */}
        {loading && (
          <p className="text-sm text-neutral-500">Loading…</p>
        )}

        {!loading && setup && !hasAnyPart && (
          <p className="text-sm text-neutral-500">No results found.</p>
        )}

        {!loading && hasAnyPart && (
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Setup</p>
            <div className="flex flex-wrap gap-2">
              {parts.map((p, i) => <PartChip key={i} part={p} />)}
            </div>
          </div>
        )}

        {/* Stats — coming soon */}
        {!loading && hasAnyPart && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stats</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Total Matches" value="—" />
              <StatCard label="Win Rate"      value="—" />
              <StatCard label="Burst Rate"    value="—" />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

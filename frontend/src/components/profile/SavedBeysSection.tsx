'use client'

import { useState } from "react";
import { apiURL } from "@/lib/api";

type SavedBey = {
  id: number;
  isCX: boolean;
  blade: string;       bladeImage: string;
  metalBlade: string;  metalBladeImage: string;
  overBlade: string;   overBladeImage: string;
  assistBlade: string; assistBladeImage: string;
  lockChip: string;    lockChipImage: string;
  ratchet: string;     ratchetImage: string;
  bit: string;         bitImage: string;
};

const PAGE_SIZE = 5;

function beyName(bey: SavedBey): string {
  const parts = bey.isCX
    ? [bey.lockChip, bey.metalBlade, bey.overBlade, bey.assistBlade, bey.ratchet, bey.bit]
    : [bey.blade, bey.ratchet, bey.bit];
  return parts.filter(Boolean).join(" ") || "Unnamed Bey";
}

function PartChip({ name, imageUrl }: { name: string; imageUrl: string }) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2">
      {imageUrl && (
        <img src={imageUrl} alt={name} className="h-8 w-8 object-contain" />
      )}
      <span className="text-xs text-neutral-300">{name}</span>
    </div>
  );
}

export default function SavedBeysSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [beys, setBeys] = useState<SavedBey[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadBeys() {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(apiURL("/profile/beys"), { credentials: "include" });
      if (!res.ok) {
        setFetchError("Failed to load saved beys.");
        return;
      }
      const data: SavedBey[] = await res.json();
      setBeys(data);
    } catch {
      setFetchError("Unable to reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) loadBeys();
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(apiURL(`/profile/bey/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setFetchError(data.error ?? "Failed to delete bey.");
        return;
      }
      const updated = beys.filter((b) => b.id !== id);
      setBeys(updated);
      // If deletion emptied the current page, step back one
      const newTotalPages = Math.ceil(updated.length / PAGE_SIZE);
      if (page >= newTotalPages && page > 0) setPage((p) => p - 1);
    } catch {
      setFetchError("Unable to reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.ceil(beys.length / PAGE_SIZE);
  const pageBeys = beys.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className={`rounded-xl border bg-neutral-900 ${isOpen ? "border-neutral-700" : "border-neutral-800"}`}>

      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-800/50 ${
          isOpen ? "rounded-t-xl" : "rounded-xl"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-white">My Saved Beys</p>
          {!isOpen && (
            <p className="mt-0.5 text-xs text-neutral-500">View your saved setups</p>
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
        <div className="border-t border-neutral-800 px-4 py-4">

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={loadBeys}
              disabled={isLoading}
              aria-label="Refresh"
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {fetchError && (
            <p className="text-sm text-red-400">{fetchError}</p>
          )}

          {!isLoading && !fetchError && beys.length === 0 && (
            <p className="text-sm text-neutral-500">No beys saved yet.</p>
          )}

          {pageBeys.length > 0 && (
            <div className="space-y-3">

              {pageBeys.map((bey) => (
                <div key={bey.id} className="rounded-xl border border-neutral-700 bg-neutral-800/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{beyName(bey)}</p>
                    <button
                      type="button"
                      onClick={() => handleDelete(bey.id)}
                      disabled={deletingId === bey.id}
                      aria-label="Delete bey"
                      className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <svg
                        className={`h-4 w-4 ${deletingId === bey.id ? "animate-spin" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        {deletingId === bey.id
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        }
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <PartChip name={bey.blade}       imageUrl={bey.bladeImage}       />
                    <PartChip name={bey.lockChip}    imageUrl={bey.lockChipImage}    />
                    <PartChip name={bey.metalBlade}  imageUrl={bey.metalBladeImage}  />
                    <PartChip name={bey.overBlade}   imageUrl={bey.overBladeImage}   />
                    <PartChip name={bey.assistBlade} imageUrl={bey.assistBladeImage} />
                    <PartChip name={bey.ratchet}     imageUrl={bey.ratchetImage}     />
                    <PartChip name={bey.bit}         imageUrl={bey.bitImage}         />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-neutral-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
}

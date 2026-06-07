'use client'

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Part } from "@/data/parts";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Part[];
};

export default function PartSelector({ label, value, onChange, options }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectedPart = options.find((p) => p.name === value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  return (
    <div className="flex items-start gap-3">
      {/* Part image */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
        {selectedPart?.imageUrl ? (
          <Image
            src={selectedPart.imageUrl}
            alt={selectedPart.name}
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        ) : (
          <span className="text-lg text-neutral-700">?</span>
        )}
      </div>

      {/* Combobox */}
      <div ref={containerRef} className="relative min-w-0 flex-1">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Select or type…"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-blue-500 focus:outline-none"
        />
        {open && (
          <ul className="scrollbar-blue absolute left-0 top-full z-10 mt-1 max-h-48 min-w-full w-max overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
            {filtered.length > 0 ? (
              filtered.map((part) => (
                <li key={part.name}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      onChange(part.name);
                      setQuery(part.name);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  >
                    {part.imageUrl && (
                      <div className="relative h-5 w-5 shrink-0">
                        <Image
                          src={part.imageUrl}
                          alt={part.name}
                          fill
                          sizes="20px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="whitespace-nowrap">{part.name}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-neutral-600">No options found</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

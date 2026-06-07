const FINISHES = [
  {
    label: "Spin Finish",
    points: 1,
    style: "border-blue-700/60 text-blue-400 hover:bg-blue-950/60 hover:border-blue-500",
  },
  {
    label: "Burst Finish",
    points: 2,
    style: "border-red-700/60 text-red-400 hover:bg-red-950/60 hover:border-red-500",
  },
  {
    label: "Over Finish",
    points: 2,
    style: "border-amber-700/60 text-amber-400 hover:bg-amber-950/60 hover:border-amber-500",
  },
  {
    label: "Extreme Finish",
    points: 3,
    style: "border-violet-700/60 text-violet-400 hover:bg-violet-950/60 hover:border-violet-500",
  },
] as const;

type Props = {
  side: "you" | "opponent";
  onFinish: (points: number) => void;
  disabled?: boolean;
};

export default function FinishButtons({ side, onFinish, disabled = false }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">
        {side === "you" ? "Your Finishes" : "Opponent Finishes"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FINISHES.map(({ label, points, style }) => (
          <button
            key={label}
            disabled={disabled}
            onClick={() => onFinish(points)}
            className={`flex flex-col justify-center items-center gap-1 rounded-xl border bg-neutral-900 px-3 py-4 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${style}`}
          >
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs font-bold opacity-60">+{points}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

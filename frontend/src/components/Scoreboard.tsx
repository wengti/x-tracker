type Props = {
  youScore: number;
  opponentScore: number;
};

export default function Scoreboard({ youScore, opponentScore }: Props) {
  const youLeading = youScore > opponentScore;
  const oppLeading = opponentScore > youScore;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      <ScorePanel label="You" score={youScore} highlight={youLeading} />
      <span className="text-base font-bold text-neutral-700 sm:text-xl">vs</span>
      <ScorePanel label="Opponent" score={opponentScore} highlight={oppLeading} />
    </div>
  );
}

function ScorePanel({
  label,
  score,
  highlight,
}: {
  label: string;
  score: number;
  highlight: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-3 py-6 transition-all duration-300 sm:gap-3 sm:px-8 sm:py-10 ${
        highlight
          ? "border-blue-500/50 bg-blue-950/20 shadow-lg shadow-blue-500/10"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span
        className={`text-6xl font-black tabular-nums leading-none transition-colors duration-300 sm:text-9xl ${
          highlight ? "text-blue-300" : "text-white"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

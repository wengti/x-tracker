'use client'

type Props = {
  youScore: number;
  opponentScore: number;
  isYourFriend: boolean;
  onToggleYourFriend: () => void;
  youBeyName?: string;
  opponentBeyName?: string;
};

export default function Scoreboard({
  youScore,
  opponentScore,
  isYourFriend,
  onToggleYourFriend,
  youBeyName,
  opponentBeyName,
}: Props) {
  const youLeading = youScore > opponentScore;
  const oppLeading = opponentScore > youScore;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      <ScorePanel
        label={isYourFriend ? "Your Friend" : "You"}
        score={youScore}
        highlight={youLeading}
        beyName={youBeyName}
        toggle={<Toggle isOn={isYourFriend} onToggle={onToggleYourFriend} />}
      />
      <span className="text-base font-bold text-neutral-700 sm:text-xl">vs</span>
      <ScorePanel label="Opponent" score={opponentScore} highlight={oppLeading} beyName={opponentBeyName} />
    </div>
  );
}

function ScorePanel({
  label,
  score,
  highlight,
  beyName,
  toggle,
}: {
  label: string;
  score: number;
  highlight: boolean;
  beyName?: string;
  toggle?: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-3 py-6 transition-all duration-300 sm:gap-3 sm:px-8 sm:py-10 ${
        highlight
          ? "border-blue-500/50 bg-blue-950/20 shadow-lg shadow-blue-500/10"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {toggle}
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {label}
        </span>
      </div>
      <span
        className={`text-6xl font-black tabular-nums leading-none transition-colors duration-300 sm:text-9xl ${
          highlight ? "text-blue-300" : "text-white"
        }`}
      >
        {score}
      </span>
      {beyName && (
        <span className="text-center text-xs text-neutral-500">
          {beyName}
        </span>
      )}
    </div>
  );
}

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle between You and Your Friend"
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

import { Suspense } from "react";
import BeyStatsContent from "@/components/bey-stats/BeyStatsContent";

export default function BeyStatsPage() {
  return (
    <Suspense>
      <BeyStatsContent />
    </Suspense>
  );
}

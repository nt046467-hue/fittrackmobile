"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFitTrackStore, type SetInput } from "@/store/fittrackStore";
import { cn } from "@/lib/utils";

interface SetRowProps {
  setNumber: number;
  set: SetInput;
  onChange: (updated: SetInput) => void;
  previousWeight?: number;
  previousReps?: number;
}

export default function SetRow({
  setNumber,
  set,
  onChange,
  previousWeight,
  previousReps,
}: SetRowProps) {
  const { unitSystem } = useFitTrackStore();
  const unit = unitSystem === "metric" ? "kg" : "lbs";

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_1fr_1fr_36px] items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
        set.completed && "bg-accent-green/5"
      )}
    >
      {/* Set Number */}
      <span
        className={cn(
          "text-xs font-bold tabular-nums",
          set.completed ? "text-accent-green" : "text-muted-foreground"
        )}
      >
        {setNumber}
      </span>

      {/* Previous */}
      <span className="text-xs text-muted-foreground tabular-nums truncate">
        {previousWeight !== undefined
          ? `${previousWeight}${unit} × ${previousReps}`
          : "—"}
      </span>

      {/* Weight */}
      <Input
        type="number"
        placeholder="0"
        value={set.weight || ""}
        onChange={(e) =>
          onChange({ ...set, weight: parseFloat(e.target.value) || 0 })
        }
        className="h-8 text-sm tabular-nums text-center"
        min={0}
        step={unitSystem === "metric" ? 0.5 : 1}
      />

      {/* Reps */}
      <Input
        type="number"
        placeholder="0"
        value={set.reps || ""}
        onChange={(e) =>
          onChange({ ...set, reps: parseInt(e.target.value) || 0 })
        }
        className="h-8 text-sm tabular-nums text-center"
        min={0}
      />

      {/* Complete Checkbox */}
      <Checkbox
        checked={set.completed}
        onCheckedChange={(checked) =>
          onChange({ ...set, completed: checked === true })
        }
        className={cn(
          "h-5 w-5 rounded-full data-[state=checked]:bg-accent-green data-[state=checked]:border-accent-green"
        )}
      />
    </div>
  );
}

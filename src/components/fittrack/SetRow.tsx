"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useFitTrackStore, type SetInput } from "@/store/fittrackStore";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SetRowProps {
  setNumber: number;
  set: SetInput;
  onChange: (updated: SetInput) => void;
  previousWeight?: number;
  previousReps?: number;
  onSetComplete?: (setIndex: number, completed: boolean) => void;
}

export default function SetRow({
  setNumber,
  set,
  onChange,
  previousWeight,
  previousReps,
  onSetComplete,
}: SetRowProps) {
  const { unitSystem } = useFitTrackStore();
  const unit = unitSystem === "metric" ? "kg" : "lbs";
  const [flashGreen, setFlashGreen] = useState(false);

  const handleCheck = () => {
    const newCompleted = !set.completed;
    onChange({ ...set, completed: newCompleted });

    if (newCompleted) {
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 300);
      onSetComplete?.(setNumber - 1, newCompleted);  // Pass values directly to avoid stale state
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_1fr_1fr_40px] items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
        set.completed && "bg-accent-green/5",
        flashGreen && "bg-accent-green/20"
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

      {/* Complete Checkmark — Large 40×40px animated button */}
      <motion.button
        type="button"
        onClick={handleCheck}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
          set.completed
            ? "bg-accent-green"
            : "border-2 border-muted-foreground/30 hover:border-accent-green/50"
        )}
        animate={
          set.completed
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={
          set.completed
            ? { duration: 0.3, ease: "easeOut" }
            : { duration: 0 }
        }
        whileTap={{ scale: 0.9 }}
      >
        {set.completed ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <Check className="w-4 h-4 text-muted-foreground/30" strokeWidth={2} />
        )}
      </motion.button>
    </div>
  );
}

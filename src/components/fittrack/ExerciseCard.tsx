"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2, Check, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type WorkoutExerciseInput, type SetInput, useFitTrackStore } from "@/store/fittrackStore";
import SetRow from "./SetRow";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  exercise: WorkoutExerciseInput;
  exerciseIndex: number;
  onUpdate: (updated: WorkoutExerciseInput) => void;
  onRemove: () => void;
  targetSets?: number;
  targetReps?: number;
  recommendedRest?: number;
  onSetComplete?: (setIndex: number, completed: boolean) => void;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  onUpdate,
  onRemove,
  targetSets,
  targetReps,
  recommendedRest,
  onSetComplete,
}: ExerciseCardProps) {
  const { unitSystem } = useFitTrackStore();

  const handleSetChange = (setIndex: number, updated: SetInput) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = updated;
    onUpdate({ ...exercise, sets: newSets });
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: SetInput = {
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const removeSet = (index: number) => {
    if (exercise.sets.length <= 1) return;
    const newSets = exercise.sets.filter((_, i) => i !== index);
    onUpdate({ ...exercise, sets: newSets });
  };

  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const isAllDone = completedSets === totalSets && totalSets > 0;

  return (
    <Card
      className={cn(
        "border-border/50 transition-all",
        isAllDone && "border-accent-green/30 bg-accent-green/5"
      )}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
            <CardTitle className="text-sm font-semibold truncate">
              {exercise.exerciseName || `Exercise ${exerciseIndex + 1}`}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAllDone && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Badge className="bg-accent-green text-white text-[10px] px-2 py-0.5 gap-1">
                  <Check className="w-3 h-3" strokeWidth={3} />
                  Done
                </Badge>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-danger"
              onClick={onRemove}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Target info row + Set Progress pill */}
        <div className="flex items-center justify-between pl-6 mt-1">
          <div className="flex items-center gap-2">
            {(targetSets || targetReps) && (
              <span className="text-xs text-muted-foreground">
                {targetSets || 3} sets × {targetReps || 10} reps
              </span>
            )}
            {recommendedRest && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <span className="mx-1">·</span>
                <Timer className="w-3 h-3" />
                {recommendedRest >= 60
                  ? `${Math.floor(recommendedRest / 60)}:${(recommendedRest % 60).toString().padStart(2, "0")}`
                  : `${recommendedRest}s`}
              </span>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 tabular-nums",
              isAllDone
                ? "bg-accent-green/10 text-accent-green"
                : "bg-muted text-muted-foreground"
            )}
          >
            {completedSets} / {totalSets} sets
          </Badge>
        </div>

        {/* Muscle badges */}
        {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 pl-6">
            {exercise.primaryMuscles.map((muscle) => (
              <Badge
                key={muscle}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-brand/10 text-brand"
              >
                {muscle}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {/* Header Row */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] items-center gap-2 py-1 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>Set</span>
          <span>Previous</span>
          <span>{unitSystem === "metric" ? "Kg" : "Lbs"}</span>
          <span>Reps</span>
          <span></span>
        </div>

        {/* Set Rows */}
        <div className="space-y-0.5">
          {exercise.sets.map((set, idx) => (
            <div key={idx} className="group relative">
              <SetRow
                setNumber={idx + 1}
                set={set}
                onChange={(updated) => handleSetChange(idx, updated)}
                onSetComplete={(setIdx, completed) => onSetComplete?.(setIdx, completed)}
              />
              {exercise.sets.length > 1 && (
                <button
                  onClick={() => removeSet(idx)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Set */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addSet}
          className="w-full mt-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}

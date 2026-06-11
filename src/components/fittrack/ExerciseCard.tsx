"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { type WorkoutExerciseInput, type SetInput, useFitTrackStore } from "@/store/fittrackStore";
import SetRow from "./SetRow";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  exercise: WorkoutExerciseInput;
  exerciseIndex: number;
  onUpdate: (updated: WorkoutExerciseInput) => void;
  onRemove: () => void;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  onUpdate,
  onRemove,
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

  return (
    <Card
      className={cn(
        "border-border/50 transition-all",
        completedSets === totalSets && totalSets > 0 && "border-accent-green/30"
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
            {completedSets === totalSets && totalSets > 0 && (
              <Badge
                variant="secondary"
                className="bg-accent-green/10 text-accent-green text-[10px] px-1.5 py-0"
              >
                Done
              </Badge>
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
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_36px] items-center gap-2 py-1 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
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
              />
              {exercise.sets.length > 1 && (
                <button
                  onClick={() => removeSet(idx)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger p-0.5"
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

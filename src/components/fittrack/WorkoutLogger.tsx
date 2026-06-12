"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFitTrackStore, type WorkoutExerciseInput, type SetInput } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import ExerciseCard from "./ExerciseCard";
import RestTimer from "./RestTimer";
import WorkoutComplete from "./WorkoutComplete";
import {
  Plus,
  Search,
  Timer,
  Save,
  Dumbbell,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  targetSets?: number;
  targetReps?: number;
  recommendedRest?: number;
}

export default function WorkoutLogger() {
  const {
    user,
    currentWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
    unitSystem,
  } = useFitTrackStore();

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [saving, setSaving] = useState(false);
  const [workoutCompleteOpen, setWorkoutCompleteOpen] = useState(false);
  const [workoutStartTime] = useState(Date.now());
  const [workoutName, setWorkoutName] = useState(
    currentWorkout?.name || format(new Date(), "MMMM d") + " Workout"
  );
  const [workoutDate, setWorkoutDate] = useState(
    currentWorkout?.date || format(new Date(), "yyyy-MM-dd")
  );
  const [workoutNotes, setWorkoutNotes] = useState(
    currentWorkout?.notes || ""
  );
  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExerciseInput[]
  >(currentWorkout?.exercises || []);

  // Track exercise metadata (targetSets, targetReps, recommendedRest) per exerciseId
  const [exerciseMeta, setExerciseMeta] = useState<Record<string, { targetSets: number; targetReps: number; recommendedRest: number }>>({});

  // Sync to store
  useEffect(() => {
    setCurrentWorkout({
      name: workoutName,
      date: workoutDate,
      exercises: workoutExercises,
      notes: workoutNotes,
    });
  }, [workoutName, workoutDate, workoutExercises, workoutNotes, setCurrentWorkout]);

  // Fetch exercises for search
  useEffect(() => {
    if (!exerciseModalOpen) return;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/exercises?q=${encodeURIComponent(exerciseSearch)}`
        );
        if (res.ok) {
          const data = await res.json();
          setExercises(data.exercises || []);
          setSearchResults(data.exercises || []);
        }
      } catch {
        // Ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [exerciseSearch, exerciseModalOpen]);

  const handleSearchFilter = useCallback(
    (query: string) => {
      setExerciseSearch(query);
      if (!query) {
        setSearchResults(exercises);
        return;
      }
      const lower = query.toLowerCase();
      setSearchResults(
        exercises.filter(
          (e) =>
            e.name.toLowerCase().includes(lower) ||
            e.primaryMuscles.some((m) => m.toLowerCase().includes(lower))
        )
      );
    },
    [exercises]
  );

  const addExercise = useCallback(
    (exercise: Exercise) => {
      const defaultSets = exercise.targetSets || 3;
      const defaultReps = exercise.targetReps || 10;
      const newEx: WorkoutExerciseInput = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        sets: Array.from({ length: defaultSets }, () => ({
          weight: 0,
          reps: defaultReps,
          completed: false,
        })),
      };
      setWorkoutExercises((prev) => [...prev, newEx]);
      // Store exercise metadata
      setExerciseMeta((prev) => ({
        ...prev,
        [exercise.id]: {
          targetSets: exercise.targetSets || 3,
          targetReps: exercise.targetReps || 10,
          recommendedRest: exercise.recommendedRest || 90,
        },
      }));
      setExerciseModalOpen(false);
      toast.success(`Added ${exercise.name}`);
    },
    []
  );

  const updateExercise = useCallback(
    (index: number, updated: WorkoutExerciseInput) => {
      setWorkoutExercises((prev) =>
        prev.map((ex, i) => (i === index ? updated : ex))
      );
    },
    []
  );

  const removeExercise = useCallback((index: number) => {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle set completion — auto rest timer or workout complete
  const handleSetComplete = useCallback(
    (exerciseIndex: number, _setIndex: number) => {
      const exercise = workoutExercises[exerciseIndex];
      if (!exercise) return;

      const completedSets = exercise.sets.filter((s) => s.completed).length;
      const totalSets = exercise.sets.length;
      const isLastSetOfExercise = completedSets >= totalSets;
      const isLastExercise = exerciseIndex >= workoutExercises.length - 1;

      if (isLastSetOfExercise && isLastExercise) {
        // Workout complete! Show celebration
        setWorkoutCompleteOpen(true);
      } else if (isLastSetOfExercise) {
        // Exercise done, move to next — no rest timer needed
        // (user will naturally see the next exercise card)
      } else {
        // Auto rest timer between sets
        const meta = exerciseMeta[exercise.exerciseId];
        const restSec = meta?.recommendedRest || 90;
        setRestTimerSeconds(restSec);
        setRestTimerOpen(true);
      }
    },
    [workoutExercises, exerciseMeta]
  );

  const handleSave = async () => {
    if (!user) return toast.error("Not authenticated");
    if (workoutExercises.length === 0)
      return toast.error("Add at least one exercise");

    setSaving(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: workoutName,
          date: workoutDate,
          notes: workoutNotes || undefined,
          exercises: workoutExercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets.map((s) => ({
              reps: s.reps,
              weight: s.weight,
              completed: s.completed,
            })),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save workout");
      }
      toast.success("Workout saved!");
      clearCurrentWorkout();
      setWorkoutName(format(new Date(), "MMMM d") + " Workout");
      setWorkoutDate(format(new Date(), "yyyy-MM-dd"));
      setWorkoutNotes("");
      setWorkoutExercises([]);
      setWorkoutCompleteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const completedCount = workoutExercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = workoutExercises.reduce(
    (total, ex) => total + ex.sets.length,
    0
  );

  const totalVolume = workoutExercises.reduce(
    (total, ex) =>
      total +
      ex.sets.reduce(
        (setTotal, s) => (s.completed ? setTotal + s.weight * s.reps : setTotal),
        0
      ),
    0
  );

  const elapsedMinutes = Math.round((Date.now() - workoutStartTime) / 60000) || 1;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Log Workout</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRestTimerOpen(true)}
          >
            <Timer className="w-4 h-4 mr-1" />
            Timer
          </Button>
          <Button
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            size="sm"
            onClick={handleSave}
            disabled={saving || workoutExercises.length === 0}
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {totalSets > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent-green rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${totalSets > 0 ? (completedCount / totalSets) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="tabular-nums font-medium">
              {completedCount}/{totalSets} sets
            </span>
          </div>
          {completedCount > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{totalVolume.toLocaleString()} {unitSystem === "metric" ? "kg" : "lbs"} volume</span>
              <span>·</span>
              <span>{elapsedMinutes} min</span>
            </div>
          )}
        </div>
      )}

      {/* Workout Info */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Workout Name</Label>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Workout name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="How did the workout feel?"
              className="min-h-[60px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <AnimatePresence>
        {workoutExercises.map((exercise, idx) => {
          const meta = exerciseMeta[exercise.exerciseId];
          return (
            <motion.div
              key={`${exercise.exerciseId}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ExerciseCard
                exercise={exercise}
                exerciseIndex={idx}
                onUpdate={(updated) => updateExercise(idx, updated)}
                onRemove={() => removeExercise(idx)}
                targetSets={meta?.targetSets}
                targetReps={meta?.targetReps}
                recommendedRest={meta?.recommendedRest}
                onSetComplete={(setIdx) => handleSetComplete(idx, setIdx)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add Exercise */}
      <Dialog open={exerciseModalOpen} onOpenChange={setExerciseModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={() => setExerciseModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={(e) => handleSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[400px]">
              {searchLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No exercises found. Try a different search.
                </p>
              ) : (
                <div className="space-y-1 p-1">
                  {searchResults.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      onClick={() => addExercise(exercise)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-brand/10">
                          <Dumbbell className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {exercise.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {exercise.primaryMuscles.map((m) => (
                              <Badge
                                key={m}
                                variant="secondary"
                                className="text-[9px] px-1 py-0"
                              >
                                {m}
                              </Badge>
                            ))}
                            <span className="text-[9px] text-muted-foreground">
                              {exercise.targetSets || 3}×{exercise.targetReps || 10} · Rest {exercise.recommendedRest || 90}s
                            </span>
                          </div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rest Timer */}
      <RestTimer
        open={restTimerOpen}
        onClose={() => setRestTimerOpen(false)}
        autoStartSeconds={restTimerSeconds}
      />

      {/* Workout Complete Celebration */}
      <WorkoutComplete
        open={workoutCompleteOpen}
        onSave={handleSave}
        onKeepEditing={() => setWorkoutCompleteOpen(false)}
        totalSets={completedCount}
        totalVolume={totalVolume}
        durationMinutes={elapsedMinutes}
        exerciseCount={workoutExercises.length}
        unitSystem={unitSystem}
      />
    </div>
  );
}

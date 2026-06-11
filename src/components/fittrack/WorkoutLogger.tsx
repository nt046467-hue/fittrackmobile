"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFitTrackStore, type WorkoutExerciseInput, type SetInput } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus,
  Search,
  Timer,
  Save,
  Copy,
  X,
  Dumbbell,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment?: string;
}

export default function WorkoutLogger() {
  const {
    user,
    currentWorkout,
    setCurrentWorkout,
    updateCurrentWorkout,
    clearCurrentWorkout,
    unitSystem,
  } = useFitTrackStore();

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const newEx: WorkoutExerciseInput = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        sets: [{ weight: 0, reps: 0, completed: false }],
      };
      setWorkoutExercises((prev) => [...prev, newEx]);
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-green rounded-full transition-all"
              style={{
                width: `${totalSets > 0 ? (completedCount / totalSets) * 100 : 0}%`,
              }}
            />
          </div>
          <span>
            {completedCount}/{totalSets} sets
          </span>
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
        {workoutExercises.map((exercise, idx) => (
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
            />
          </motion.div>
        ))}
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
                          <div className="flex gap-1 mt-0.5">
                            {exercise.primaryMuscles.map((m) => (
                              <Badge
                                key={m}
                                variant="secondary"
                                className="text-[9px] px-1 py-0"
                              >
                                {m}
                              </Badge>
                            ))}
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
      />
    </div>
  );
}

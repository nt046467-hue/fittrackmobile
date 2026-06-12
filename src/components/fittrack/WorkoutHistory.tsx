"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConfirmModal from "./ConfirmModal";
import {
  Search,
  Calendar,
  List,
  ChevronDown,
  ChevronUp,
  Trash2,
  Dumbbell,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Workout {
  id: string;
  name: string;
  date: string;
  notes?: string;
  exercises: {
    exerciseId: string;
    exerciseName?: string;
    sets: { reps: number; weight: number; completed: boolean }[];
  }[];
}

export default function WorkoutHistory() {
  const { user, unitSystem } = useFitTrackStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  useEffect(() => {
    if (!user) return;
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workouts?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkouts(data.workouts || []);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [user]);

  const filteredWorkouts = useMemo(() => {
    if (!searchQuery) return workouts;
    const lower = searchQuery.toLowerCase();
    return workouts.filter(
      (w) =>
        w.name.toLowerCase().includes(lower) ||
        w.exercises.some(
          (e) =>
            e.exerciseName?.toLowerCase().includes(lower) ||
            e.sets.some(
              (s) =>
                s.weight.toString().includes(lower) ||
                s.reps.toString().includes(lower)
            )
        )
    );
  }, [workouts, searchQuery]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/workouts?id=${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setWorkouts((prev) => prev.filter((w) => w.id !== deleteId));
      toast.success("Workout deleted");
    } catch {
      toast.error("Failed to delete workout");
    } finally {
      setDeleteId(null);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );
  const workoutsByDay = weekDays.map((day) => ({
    day,
    workouts: workouts.filter((w) => {
      const d = new Date(w.date + 'T00:00:00');
      return !isNaN(d.getTime()) && isSameDay(d, day);
    }),
  }));

  const unit = unitSystem === "metric" ? "kg" : "lbs";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Workout History</h1>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-7 px-2.5"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="h-7 px-2.5"
          >
            <Calendar className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by workout or exercise name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentWeekStart(
                    addDays(currentWeekStart, -7)
                  )
                }
              >
                ← Prev
              </Button>
              <CardTitle className="text-sm">
                {format(currentWeekStart, "MMM d")} –{" "}
                {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentWeekStart(
                    addDays(currentWeekStart, 7)
                  )
                }
              >
                Next →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
              {weekDays.map((day, i) => {
                const dayWorkouts = workoutsByDay[i].workouts;
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-xs border border-border/30 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSameDay(day, new Date()) && "border-brand bg-brand/5",
                      dayWorkouts.length > 0 && "bg-accent-green/5"
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        isSameDay(day, new Date()) && "text-brand"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayWorkouts.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-green mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout List */}
      <div className="space-y-2">
        {filteredWorkouts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No workouts match your search"
                  : "No workouts logged yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkouts.map((workout, idx) => {
            const isExpanded = expandedId === workout.id;
            const totalVolume = workout.exercises.reduce(
              (total, ex) =>
                total +
                ex.sets.reduce(
                  (sTotal, s) =>
                    s.completed ? sTotal + s.weight * s.reps : sTotal,
                  0
                ),
              0
            );
            return (
              <motion.div
                key={workout.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border-border/50 overflow-hidden">
                  <div
                    className="w-full text-left cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : workout.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : workout.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">
                              {workout.name}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(workout.date + 'T00:00:00'), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {workout.exercises.length} exercise
                              {workout.exercises.length !== 1 ? "s" : ""}
                            </span>
                            {totalVolume > 0 && (
                              <span className="text-xs text-muted-foreground">
                                · {totalVolume.toLocaleString()} {unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(workout.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
                          {workout.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="bg-muted/30 rounded-lg p-3"
                            >
                              <p className="text-xs font-semibold mb-1">
                                {ex.exerciseName ?? 'Unknown Exercise'}
                              </p>
                              <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground mb-1">
                                <span>Set</span>
                                <span>Weight</span>
                                <span>Reps</span>
                              </div>
                              {ex.sets.map((set, setIdx) => (
                                <div
                                  key={setIdx}
                                  className="grid grid-cols-3 gap-1 text-xs"
                                >
                                  <span className="text-muted-foreground">
                                    {setIdx + 1}
                                  </span>
                                  <span>
                                    {set.weight} {unit}
                                  </span>
                                  <span>{set.reps}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                          {workout.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

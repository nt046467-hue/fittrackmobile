"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmModal from "./ConfirmModal";
import {
  CalendarCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Dumbbell,
  Play,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  GripVertical,
  Flame,
  Clock,
  SkipForward,
  Timer,
  Trophy,
  ArrowRight,
  Pause,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface PlanExercise {
  exerciseId: string;
  exerciseName?: string;
  targetSets: number;
  targetReps: number;
  primaryMuscles?: string[];
  equipment?: string;
}

interface PlanDay {
  id: string;
  dayOfWeek: number;
  name: string;
  exercises: PlanExercise[];
  completions?: { id: string; planDayId: string; date: string }[];
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  isBuiltIn: boolean;
  days: PlanDay[];
}

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-orange-500/20 text-orange-400",
  back: "bg-blue-500/20 text-blue-400",
  shoulders: "bg-purple-500/20 text-purple-400",
  legs: "bg-green-500/20 text-green-400",
  arms: "bg-pink-500/20 text-pink-400",
  core: "bg-yellow-500/20 text-yellow-400",
  "full body": "bg-cyan-500/20 text-cyan-400",
};

// ─── Main Component ──────────────────────────────────────

export default function WorkoutPlans() {
  const { user } = useFitTrackStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // Live workout session state
  const [activeSession, setActiveSession] = useState<{
    plan: Plan;
    day: PlanDay;
  } | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/plans?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/plans?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans((prev) => prev.filter((p) => p.id !== deleteId));
      if (selectedPlan?.id === deleteId) setSelectedPlan(null);
      if (activePlanId === deleteId) setActivePlanId(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCompleteDay = async (planDayId: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/plans/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDayId,
          userId: user.id,
          date: format(new Date(), "yyyy-MM-dd"),
        }),
      });
      if (!res.ok) throw new Error("Failed to mark complete");
      toast.success("Workout completed! 💪");
      await fetchPlans();
      if (selectedPlan) {
        const plansRes = await fetch(`/api/plans?userId=${user.id}`);
        if (plansRes.ok) {
          const data = await plansRes.json();
          const updated = (data.plans || []).find((p: Plan) => p.id === selectedPlan.id);
          if (updated) setSelectedPlan(updated);
        }
      }
    } catch {
      toast.error("Failed to mark day complete");
    }
  };

  const handleFollowPlan = (planId: string) => {
    setActivePlanId(planId);
    setSelectedPlan(plans.find((p) => p.id === planId) || null);
    toast.success("You're now following this plan! Let's go! 🏋️");
  };

  // Start a live workout session for a specific day
  const startWorkoutSession = (plan: Plan, day: PlanDay) => {
    setActiveSession({ plan, day });
  };

  // Called when the guided workout finishes
  const handleSessionComplete = async (planDayId: string, workoutData: {
    exercises: { exerciseId: string; exerciseName: string; sets: { reps: number; weight: number; completed: boolean }[] }[];
  }) => {
    if (!user) return;

    // Save the workout to history
    try {
      await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: activeSession?.day.name || "Plan Workout",
          date: format(new Date(), "yyyy-MM-dd"),
          exercises: workoutData.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
          })),
        }),
      });
    } catch {
      // Non-critical, continue
    }

    // Mark the plan day as complete
    await handleCompleteDay(planDayId);

    // Close session
    setActiveSession(null);

    // Refresh plans
    await fetchPlans();
  };

  const handleSessionCancel = () => {
    setActiveSession(null);
  };

  const todayDayOfWeek = new Date().getDay();

  const getAdherence = (plan: Plan) => {
    const totalDays = plan.days.length;
    if (totalDays === 0) return 0;
    const completedDays = plan.completions?.length || 0;
    return Math.min(100, Math.round((completedDays / totalDays) * 100));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  // ─── Live Workout Session (full screen overlay) ──────
  if (activeSession) {
    return (
      <GuidedWorkoutSession
        plan={activeSession.plan}
        day={activeSession.day}
        unitSystem={useFitTrackStore.getState().unitSystem}
        onComplete={(workoutData) =>
          handleSessionComplete(activeSession.day.id, workoutData)
        }
        onCancel={handleSessionCancel}
      />
    );
  }

  // ─── Selected Plan Detail View ────────────────────────
  if (selectedPlan) {
    return (
      <PlanDetailView
        plan={selectedPlan}
        todayDayOfWeek={todayDayOfWeek}
        isActive={activePlanId === selectedPlan.id}
        onBack={() => setSelectedPlan(null)}
        onCompleteDay={handleCompleteDay}
        onFollow={() => handleFollowPlan(selectedPlan.id)}
        onStartWorkout={(day) => startWorkoutSession(selectedPlan, day)}
      />
    );
  }

  // ─── Plan List View (default) ─────────────────────────
  const activePlan = plans.find((p) => p.id === activePlanId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold tracking-tight">Workout Plans</h1>
        </div>
        <Button
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Plan
        </Button>
      </div>

      {/* Active Plan Weekly Schedule */}
      {activePlan && (
        <Card className="border-brand/30 bg-brand/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-brand" />
                  Following: {activePlan.name}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Your weekly workout schedule
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-brand"
                onClick={() => setSelectedPlan(activePlan)}
              >
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_SHORT.map((dayName, i) => {
                const planDay = activePlan.days.find((d) => d.dayOfWeek === i);
                const isToday = i === todayDayOfWeek;
                const isCompleted = planDay?.completions?.some(
                  (c) => c.date === format(new Date(), "yyyy-MM-dd")
                );
                const isRestDay = !planDay;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (planDay) setSelectedPlan(activePlan);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center",
                      isToday && "ring-2 ring-brand",
                      isRestDay && "opacity-40",
                      isCompleted && "bg-accent-green/20",
                      !isCompleted && !isRestDay && isToday && "bg-brand/20",
                      !isCompleted && !isRestDay && !isToday && "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {dayName}
                    </span>
                    {isRestDay ? (
                      <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">Rest</span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          isCompleted
                            ? "bg-accent-green text-accent-green-foreground"
                            : isToday
                              ? "bg-brand text-brand-foreground"
                              : "bg-muted"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Dumbbell className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                    {planDay && (
                      <span className="text-[9px] font-medium leading-tight truncate w-full">
                        {planDay.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Today's workout prompt */}
            {(() => {
              const todayPlan = activePlan.days.find((d) => d.dayOfWeek === todayDayOfWeek);
              const todayCompleted = todayPlan?.completions?.some(
                (c) => c.date === format(new Date(), "yyyy-MM-dd")
              );
              if (!todayPlan) {
                return (
                  <div className="mt-3 p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground">
                      Today is a rest day. Recovery is important! 😴
                    </p>
                  </div>
                );
              }
              if (todayCompleted) {
                return (
                  <div className="mt-3 p-3 rounded-lg bg-accent-green/10 text-center">
                    <p className="text-xs text-accent-green font-medium">
                      ✅ Today&apos;s workout completed! Great job!
                    </p>
                  </div>
                );
              }
              return (
                <div className="mt-3 p-3 rounded-lg bg-brand/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{todayPlan.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {todayPlan.exercises.length} exercises · Tap Start to begin!
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand/90 text-brand-foreground h-8 text-xs"
                    onClick={() => startWorkoutSession(activePlan, todayPlan)}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Start
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* No Active Plan */}
      {!activePlan && plans.length > 0 && (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="py-6 text-center">
            <CalendarCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium">No plan active</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a plan and tap &quot;Follow&quot; to set your weekly schedule
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          Available Plans
        </h2>
        <div className="space-y-2">
          {plans.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No workout plans yet. Create one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={cn(
                    "border-border/50 cursor-pointer hover:border-brand/30 transition-colors",
                    activePlanId === plan.id && "border-brand/50 bg-brand/5"
                  )}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{plan.name}</p>
                          {plan.isBuiltIn && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-brand/10 text-brand">
                              Built-in
                            </Badge>
                          )}
                          {activePlanId === plan.id && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-accent-green/20 text-accent-green">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {plan.days.length} day{plan.days.length !== 1 ? "s" : ""}
                          </span>
                          {plan.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              · {plan.description}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {DAY_SHORT.map((d, i) => {
                            const hasDay = plan.days.some((pd) => pd.dayOfWeek === i);
                            return (
                              <span
                                key={i}
                                className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded",
                                  hasDay
                                    ? i === todayDayOfWeek
                                      ? "bg-brand/20 text-brand"
                                      : "bg-muted text-foreground"
                                    : "text-muted-foreground/30"
                                )}
                              >
                                {d}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {!plan.isBuiltIn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(plan.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(newPlan) => {
          setPlans((prev) => [...prev, newPlan]);
          setCreateOpen(false);
        }}
      />

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Plan"
        message="Are you sure you want to delete this workout plan?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ─── Guided Workout Session (Full-Screen Live Workout) ────

interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  sets: SetLog[];
  done: boolean;
}

function GuidedWorkoutSession({
  plan,
  day,
  unitSystem,
  onComplete,
  onCancel,
}: {
  plan: Plan;
  day: PlanDay;
  unitSystem: "metric" | "imperial";
  onComplete: (data: {
    exercises: { exerciseId: string; exerciseName: string; sets: { reps: number; weight: number; completed: boolean }[] }[];
  }) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<ExerciseLog[]>(() =>
    day.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName || "Exercise",
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      sets: Array.from({ length: ex.targetSets }, () => ({
        reps: ex.targetReps,
        weight: 0,
        completed: false,
      })),
      done: false,
    }))
  );

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [phase, setPhase] = useState<"setup" | "working" | "resting" | "exercise-done" | "workout-done">("setup");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [workoutStartTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unit = unitSystem === "metric" ? "kg" : "lbs";

  const currentEx = exercises[currentExIdx];
  const totalExercises = exercises.length;
  const completedExercises = exercises.filter((e) => e.done).length;

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Rest countdown
  useEffect(() => {
    if (phase !== "resting") return;
    if (restSeconds <= 0) {
      setPhase("working");
      setRestSeconds(90);
      return;
    }
    const t = setTimeout(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const updateSet = (exIdx: number, setIdx: number, updates: Partial<SetLog>) => {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, ...updates } : s
        ),
      };
      return next;
    });
  };

  const completeSet = () => {
    updateSet(currentExIdx, currentSetIdx, { completed: true });
    const isLastSet = currentSetIdx >= currentEx.sets.length - 1;

    if (isLastSet) {
      // Mark exercise as done
      setExercises((prev) => {
        const next = [...prev];
        next[currentExIdx] = { ...next[currentExIdx], done: true };
        return next;
      });

      const isLastExercise = currentExIdx >= exercises.length - 1;
      if (isLastExercise) {
        setPhase("workout-done");
        setTimerRunning(false);
      } else {
        setPhase("exercise-done");
        setTimerRunning(false);
      }
    } else {
      // Start rest timer before next set
      setPhase("resting");
      setRestSeconds(90);
      setCurrentSetIdx((s) => s + 1);
    }
  };

  const goToNextExercise = () => {
    setCurrentExIdx((i) => i + 1);
    setCurrentSetIdx(0);
    setPhase("working");
    setTimerRunning(true);
  };

  const skipRest = () => {
    setPhase("working");
    setRestSeconds(90);
  };

  const startWorkout = () => {
    setPhase("working");
    setTimerRunning(true);
  };

  const finishWorkout = () => {
    const workoutData = {
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
        })),
      })),
    };
    onComplete(workoutData);
  };

  const overallProgress = (() => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  })();

  // ─── Setup Phase ─────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center -m-4 sm:-m-6 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center mx-auto">
            <Dumbbell className="w-10 h-10 text-brand-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{day.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.name} · {day.exercises.length} exercises
            </p>
          </div>

          {/* Exercise list preview */}
          <div className="space-y-2 text-left">
            {day.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ex.exerciseName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ex.targetSets} sets × {ex.targetReps} reps
                  </p>
                </div>
                {ex.primaryMuscles?.slice(0, 1).map((m) => (
                  <span
                    key={m}
                    className={cn(
                      "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                      MUSCLE_COLORS[m] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {m}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <Button
            className="w-full bg-brand hover:bg-brand/90 text-brand-foreground h-12 text-base font-semibold"
            onClick={startWorkout}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
          <Button variant="ghost" className="text-muted-foreground" onClick={onCancel}>
            Cancel
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Workout Done Phase ──────────────────────────────
  if (phase === "workout-done") {
    const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
    const totalVolume = exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => (set.completed ? s + set.weight * set.reps : s), 0),
      0
    );

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center -m-4 sm:-m-6 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto"
          >
            <Trophy className="w-12 h-12 text-accent-green" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold">Workout Complete!</h1>
            <p className="text-sm text-muted-foreground mt-1">{day.name} · {plan.name}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/30">
              <Clock className="w-4 h-4 text-brand mx-auto mb-1" />
              <p className="text-lg font-bold">{formatTime(elapsed)}</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <Dumbbell className="w-4 h-4 text-accent-green mx-auto mb-1" />
              <p className="text-lg font-bold">{exercises.length}</p>
              <p className="text-[10px] text-muted-foreground">Exercises</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold">{totalVolume.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{unit} lifted</p>
            </div>
          </div>

          <Button
            className="w-full bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground h-12 text-base font-semibold"
            onClick={finishWorkout}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Save & Complete
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Rest Phase ──────────────────────────────────────
  if (phase === "resting") {
    const restProgress = Math.max(0, (90 - restSeconds) / 90) * 100;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (restProgress / 100) * circumference;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center -m-4 sm:-m-6 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <p className="text-sm text-muted-foreground">Rest before</p>
          <h2 className="text-xl font-bold">
            Set {currentSetIdx + 1} of {currentEx.sets.length}
          </h2>
          <p className="text-sm font-medium text-brand">{currentEx.exerciseName}</p>

          {/* Circular timer */}
          <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                className="text-brand" stroke="currentColor" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{restSeconds}</span>
              <span className="text-xs text-muted-foreground">seconds</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-brand hover:bg-brand/90 text-brand-foreground h-11"
              onClick={skipRest}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Rest
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={() => setRestSeconds((s) => Math.max(0, s - 15))}
              >
                -15s
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={() => setRestSeconds((s) => s + 30)}
              >
                +30s
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Exercise Done (between exercises) ────────────────
  if (phase === "exercise-done") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center -m-4 sm:-m-6 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-20 h-20 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-10 h-10 text-accent-green" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold">{currentEx.exerciseName}</h2>
            <p className="text-sm text-accent-green font-medium">Complete! ✅</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Up next:</p>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-sm font-bold">
                {currentExIdx + 2}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold">{exercises[currentExIdx + 1]?.exerciseName}</p>
                <p className="text-xs text-muted-foreground">
                  {exercises[currentExIdx + 1]?.targetSets} sets × {exercises[currentExIdx + 1]?.targetReps} reps
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-brand hover:bg-brand/90 text-brand-foreground h-12 text-base font-semibold"
            onClick={goToNextExercise}
          >
            Next Exercise
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Working Phase (current set) ─────────────────────
  return (
    <div className="-m-4 sm:-m-6 p-4 sm:p-6 space-y-4">
      {/* Top bar: progress + timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
          <div className="text-xs text-muted-foreground">
            Exercise {currentExIdx + 1}/{totalExercises}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-mono">
          <Timer className="w-4 h-4 text-brand" />
          {formatTime(timerSeconds)}
        </div>
      </div>

      {/* Overall progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Overall progress</span>
          <span>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Current Exercise Card */}
      <motion.div
        key={currentExIdx}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="p-4 space-y-4">
            {/* Exercise header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{currentEx.exerciseName}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  {currentEx.sets[0]?.weight !== undefined && (
                    <span className="text-xs text-muted-foreground">{unitSystem === "metric" ? "kg" : "lbs"}</span>
                  )}
                  {day.exercises[currentExIdx]?.primaryMuscles?.map((m) => (
                    <span
                      key={m}
                      className={cn(
                        "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                        MUSCLE_COLORS[m] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <Badge variant="secondary" className="bg-brand/10 text-brand">
                {currentSetIdx + 1}/{currentEx.sets.length} sets
              </Badge>
            </div>

            {/* Set progress dots */}
            <div className="flex gap-2">
              {currentEx.sets.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-2 rounded-full transition-colors",
                    s.completed
                      ? "bg-accent-green"
                      : i === currentSetIdx
                        ? "bg-brand"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Current set input */}
            {!currentEx.sets[currentSetIdx]?.completed && (
              <motion.div
                key={currentSetIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-semibold">
                  Set {currentSetIdx + 1} of {currentEx.sets.length}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Weight ({unit})</Label>
                    <Input
                      type="number"
                      value={currentEx.sets[currentSetIdx]?.weight || ""}
                      onChange={(e) =>
                        updateSet(currentExIdx, currentSetIdx, {
                          weight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-11 text-center text-lg font-bold"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Reps</Label>
                    <Input
                      type="number"
                      value={currentEx.sets[currentSetIdx]?.reps || ""}
                      onChange={(e) =>
                        updateSet(currentExIdx, currentSetIdx, {
                          reps: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-11 text-center text-lg font-bold"
                      placeholder={currentEx.targetReps.toString()}
                      min={0}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground h-12 text-base font-semibold"
                  onClick={completeSet}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {currentSetIdx >= currentEx.sets.length - 1
                    ? "Complete Exercise"
                    : "Complete Set"}
                </Button>
              </motion.div>
            )}

            {/* Previously completed sets */}
            {currentEx.sets.some((s) => s.completed) && (
              <div className="space-y-1.5 pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium">Completed sets</p>
                {currentEx.sets.map((s, i) =>
                  s.completed ? (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                      <span className="text-muted-foreground">Set {i + 1}</span>
                      <span className="font-medium">{s.weight} {unit}</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="font-medium">{s.reps} reps</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Exercise overview list */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">All exercises</p>
        {exercises.map((ex, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs",
              i === currentExIdx && "bg-brand/5 border border-brand/20",
              ex.done && "bg-accent-green/5",
              i !== currentExIdx && !ex.done && "bg-muted/20"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                ex.done
                  ? "bg-accent-green text-accent-green-foreground"
                  : i === currentExIdx
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {ex.done ? "✓" : i + 1}
            </div>
            <span className={cn("flex-1 truncate", ex.done && "line-through text-muted-foreground")}>
              {ex.exerciseName}
            </span>
            <span className="text-muted-foreground shrink-0">
              {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plan Detail View ─────────────────────────────────────

function PlanDetailView({
  plan,
  todayDayOfWeek,
  isActive,
  onBack,
  onCompleteDay,
  onFollow,
  onStartWorkout,
}: {
  plan: Plan;
  todayDayOfWeek: number;
  isActive: boolean;
  onBack: () => void;
  onCompleteDay: (planDayId: string) => void;
  onFollow: () => void;
  onStartWorkout: (day: PlanDay) => void;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const sortedDays = [...plan.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const totalExercises = plan.days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
        ← Back to Plans
      </Button>

      {/* Plan Header */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription className="mt-1 text-xs">{plan.description}</CardDescription>
              )}
            </div>
            {!isActive ? (
              <Button
                className="bg-brand hover:bg-brand/90 text-brand-foreground h-8"
                size="sm"
                onClick={onFollow}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Follow Plan
              </Button>
            ) : (
              <Badge className="bg-accent-green/20 text-accent-green">Following</Badge>
            )}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck className="w-3.5 h-3.5" />
              {plan.days.length} days/week
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Dumbbell className="w-3.5 h-3.5" />
              {totalExercises} exercises
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Schedule */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Weekly Schedule</h2>
        <div className="space-y-2">
          {sortedDays.map((day) => {
            const isToday = day.dayOfWeek === todayDayOfWeek;
            const isCompleted = day.completions?.some((c) => c.date === todayStr);
            const isExpanded = expandedDay === day.id;
            const mainMuscles = [...new Set(day.exercises.flatMap((e) => e.primaryMuscles || []))];

            return (
              <motion.div key={day.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={cn(
                    "border-border/50 overflow-hidden transition-colors",
                    isToday && !isCompleted && "border-brand/40 bg-brand/5",
                    isCompleted && "border-accent-green/30 bg-accent-green/5"
                  )}
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedDay(isExpanded ? null : day.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0",
                            isCompleted
                              ? "bg-accent-green text-accent-green-foreground"
                              : isToday
                                ? "bg-brand text-brand-foreground"
                                : "bg-muted"
                          )}
                        >
                          <span className="text-[9px] font-bold leading-none">
                            {DAY_SHORT[day.dayOfWeek]}
                          </span>
                          <span className="text-[10px] font-medium leading-none mt-0.5">
                            {isCompleted ? "✓" : ""}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{day.name}</p>
                            {isToday && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-brand/15 text-brand">Today</Badge>
                            )}
                            {isCompleted && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-accent-green/15 text-accent-green">Done</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                            </span>
                            {mainMuscles.slice(0, 3).map((m) => (
                              <span
                                key={m}
                                className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                  MUSCLE_COLORS[m] || "bg-muted text-muted-foreground"
                                )}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* START WORKOUT button for today's active plan */}
                        {isToday && !isCompleted && isActive && (
                          <Button
                            size="sm"
                            className="bg-brand hover:bg-brand/90 text-brand-foreground h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartWorkout(day);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-border/30">
                          <div className="grid grid-cols-[1fr_60px_60px] gap-2 text-[10px] font-medium text-muted-foreground mb-1.5 px-1">
                            <span>Exercise</span>
                            <span className="text-center">Sets</span>
                            <span className="text-center">Reps</span>
                          </div>
                          {day.exercises.map((ex, i) => (
                            <div
                              key={i}
                              className="grid grid-cols-[1fr_60px_60px] gap-2 items-center py-1.5 px-1 rounded hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {ex.exerciseName || `Exercise ${i + 1}`}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {ex.equipment || ""}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-center font-medium">{ex.targetSets}</span>
                              <span className="text-xs text-center font-medium">{ex.targetReps}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Create Plan Dialog ───────────────────────────────────

function CreatePlanDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (plan: Plan) => void;
}) {
  const { user } = useFitTrackStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<CreateDay[]>([
    { dayOfWeek: 1, name: "Push Day", isRestDay: false, exercises: [] },
  ]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [searchingDayIdx, setSearchingDayIdx] = useState<number | null>(null);

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/exercises?q=${encodeURIComponent(q)}&muscle=&equipment=`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.exercises || []).slice(0, 15));
      }
    } catch { /* ignore */ }
  };

  const addExerciseToDay = (dayIdx: number, exercise: Exercise) => {
    setDays((prev) => {
      const newDays = [...prev];
      newDays[dayIdx].exercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        targetSets: 3,
        targetReps: 10,
        primaryMuscles: exercise.primaryMuscles,
        equipment: exercise.equipment,
      });
      return newDays;
    });
    setSearchQ(""); setSearchResults([]); setSearchingDayIdx(null);
  };

  const removeExerciseFromDay = (dayIdx: number, exIdx: number) => {
    setDays((prev) => { const n = [...prev]; n[dayIdx].exercises.splice(exIdx, 1); return n; });
  };

  const updateDay = (dayIdx: number, updates: Partial<CreateDay>) => {
    setDays((prev) => { const n = [...prev]; n[dayIdx] = { ...n[dayIdx], ...updates }; return n; });
  };

  const updateExercise = (dayIdx: number, exIdx: number, updates: Partial<CreateExercise>) => {
    setDays((prev) => {
      const n = [...prev];
      n[dayIdx].exercises[exIdx] = { ...n[dayIdx].exercises[exIdx], ...updates };
      return n;
    });
  };

  const addDay = () => {
    setDays((prev) => [...prev, { dayOfWeek: prev.length % 7, name: "", isRestDay: false, exercises: [] }]);
  };

  const removeDay = (dayIdx: number) => {
    setDays((prev) => { const n = [...prev]; n.splice(dayIdx, 1); return n; });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) { toast.error("Plan name is required"); return; }
    if (days.length === 0) { toast.error("Add at least one day"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          description: description || undefined,
          days: days.filter((d) => !d.isRestDay).map((d) => ({
            dayOfWeek: d.dayOfWeek,
            name: d.name || DAY_NAMES[d.dayOfWeek],
            exercises: d.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
            })),
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      const data = await res.json();
      onCreated(data.plan);
      toast.success("Plan created! 🎉");
      setName(""); setDescription("");
      setDays([{ dayOfWeek: 1, name: "Push Day", isRestDay: false, exercises: [] }]);
    } catch { toast.error("Failed to create plan"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Custom Plan</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <form onSubmit={handleSave} className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label>Plan Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., PPL Split" required />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this plan about?" className="resize-none h-16" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Weekly Schedule</Label>
              {days.map((day, dayIdx) => (
                <Card key={dayIdx} className="border-border/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={day.dayOfWeek}
                        onChange={(e) => updateDay(dayIdx, { dayOfWeek: parseInt(e.target.value) })}
                        className="text-xs bg-muted rounded-md px-2 py-1.5 border-none font-medium"
                      >
                        {DAY_NAMES.map((n, i) => (<option key={i} value={i}>{n}</option>))}
                      </select>
                      <Input value={day.name} onChange={(e) => updateDay(dayIdx, { name: e.target.value })} className="h-8 text-sm" placeholder="e.g., Push, Pull, Legs..." />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger shrink-0" onClick={() => removeDay(dayIdx)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-2 py-1.5">
                        <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">{ex.exerciseName || "Exercise"}</span>
                        <Input type="number" value={ex.targetSets} onChange={(e) => updateExercise(dayIdx, exIdx, { targetSets: parseInt(e.target.value) || 0 })} className="h-6 text-[11px] w-12 text-center" min={1} />
                        <span className="text-[10px] text-muted-foreground">×</span>
                        <Input type="number" value={ex.targetReps} onChange={(e) => updateExercise(dayIdx, exIdx, { targetReps: parseInt(e.target.value) || 0 })} className="h-6 text-[11px] w-12 text-center" min={1} />
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-danger shrink-0" onClick={() => removeExerciseFromDay(dayIdx, exIdx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {searchingDayIdx === dayIdx ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input value={searchQ} onChange={(e) => handleSearch(e.target.value)} placeholder="Search exercises..." className="h-8 text-xs pl-8" autoFocus />
                          <Button variant="ghost" size="icon" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => { setSearchingDayIdx(null); setSearchQ(""); setSearchResults([]); }}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar">
                            {searchResults.map((ex) => (
                              <button key={ex.id} type="button" onClick={() => addExerciseToDay(dayIdx, ex)} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-2">
                                <Dumbbell className="w-3 h-3 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{ex.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{ex.primaryMuscles?.join(", ")} · {ex.equipment}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => setSearchingDayIdx(dayIdx)} type="button">
                        <Plus className="w-3 h-3 mr-1" /> Add Exercise
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={addDay} type="button">
                <Plus className="w-3 h-3 mr-1" /> Add Day
              </Button>
            </div>
            <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-brand-foreground" disabled={saving}>
              {saving ? "Creating..." : "Create Plan"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper Types ────────────────────────────────────────

interface CreateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  primaryMuscles?: string[];
  equipment?: string;
}

interface CreateDay {
  dayOfWeek: number;
  name: string;
  isRestDay: boolean;
  exercises: CreateExercise[];
}

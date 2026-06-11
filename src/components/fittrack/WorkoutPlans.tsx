"use client";

import { useState, useEffect, useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import ConfirmModal from "./ConfirmModal";
import {
  CalendarCheck,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Dumbbell,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanDay {
  id: string;
  dayOfWeek: number;
  name: string;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: number;
  }[];
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  days: PlanDay[];
  completions?: { planDayId: string; date: string }[];
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WorkoutPlans() {
  const { user } = useFitTrackStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    days: [
      {
        dayOfWeek: 1,
        name: "Push Day",
        exercises: [{ exerciseId: "", targetSets: 3, targetReps: 10 }],
      },
    ],
  });

  useEffect(() => {
    if (!user) return;
    const fetchPlans = async () => {
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
    };
    fetchPlans();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/plans?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans((prev) => prev.filter((p) => p.id !== deleteId));
      if (selectedPlan?.id === deleteId) setSelectedPlan(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !createForm.name) {
      toast.error("Plan name is required");
      return;
    }
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: createForm.name,
          description: createForm.description || undefined,
          days: createForm.days.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            name: d.name,
            exercises: d.exercises.map((ex) => ({
              exerciseId: ex.exerciseId || "custom",
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
            })),
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      const data = await res.json();
      setPlans((prev) => [...prev, data.plan]);
      setCreateOpen(false);
      setCreateForm({
        name: "",
        description: "",
        days: [
          {
            dayOfWeek: 1,
            name: "Push Day",
            exercises: [{ exerciseId: "", targetSets: 3, targetReps: 10 }],
          },
        ],
      });
      toast.success("Plan created!");
    } catch {
      toast.error("Failed to create plan");
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
      toast.success("Day marked as complete!");
      // Refresh plans
      const plansRes = await fetch(`/api/plans?userId=${user.id}`);
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
        if (selectedPlan) {
          const updated = (data.plans || []).find(
            (p: Plan) => p.id === selectedPlan.id
          );
          if (updated) setSelectedPlan(updated);
        }
      }
    } catch {
      toast.error("Failed to mark day complete");
    }
  };

  const todayDayOfWeek = new Date().getDay();

  // Calculate adherence for a plan
  const getAdherence = (plan: Plan) => {
    const totalDays = plan.days.length;
    if (totalDays === 0) return 0;
    const completedDays = plan.completions?.length || 0;
    // Simple: completions this week
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold tracking-tight">Workout Plans</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand hover:bg-brand/90 text-brand-foreground" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="e.g., PPL Split"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Plan description..."
                  className="resize-none"
                />
              </div>
              {createForm.days.map((day, dayIdx) => (
                <Card key={dayIdx} className="border-border/50">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={day.dayOfWeek}
                        onChange={(e) => {
                          const newDays = [...createForm.days];
                          newDays[dayIdx] = {
                            ...newDays[dayIdx],
                            dayOfWeek: parseInt(e.target.value),
                          };
                          setCreateForm({ ...createForm, days: newDays });
                        }}
                        className="text-xs bg-muted rounded px-2 py-1 border-none"
                      >
                        {dayNames.map((name, i) => (
                          <option key={i} value={i}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={day.name}
                        onChange={(e) => {
                          const newDays = [...createForm.days];
                          newDays[dayIdx] = {
                            ...newDays[dayIdx],
                            name: e.target.value,
                          };
                          setCreateForm({ ...createForm, days: newDays });
                        }}
                        className="h-7 text-sm"
                        placeholder="Day name"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    {day.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="flex items-center gap-2 mb-1.5"
                      >
                        <Input
                          placeholder="Exercise ID"
                          value={ex.exerciseId}
                          onChange={(e) => {
                            const newDays = [...createForm.days];
                            newDays[dayIdx].exercises[exIdx] = {
                              ...ex,
                              exerciseId: e.target.value,
                            };
                            setCreateForm({ ...createForm, days: newDays });
                          }}
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Sets"
                          value={ex.targetSets}
                          onChange={(e) => {
                            const newDays = [...createForm.days];
                            newDays[dayIdx].exercises[exIdx] = {
                              ...ex,
                              targetSets: parseInt(e.target.value) || 0,
                            };
                            setCreateForm({ ...createForm, days: newDays });
                          }}
                          className="h-7 text-xs w-16"
                        />
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={ex.targetReps}
                          onChange={(e) => {
                            const newDays = [...createForm.days];
                            newDays[dayIdx].exercises[exIdx] = {
                              ...ex,
                              targetReps: parseInt(e.target.value) || 0,
                            };
                            setCreateForm({ ...createForm, days: newDays });
                          }}
                          className="h-7 text-xs w-16"
                        />
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const newDays = [...createForm.days];
                        newDays[dayIdx].exercises.push({
                          exerciseId: "",
                          targetSets: 3,
                          targetReps: 10,
                        });
                        setCreateForm({ ...createForm, days: newDays });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Exercise
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCreateForm({
                    ...createForm,
                    days: [
                      ...createForm.days,
                      {
                        dayOfWeek: (createForm.days.length % 7),
                        name: "",
                        exercises: [
                          { exerciseId: "", targetSets: 3, targetReps: 10 },
                        ],
                      },
                    ],
                  })
                }
              >
                <Plus className="w-3 h-3 mr-1" /> Add Day
              </Button>
              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                Create Plan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan Detail View */}
      {selectedPlan ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlan(null)}
            className="text-xs"
          >
            ← Back to Plans
          </Button>
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedPlan.name}</CardTitle>
                  {selectedPlan.description && (
                    <CardDescription className="mt-1">
                      {selectedPlan.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="secondary" className="bg-brand/10 text-brand">
                  {getAdherence(selectedPlan)}% adherence
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedPlan.days.map((day) => {
                  const isToday = day.dayOfWeek === todayDayOfWeek;
                  const isCompleted = selectedPlan.completions?.some(
                    (c) => c.planDayId === day.id
                  );
                  return (
                    <div
                      key={day.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        isToday && "border-brand/30 bg-brand/5",
                        isCompleted && "bg-accent-green/5 border-accent-green/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {day.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {dayNames[day.dayOfWeek]}
                          </Badge>
                          {isToday && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-brand/10 text-brand">
                              Today
                            </Badge>
                          )}
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-accent-green" />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleCompleteDay(day.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {day.exercises.map((ex, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Dumbbell className="w-3 h-3" />
                            <span>{ex.exerciseName || ex.exerciseId}</span>
                            <span>
                              {ex.targetSets}×{ex.targetReps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Plan List */
        <div className="space-y-3">
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
                <Card className="border-border/50 cursor-pointer hover:border-brand/30 transition-colors">
                  <button
                    className="w-full text-left"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {plan.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {plan.days.length} day
                              {plan.days.length !== 1 ? "s" : ""}
                            </span>
                            {plan.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                · {plan.description}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={getAdherence(plan)}
                              className="h-1.5"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </button>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation */}
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

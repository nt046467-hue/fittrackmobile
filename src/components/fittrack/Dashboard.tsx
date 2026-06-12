"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";
import {
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
  Plus,
  Ruler,
  CalendarCheck,
  ChevronRight,
  RefreshCw,
  Play,
} from "lucide-react";
import { format } from "date-fns";

interface Workout {
  id: string;
  name: string;
  date: string;
  notes?: string;
  exercises: {
    exerciseId: string;
    exerciseName?: string;
    primaryMuscles?: string[];
    sets: { reps: number; weight: number; completed: boolean }[];
  }[];
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  days: {
    id: string;
    dayOfWeek: number;
    name: string;
    exercises: {
      exerciseId: string;
      exerciseName?: string;
      targetSets: number;
      targetReps: number;
    }[];
  }[];
}

export default function Dashboard() {
  const { user, setCurrentPage, unitSystem, currentPage } = useFitTrackStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const [workoutsRes, plansRes] = await Promise.all([
        fetch(`/api/workouts?userId=${user.id}`),
        fetch(`/api/plans?userId=${user.id}`),
      ]);
      if (workoutsRes.ok) {
        const data = await workoutsRes.json();
        setWorkouts(data.workouts || []);
      } else {
        console.error("Failed to fetch workouts:", workoutsRes.status);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }
      if (!workoutsRes.ok || !plansRes.ok) {
        setFetchError(true);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Re-fetch every time user navigates TO dashboard (e.g. after finishing a plan workout)
  useEffect(() => {
    if (currentPage === "dashboard") {
      fetchData();
    }
  }, [currentPage, fetchData]);

  const totalWorkouts = workouts.length;
  const currentStreak = calculateStreak(workouts);
  const totalVolume = calculateTotalVolume(workouts, unitSystem);
  const heaviestLift = calculateHeaviestLift(workouts, unitSystem);

  const recentWorkouts = workouts.slice(0, 5);
  const today = new Date();
  const todayDayOfWeek = today.getDay();

  const todaysPlan = plans.find((p) =>
    p.days.some((d) => d.dayOfWeek === todayDayOfWeek)
  );
  const todaysPlanDay = todaysPlan?.days.find(
    (d) => d.dayOfWeek === todayDayOfWeek
  );

  // Weekly activity — use safe date parsing
  const thisWeekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date + "T00:00:00");
    if (isNaN(d.getTime())) return false;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - todayDayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  });

  const weeklyActivity = Array(7).fill(0);
  thisWeekWorkouts.forEach((w) => {
    const d = new Date(w.date + "T00:00:00");
    if (!isNaN(d.getTime())) {
      weeklyActivity[d.getDay()] = 1;
    }
  });

  const hasNoData = workouts.length === 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Athlete"}
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d")}
        </p>
      </div>

      {/* Fetch Error with Retry */}
      {fetchError && (
        <Card className="border-danger/20 bg-danger/5">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-danger">
              Failed to load some data. Pull to refresh or try again.
            </p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards — show -- for no data instead of 0 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Total Workouts"
          value={hasNoData ? "--" : totalWorkouts}
          variant="brand"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={hasNoData ? "--" : `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`}
          variant="accent"
        />
        <StatCard
          icon={TrendingUp}
          label="All-time Volume"
          value={hasNoData ? "--" : `${totalVolume.toLocaleString()} ${unitSystem === "metric" ? "kg" : "lbs"}`}
        />
        <StatCard
          icon={Trophy}
          label="Heaviest Lift"
          value={hasNoData ? "--" : `${heaviestLift} ${unitSystem === "metric" ? "kg" : "lbs"}`}
        />
      </div>

      {/* Empty State CTA — when no workouts exist */}
      {hasNoData && (
        <Card className="border-brand/20 bg-brand/5 overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Log your first workout</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your exercises, sets, and reps to start seeing your progress here.
              </p>
            </div>
            <Button
              onClick={() => setCurrentPage("log")}
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setCurrentPage("log")}
          className="h-12 bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Start Workout
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentPage("body")}
          className="h-12"
        >
          <Ruler className="w-4 h-4 mr-2" />
          Log Body Metrics
        </Button>
      </div>

      {/* This Week Activity */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            This Week&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {day}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    weeklyActivity[i]
                      ? "bg-accent-green/20 text-accent-green"
                      : i === todayDayOfWeek
                        ? "bg-brand/20 text-brand"
                        : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {weeklyActivity[i] ? "✓" : ""}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Plan — Enhanced with exercise names */}
      {todaysPlanDay && (
        <Card className="border-brand/20 bg-brand/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand" />
                Today&apos;s Plan — {todaysPlanDay.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-brand"
                onClick={() => setCurrentPage("plans")}
              >
                View Plans
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {todaysPlanDay.exercises.length} exercise
              {todaysPlanDay.exercises.length !== 1 ? "s" : ""} planned
            </p>
            {/* Show exercise names */}
            <div className="flex flex-wrap gap-1.5">
              {todaysPlanDay.exercises.slice(0, 3).map((ex, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 bg-brand/10 text-brand"
                >
                  {ex.exerciseName || `Exercise ${i + 1}`}
                </Badge>
              ))}
              {todaysPlanDay.exercises.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground"
                >
                  +{todaysPlanDay.exercises.length - 3} more
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              className="w-full bg-brand hover:bg-brand/90 text-brand-foreground"
              onClick={() => setCurrentPage("plans")}
            >
              <Play className="w-3 h-3 mr-1" />
              Start This Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent Workouts
            </CardTitle>
            {workouts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-brand"
                onClick={() => setCurrentPage("history")}
              >
                View All
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No workouts yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage("log")}
              >
                <Plus className="w-3 h-3 mr-1" />
                Log your first workout
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((workout, idx) => {
                const workoutVolume = workout.exercises.reduce(
                  (total, ex) =>
                    total +
                    ex.sets.reduce(
                      (sTotal, s) =>
                        s.completed ? sTotal + s.weight * s.reps : sTotal,
                      0
                    ),
                  0
                );
                const completedSets = workout.exercises.reduce(
                  (total, ex) =>
                    total + ex.sets.filter((s) => s.completed).length,
                  0
                );
                return (
                  <motion.div
                    key={workout.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {workout.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(workout.date + "T00:00:00"), "MMM d")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {workout.exercises.length} exercise
                          {workout.exercises.length !== 1 ? "s" : ""}
                        </span>
                        {workoutVolume > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {workoutVolume.toLocaleString()} {unitSystem === "metric" ? "kg" : "lbs"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {completedSets} sets
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function calculateStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const sortedDates = workouts
    .map((w) => {
      const d = new Date(w.date + "T00:00:00");
      return isNaN(d.getTime()) ? null : d.toDateString();
    })
    .filter((v, i, a): v is string => v !== null && a.indexOf(v) === i)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(sortedDates[0]);
  firstDate.setHours(0, 0, 0, 0);
  const diffToToday = Math.floor(
    (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffToToday > 1) return 0;

  for (let i = 1; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i - 1]);
    const prev = new Date(sortedDates[i]);
    const diff = Math.floor(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function calculateTotalVolume(
  workouts: Workout[],
  unitSystem: string
): number {
  return workouts.reduce((total, workout) => {
    return (
      total +
      workout.exercises.reduce((exTotal, ex) => {
        return (
          exTotal +
          ex.sets.reduce((setTotal, set) => {
            if (!set.completed) return setTotal;
            const weight = set.weight; // Keep in original unit for display consistency
            return setTotal + weight * set.reps;
          }, 0)
        );
      }, 0)
    );
  }, 0);
}

function calculateHeaviestLift(
  workouts: Workout[],
  _unitSystem: string
): number {
  let heaviest = 0;
  workouts.forEach((workout) => {
    workout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed && set.weight > heaviest) {
          heaviest = set.weight;
        }
      });
    });
  });
  return Math.round(heaviest);
}

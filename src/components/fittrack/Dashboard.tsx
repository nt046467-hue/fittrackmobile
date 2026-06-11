"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    exercises: { exerciseId: string; targetSets: number; targetReps: number }[];
  }[];
}

export default function Dashboard() {
  const { user, setCurrentPage, unitSystem } = useFitTrackStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [workoutsRes, plansRes] = await Promise.all([
          fetch(`/api/workouts?userId=${user.id}`),
          fetch(`/api/plans?userId=${user.id}`),
        ]);
        if (workoutsRes.ok) {
          const data = await workoutsRes.json();
          setWorkouts(data.workouts || []);
        }
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }
      } catch {
        // Data will remain empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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

  // Weekly activity
  const thisWeekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - todayDayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  });

  const weeklyActivity = Array(7).fill(0);
  thisWeekWorkouts.forEach((w) => {
    const d = new Date(w.date);
    weeklyActivity[d.getDay()] = 1;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Athlete"} 👋
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Total Workouts"
          value={totalWorkouts}
          variant="brand"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} day${currentStreak !== 1 ? "s" : ""}`}
          variant="accent"
        />
        <StatCard
          icon={TrendingUp}
          label="All-time Volume"
          value={`${totalVolume.toLocaleString()} ${unitSystem === "metric" ? "kg" : "lbs"}`}
        />
        <StatCard
          icon={Trophy}
          label="Heaviest Lift"
          value={`${heaviestLift} ${unitSystem === "metric" ? "kg" : "lbs"}`}
        />
      </div>

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

      {/* Today's Plan */}
      {todaysPlanDay && (
        <Card className="border-brand/20 bg-brand/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand" />
                Today&apos;s Plan
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
          <CardContent>
            <p className="text-sm font-medium">{todaysPlanDay.name}</p>
            <p className="text-xs text-muted-foreground">
              {todaysPlanDay.exercises.length} exercise
              {todaysPlanDay.exercises.length !== 1 ? "s" : ""} planned
            </p>
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
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-brand"
              onClick={() => setCurrentPage("history")}
            >
              View All
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No workouts yet. Start your first one!
            </p>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((workout, idx) => (
                <motion.div
                  key={workout.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{workout.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(workout.date), "MMM d, yyyy")} ·{" "}
                      {workout.exercises.length} exercise
                      {workout.exercises.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              ))}
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
    .map((w) => new Date(w.date).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

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
            const weight =
              unitSystem === "imperial" ? set.weight * 0.453592 : set.weight;
            return setTotal + weight * set.reps;
          }, 0)
        );
      }, 0)
    );
  }, 0);
}

function calculateHeaviestLift(
  workouts: Workout[],
  unitSystem: string
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

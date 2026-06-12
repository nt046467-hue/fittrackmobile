"use client";

import { useState, useEffect, useMemo } from "react";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { format, parseISO, subMonths, startOfWeek, addDays } from "date-fns";

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "All";

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: {
    exerciseId: string;
    exerciseName?: string;
    sets: { reps: number; weight: number; completed: boolean }[];
  }[];
}

interface Metric {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
}

const volumeChartConfig: ChartConfig = {
  volume: {
    label: "Volume (kg)",
    color: "var(--color-brand)",
  },
};

const frequencyChartConfig: ChartConfig = {
  count: {
    label: "Workouts",
    color: "var(--color-brand)",
  },
};

const weightChartConfig: ChartConfig = {
  weight: {
    label: "Body Weight",
    color: "var(--color-accent-green)",
  },
};

export default function ProgressCharts() {
  const { user, unitSystem } = useFitTrackStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [workoutsRes, metricsRes] = await Promise.all([
          fetch(`/api/workouts?userId=${user.id}`),
          fetch(`/api/body-metrics?userId=${user.id}`),
        ]);
        if (workoutsRes.ok) {
          const data = await workoutsRes.json();
          setWorkouts(data.workouts || []);
        }
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data.metrics || []);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredData = useMemo(() => {
    if (timeRange === "All") return workouts;
    const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[timeRange] || 3;
    const cutoff = subMonths(new Date(), months);
    return workouts.filter((w) => new Date(w.date) >= cutoff);
  }, [workouts, timeRange]);

  // Volume per session
  const volumeData = useMemo(() => {
    return filteredData
      .map((w) => ({
        date: format(parseISO(w.date), "MMM d"),
        volume: Math.round(
          w.exercises.reduce(
            (total, ex) =>
              total +
              ex.sets.reduce(
                (sTotal, s) => (s.completed ? sTotal + s.weight * s.reps : sTotal),
                0
              ),
            0
          )
        ),
      }))
      .reverse();
  }, [filteredData]);

  // Workouts per week
  const frequencyData = useMemo(() => {
    const weekMap = new Map<string, number>();
    filteredData.forEach((w) => {
      const weekStart = format(
        startOfWeek(parseISO(w.date), { weekStartsOn: 0 }),
        "MMM d"
      );
      weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + 1);
    });
    return Array.from(weekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .slice(-12);
  }, [filteredData]);

  // PR tracking per exercise
  const prData = useMemo(() => {
    const exercisePRs = new Map<
      string,
      { name: string; data: { date: string; weight: number }[] }
    >();
    filteredData.forEach((w) => {
      w.exercises.forEach((ex) => {
        const name = ex.exerciseName || ex.exerciseId;
        const maxWeight = Math.max(...ex.sets.map((s) => s.weight), 0);
        if (maxWeight === 0) return;
        if (!exercisePRs.has(ex.exerciseId)) {
          exercisePRs.set(ex.exerciseId, { name, data: [] });
        }
        exercisePRs.get(ex.exerciseId)!.data.push({
          date: format(parseISO(w.date), "MMM d"),
          weight: maxWeight,
        });
      });
    });
    return Array.from(exercisePRs.values()).slice(0, 5);
  }, [filteredData]);

  // Body weight over time
  const bodyWeightData = useMemo(() => {
    return metrics
      .map((m) => ({
        date: format(parseISO(m.date), "MMM d"),
        weight: m.weight,
      }))
      .reverse();
  }, [metrics]);

  // Muscle frequency heatmap
  const muscleHeatmap = useMemo(() => {
    const muscleMap = new Map<string, number>();
    filteredData.forEach((w) => {
      w.exercises.forEach((ex) => {
        // Use exerciseId as proxy since we don't have muscle data in workout
        const name = ex.exerciseName || ex.exerciseId;
        muscleMap.set(name, (muscleMap.get(name) || 0) + 1);
      });
    });
    return Array.from(muscleMap.entries())
      .map(([muscle, count]) => ({ muscle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Progress</h1>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {(["1M", "3M", "6M", "1Y", "All"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Volume Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Volume Per Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {volumeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No workout data yet
            </div>
          ) : (
            <ChartContainer config={volumeChartConfig} className="h-48 w-full">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Workout Frequency */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Workouts Per Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frequencyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No workout data yet
            </div>
          ) : (
            <ChartContainer config={frequencyChartConfig} className="h-48 w-full">
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-brand)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* PR Chart - per exercise */}
      {prData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prData.map((exercise) => (
                <div key={exercise.name}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {exercise.name}
                  </p>
                  <ChartContainer config={volumeChartConfig} className="h-24 w-full">
                    <LineChart data={exercise.data}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9 }}
                        className="text-muted-foreground"
                      />
                      <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-accent-green)"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Weight Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Body Weight Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bodyWeightData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No body metrics logged yet
            </div>
          ) : (
            <ChartContainer config={weightChartConfig} className="h-48 w-full">
              <LineChart data={bodyWeightData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-accent-green)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Muscle Frequency Heatmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Exercise Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          {muscleHeatmap.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No exercise data yet
            </div>
          ) : (
            <div className="space-y-2">
              {muscleHeatmap.map(({ muscle, count }) => {
                const maxCount = Math.max(...muscleHeatmap.map((m) => m.count));
                const intensity = maxCount > 0 ? count / maxCount : 0;
                return (
                  <div key={muscle} className="flex items-center gap-3">
                    <span className="text-xs w-28 truncate">{muscle}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand/60 rounded-full transition-all"
                        style={{ width: `${intensity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

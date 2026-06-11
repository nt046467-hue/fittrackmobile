"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useFitTrackStore } from "@/store/fittrackStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmModal from "./ConfirmModal";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Ruler, Trash2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface Metric {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
}

const weightChartConfig: ChartConfig = {
  weight: {
    label: "Weight",
    color: "var(--color-brand)",
  },
};

export default function BodyMetrics() {
  const { user, unitSystem } = useFitTrackStore();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goalWeight, setGoalWeight] = useState<number | "">("");
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    bodyFat: "",
    waist: "",
    chest: "",
    arms: "",
    thighs: "",
  });

  const unit = unitSystem === "metric" ? "kg" : "lbs";
  const lengthUnit = unitSystem === "metric" ? "cm" : "in";

  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/body-metrics?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics || []);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [user]);

  const latestMetric = metrics[0];

  const weightChartData = useMemo(
    () =>
      metrics
        .map((m) => ({
          date: format(parseISO(m.date), "MMM d"),
          weight: m.weight,
        }))
        .reverse(),
    [metrics]
  );

  // BMI calculation
  const bmi = useMemo(() => {
    if (!latestMetric || !user) return null;
    let weightKg = latestMetric.weight;
    if (unitSystem === "imperial") weightKg = weightKg * 0.453592;
    // Assume average height of 175cm if not available
    const heightM = 1.75;
    const bmiValue = weightKg / (heightM * heightM);
    return bmiValue.toFixed(1);
  }, [latestMetric, user, unitSystem]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return "Underweight";
    if (val < 25) return "Normal";
    if (val < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  const goalProgress = useMemo(() => {
    if (!goalWeight || !latestMetric) return 0;
    const startWeight = metrics[metrics.length - 1]?.weight;
    if (!startWeight) return 0;
    const totalToLose = startWeight - Number(goalWeight);
    if (totalToLose === 0) return 100;
    const lost = startWeight - latestMetric.weight;
    return Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  }, [goalWeight, latestMetric, metrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.weight) {
      toast.error("Weight is required");
      return;
    }
    try {
      const res = await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          date: form.date,
          weight: parseFloat(form.weight as string),
          bodyFat: form.bodyFat ? parseFloat(form.bodyFat as string) : undefined,
          waist: form.waist ? parseFloat(form.waist as string) : undefined,
          chest: form.chest ? parseFloat(form.chest as string) : undefined,
          arms: form.arms ? parseFloat(form.arms as string) : undefined,
          thighs: form.thighs ? parseFloat(form.thighs as string) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setMetrics((prev) => [data.metric, ...prev]);
      setForm({
        date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        bodyFat: "",
        waist: "",
        chest: "",
        arms: "",
        thighs: "",
      });
      toast.success("Body metrics logged!");
    } catch {
      toast.error("Failed to save metrics");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/body-metrics?id=${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMetrics((prev) => prev.filter((m) => m.id !== deleteId));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Ruler className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-bold tracking-tight">Body Metrics</h1>
      </div>

      {/* Quick Stats */}
      {latestMetric && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-lg font-bold">
                {latestMetric.weight} {unit}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">BMI</p>
              <p className="text-lg font-bold">{bmi || "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {bmiCategory}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Body Fat</p>
              <p className="text-lg font-bold">
                {latestMetric.bodyFat ? `${latestMetric.bodyFat}%` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Weight */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Goal Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <Input
              type="number"
              placeholder={`Goal weight (${unit})`}
              value={goalWeight}
              onChange={(e) =>
                setGoalWeight(e.target.value ? Number(e.target.value) : "")
              }
              className="w-40"
            />
            {goalWeight && latestMetric && (
              <span className="text-sm text-muted-foreground">
                {Math.abs(latestMetric.weight - Number(goalWeight))} {unit} to
                go
              </span>
            )}
          </div>
          {goalWeight && (
            <Progress value={goalProgress} className="h-2" />
          )}
        </CardContent>
      </Card>

      {/* Weight Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weightChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No metrics logged yet
            </div>
          ) : (
            <ChartContainer config={weightChartConfig} className="h-48 w-full">
              <LineChart data={weightChartData}>
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
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Log Form */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Log New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Weight ({unit}) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Body Fat (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.bodyFat}
                  onChange={(e) =>
                    setForm({ ...form, bodyFat: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Waist ({lengthUnit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.waist}
                  onChange={(e) =>
                    setForm({ ...form, waist: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Chest ({lengthUnit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.chest}
                  onChange={(e) =>
                    setForm({ ...form, chest: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Arms ({lengthUnit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.arms}
                  onChange={(e) =>
                    setForm({ ...form, arms: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Thighs ({lengthUnit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={form.thighs}
                  onChange={(e) =>
                    setForm({ ...form, thighs: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Metrics
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      {metrics.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {metrics.map((metric) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {format(parseISO(metric.date), "MMM d, yyyy")}
                    </span>
                    <span className="font-medium">
                      {metric.weight} {unit}
                    </span>
                    {metric.bodyFat && (
                      <span className="text-xs text-muted-foreground">
                        {metric.bodyFat}% BF
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-danger shrink-0"
                    onClick={() => setDeleteId(metric.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Entry"
        message="Are you sure you want to delete this body metrics entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  variant?: "default" | "brand" | "accent" | "danger";
}

const variantStyles = {
  default: "bg-card border-border/50",
  brand: "bg-brand/10 border-brand/20",
  accent: "bg-accent-green/10 border-accent-green/20",
  danger: "bg-danger/10 border-danger/20",
};

const iconStyles = {
  default: "text-muted-foreground",
  brand: "text-brand",
  accent: "text-accent-green",
  danger: "text-danger",
};

const deltaStyles = {
  positive: "text-accent-green",
  negative: "text-danger",
  neutral: "text-muted-foreground",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaType = "neutral",
  variant = "default",
}: StatCardProps) {
  return (
    <Card className={cn("border", variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {delta && (
              <p className={cn("text-xs font-medium", deltaStyles[deltaType])}>
                {delta}
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-lg",
              variant === "default" ? "bg-muted" : "bg-background/50"
            )}
          >
            <Icon className={cn("w-5 h-5", iconStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

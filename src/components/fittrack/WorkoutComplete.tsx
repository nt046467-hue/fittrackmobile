"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Dumbbell, Flame, Save, Pencil } from "lucide-react";
import confetti from "canvas-confetti";

interface WorkoutCompleteProps {
  open: boolean;
  onSave: () => void;
  onKeepEditing: () => void;
  totalSets: number;
  totalVolume: number;
  durationMinutes: number;
  exerciseCount: number;
  unitSystem: "metric" | "imperial";
}

export default function WorkoutComplete({
  open,
  onSave,
  onKeepEditing,
  totalSets,
  totalVolume,
  durationMinutes,
  exerciseCount,
  unitSystem,
}: WorkoutCompleteProps) {
  const unit = unitSystem === "metric" ? "kg" : "lbs";

  useEffect(() => {
    if (open) {
      // Fire confetti on mount
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#00C853", "#FFD600", "#FF6D00"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#00C853", "#FFD600", "#FF6D00"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm text-center space-y-6 shadow-2xl"
          >
            {/* Trophy */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto"
            >
              <Trophy className="w-12 h-12 text-accent-green" />
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold">Workout Complete!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Great job finishing your workout
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30">
                <Clock className="w-4 h-4 text-brand mx-auto mb-1" />
                <p className="text-lg font-bold">{formatDuration(durationMinutes)}</p>
                <p className="text-[10px] text-muted-foreground">Duration</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <Dumbbell className="w-4 h-4 text-accent-green mx-auto mb-1" />
                <p className="text-lg font-bold">{exerciseCount}</p>
                <p className="text-[10px] text-muted-foreground">Exercises</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{totalVolume.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{unit} lifted</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{totalSets}</p>
                <p className="text-[10px] text-muted-foreground">Sets done</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-accent-green hover:bg-accent-green/90 text-accent-green-foreground h-12 text-base font-semibold"
                onClick={onSave}
              >
                <Save className="w-5 h-5 mr-2" />
                Save Workout
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onKeepEditing}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Keep Editing
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

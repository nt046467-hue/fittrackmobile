"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useFitTrackStore } from "@/store/fittrackStore";

interface RestTimerProps {
  open: boolean;
  onClose: () => void;
  autoStartSeconds?: number;
}

const presets = [
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "120s", seconds: 120 },
  { label: "180s", seconds: 180 },
];

function TimerContent({ onClose, autoStartSeconds }: { onClose: () => void; autoStartSeconds?: number }) {
  const { restTimerSeconds, setRestTimer } = useFitTrackStore();
  const initialSeconds = autoStartSeconds || restTimerSeconds;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalTime, setTotalTime] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(!!autoStartSeconds);
  const [customTime, setCustomTime] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPlayedSound = useRef(false);
  const hasAutoStarted = useRef(false);

  // Auto-start from prop
  useEffect(() => {
    if (autoStartSeconds && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      setTimeLeft(autoStartSeconds);
      setTotalTime(autoStartSeconds);
      setRestTimer(true, autoStartSeconds);
      setIsRunning(true);
      hasPlayedSound.current = false;
    }
  }, [autoStartSeconds, setRestTimer]);

  // Timer countdown logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          requestAnimationFrame(() => {
            setIsRunning(false);
          });
          if (!hasPlayedSound.current) {
            hasPlayedSound.current = true;
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
            } catch {
              // Audio not available
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handlePreset = useCallback(
    (seconds: number) => {
      setTimeLeft(seconds);
      setTotalTime(seconds);
      setRestTimer(true, seconds);
      setIsRunning(true);
      hasPlayedSound.current = false;
    },
    [setRestTimer]
  );

  const handleCustomTime = useCallback(() => {
    const seconds = parseInt(customTime);
    if (seconds > 0 && seconds <= 600) {
      setTimeLeft(seconds);
      setTotalTime(seconds);
      setRestTimer(true, seconds);
      setIsRunning(true);
      setCustomTime("");
      hasPlayedSound.current = false;
    }
  }, [customTime, setRestTimer]);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(totalTime);
    setIsRunning(false);
    hasPlayedSound.current = false;
  }, [totalTime]);

  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold">Rest Timer</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={cn(
              "transition-all duration-1000",
              timeLeft === 0 ? "text-accent-green" : "text-brand"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums tracking-tight">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {isRunning ? "Running" : timeLeft === 0 ? "Done!" : "Paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          onClick={toggleRunning}
          size="icon"
          className="h-16 w-16 rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {presets.map((preset) => (
          <Button
            key={preset.seconds}
            variant={
              totalTime === preset.seconds ? "default" : "outline"
            }
            size="sm"
            onClick={() => handlePreset(preset.seconds)}
            className={
              totalTime === preset.seconds
                ? "bg-brand text-brand-foreground"
                : ""
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Time */}
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Custom (seconds)"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          min={1}
          max={600}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCustomTime()}
        />
        <Button
          variant="outline"
          onClick={handleCustomTime}
          disabled={!customTime || parseInt(customTime) <= 0}
        >
          Set
        </Button>
      </div>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function RestTimer({ open, onClose, autoStartSeconds }: RestTimerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <TimerContent onClose={onClose} autoStartSeconds={autoStartSeconds} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  unitSystem?: "metric" | "imperial";
  theme?: string;
}

export interface SetInput {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  exerciseName?: string;
  primaryMuscles?: string[];
  sets: SetInput[];
}

export interface CurrentWorkout {
  name: string;
  date: string;
  exercises: WorkoutExerciseInput[];
  notes: string;
}

export type PageName =
  | "dashboard"
  | "log"
  | "history"
  | "progress"
  | "body"
  | "plans"
  | "settings";

interface FitTrackState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Navigation
  currentPage: PageName;
  setCurrentPage: (page: PageName) => void;

  // Workout Logger State
  currentWorkout: CurrentWorkout | null;
  setCurrentWorkout: (workout: CurrentWorkout | null) => void;
  updateCurrentWorkout: (updates: Partial<CurrentWorkout>) => void;
  clearCurrentWorkout: () => void;

  // Rest Timer
  restTimerActive: boolean;
  restTimerSeconds: number;
  setRestTimer: (active: boolean, seconds?: number) => void;

  // Unit system
  unitSystem: "metric" | "imperial";
  setUnitSystem: (system: "metric" | "imperial") => void;

  // Active plan
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
}

export const useFitTrackStore = create<FitTrackState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Navigation
      currentPage: "dashboard",
      setCurrentPage: (currentPage) => set({ currentPage }),

      // Workout Logger State
      currentWorkout: null,
      setCurrentWorkout: (currentWorkout) => set({ currentWorkout }),
      updateCurrentWorkout: (updates) =>
        set((state) => ({
          currentWorkout: state.currentWorkout
            ? { ...state.currentWorkout, ...updates }
            : null,
        })),
      clearCurrentWorkout: () => set({ currentWorkout: null }),

      // Rest Timer
      restTimerActive: false,
      restTimerSeconds: 90,
      setRestTimer: (active, seconds) =>
        set((state) => ({
          restTimerActive: active,
          restTimerSeconds: seconds ?? state.restTimerSeconds,
        })),

      // Unit system
      unitSystem: "metric",
      setUnitSystem: (unitSystem) => set({ unitSystem }),

      // Active plan
      activePlanId: null,
      setActivePlanId: (activePlanId) => set({ activePlanId }),
    }),
    {
      name: "fittrack-storage",
      partialize: (state) => ({
        user: state.user,
        unitSystem: state.unitSystem,
        activePlanId: state.activePlanId,
      }),
    }
  )
);

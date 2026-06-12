"use client";

import { useFitTrackStore, type PageName } from "@/store/fittrackStore";
import AuthForm from "@/components/fittrack/AuthForm";
import Sidebar from "@/components/fittrack/Sidebar";
import MobileNav from "@/components/fittrack/MobileNav";
import Dashboard from "@/components/fittrack/Dashboard";
import WorkoutLogger from "@/components/fittrack/WorkoutLogger";
import WorkoutHistory from "@/components/fittrack/WorkoutHistory";
import ProgressCharts from "@/components/fittrack/ProgressCharts";
import BodyMetrics from "@/components/fittrack/BodyMetrics";
import WorkoutPlans from "@/components/fittrack/WorkoutPlans";
import Settings from "@/components/fittrack/Settings";
import { AnimatePresence, motion } from "framer-motion";

const pageComponents: Record<PageName, React.ComponentType> = {
  dashboard: Dashboard,
  log: WorkoutLogger,
  history: WorkoutHistory,
  progress: ProgressCharts,
  body: BodyMetrics,
  plans: WorkoutPlans,
  settings: Settings,
};

export default function Home() {
  const { user, currentPage } = useFitTrackStore();

  if (!user) {
    return <AuthForm />;
  }

  const PageComponent = pageComponents[currentPage] || Dashboard;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />

      <main className="lg:ml-[240px] pb-20 lg:pb-0">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

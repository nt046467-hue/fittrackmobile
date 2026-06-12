"use client";

import { useFitTrackStore, type PageName } from "@/store/fittrackStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  BarChart3,
  MoreHorizontal,
  Ruler,
  CalendarCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const mainTabs: { page: PageName; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: "log", label: "Log", icon: <Dumbbell className="w-5 h-5" /> },
  { page: "history", label: "History", icon: <History className="w-5 h-5" /> },
  { page: "progress", label: "Progress", icon: <BarChart3 className="w-5 h-5" /> },
];

const moreTabs: { page: PageName; label: string; icon: React.ReactNode }[] = [
  { page: "body", label: "Body Metrics", icon: <Ruler className="w-4 h-4" /> },
  { page: "plans", label: "Plans", icon: <CalendarCheck className="w-4 h-4" /> },
  { page: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function MobileNav() {
  const { currentPage, setCurrentPage } = useFitTrackStore();

  const isMoreActive = moreTabs.some((t) => t.page === currentPage);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.page}
            onClick={() => setCurrentPage(tab.page)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
              currentPage === tab.page
                ? "text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                isMoreActive
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="w-48 mb-2 p-1"
          >
            {moreTabs.map((tab) => (
              <Button
                key={tab.page}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm",
                  currentPage === tab.page && "bg-brand/10 text-brand"
                )}
                onClick={() => {
                  setCurrentPage(tab.page);
                }}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}

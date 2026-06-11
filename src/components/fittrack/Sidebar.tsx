"use client";

import { useFitTrackStore, type PageName } from "@/store/fittrackStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  BarChart3,
  Ruler,
  CalendarCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { motion } from "framer-motion";

const navItems: { page: PageName; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: "log", label: "Log Workout", icon: <Dumbbell className="w-5 h-5" /> },
  { page: "history", label: "History", icon: <History className="w-5 h-5" /> },
  { page: "progress", label: "Progress", icon: <BarChart3 className="w-5 h-5" /> },
  { page: "body", label: "Body Metrics", icon: <Ruler className="w-5 h-5" /> },
  { page: "plans", label: "Plans", icon: <CalendarCheck className="w-5 h-5" /> },
  { page: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, user, setUser } = useFitTrackStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    setUser(null);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-30"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-brand-foreground shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-bold text-lg tracking-tight whitespace-nowrap"
          >
            FitTrack
          </motion.span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0 h-7 w-7"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              currentPage === item.page
                ? "bg-brand text-brand-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </button>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User Info */}
      <div className="p-3 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.photoURL} alt={user?.name} />
            <AvatarFallback className="bg-brand/10 text-brand">
              {user?.photoURL ? initials : <UserIcon className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-danger"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

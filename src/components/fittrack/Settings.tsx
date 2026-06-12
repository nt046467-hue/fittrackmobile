"use client";

import { useState } from "react";
import { useFitTrackStore } from "@/store/fittrackStore";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ConfirmModal from "./ConfirmModal";
import { User, Palette, Ruler, Download, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, setUser, unitSystem, setUnitSystem } = useFitTrackStore();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name,
          unitSystem,
          theme: theme || "dark",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setUser(data.user);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!user) return;
    toast.info("Exporting data...");
    // Build export data
    const exportData = {
      user: { name: user.name, email: user.email },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fittrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  const handleDeleteAccount = () => {
    toast.success("Account deletion requested (demo)");
    setUser(null);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Settings</h1>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL} alt={user?.name} />
              <AvatarFallback className="bg-brand/10 text-brand text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
              size="sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Choose your preferred theme
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? "default" : "outline"}
                  size="sm"
                  className={
                    theme === t
                      ? "bg-brand text-brand-foreground"
                      : ""
                  }
                  onClick={() => setTheme(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Ruler className="w-4 h-4 text-brand" />
            Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Unit System</p>
              <p className="text-xs text-muted-foreground">
                {unitSystem === "metric"
                  ? "Kilograms, centimeters"
                  : "Pounds, inches"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${unitSystem === "metric" ? "font-semibold text-brand" : "text-muted-foreground"}`}
              >
                Metric
              </span>
              <Switch
                checked={unitSystem === "imperial"}
                onCheckedChange={(checked) =>
                  setUnitSystem(checked ? "imperial" : "metric")
                }
              />
              <span
                className={`text-xs ${unitSystem === "imperial" ? "font-semibold text-brand" : "text-muted-foreground"}`}
              >
                Imperial
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-brand" />
            Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Separator className="bg-border/50" />
          <Button
            variant="outline"
            className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 border-danger/20"
            onClick={() => setDeleteAccountOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-brand" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>FitTrack Web v1.0.0</p>
            <p>Built with Next.js, Tailwind CSS, and shadcn/ui</p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation */}
      <ConfirmModal
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your data will be lost."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        destructive
      />
    </div>
  );
}

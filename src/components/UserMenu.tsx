import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { LogOut, Sun, Moon, Bell, Mail, BellRing } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailReminders, setEmailReminders] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const push = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    const loadPrefs = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("email_reminders, weekly_digest")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setEmailReminders(data.email_reminders);
        setWeeklyDigest(data.weekly_digest);
      }
      setPrefsLoaded(true);
    };
    loadPrefs();
  }, [user]);

  const updatePref = useCallback(
    async (field: "email_reminders" | "weekly_digest", value: boolean) => {
      if (!user) return;
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_preferences")
          .update({ [field]: value })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, [field]: value });
      }
    },
    [user]
  );

  if (!user) return null;

  const initials = (user.email ?? "U")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const pushTooltip = !push.supported
    ? "Not supported in this browser"
    : push.permissionState === "denied"
    ? "Permission denied — enable in browser settings"
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Notifications
        </DropdownMenuLabel>

        <div className="px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Event reminders</span>
          </div>
          <Switch
            checked={emailReminders}
            onCheckedChange={(checked) => {
              setEmailReminders(checked);
              updatePref("email_reminders", checked);
            }}
            disabled={!prefsLoaded}
          />
        </div>

        <div className="px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Weekly digest</span>
          </div>
          <Switch
            checked={weeklyDigest}
            onCheckedChange={(checked) => {
              setWeeklyDigest(checked);
              updatePref("weekly_digest", checked);
            }}
            disabled={!prefsLoaded}
          />
        </div>

        <div className="px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Push notifications</span>
          </div>
          {pushTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch checked={false} disabled />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{pushTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Switch
              checked={push.enabled}
              onCheckedChange={push.toggle}
              disabled={push.loading || !prefsLoaded}
            />
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Play, Pause } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSettings,
  updateSettings,
  type AppSettings,
  type Theme,
  type ConflictAction,
} from "@/lib/settings";
import { useTheme } from "@/options/hooks/useTheme";
import { createLogger } from "@/options/lib/logger";

const logger = createLogger("[SettingsCard]");

export const SettingsCard = () => {
  const [settings, setSettings] = useState<AppSettings>({
    showToastNotifications: true,
    theme: "system",
    isPaused: false,
    defaultConflictAction: "uniquify" as ConflictAction,
  });
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    logger.info("Loading settings...");
    getSettings().then((loadedSettings) => {
      logger.info("Settings loaded:", loadedSettings);

      setSettings(loadedSettings);
    });
  }, []);

  const handleToggleToast = async (checked: boolean) => {
    logger.info(`Toggling toast notifications: ${checked}`);
    const newSettings = { ...settings, showToastNotifications: checked };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    logger.info(`Changing theme to: ${newTheme}`);
    await setTheme(newTheme);
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  const handleTogglePause = async (checked: boolean) => {
    logger.info(`Toggling pause state: ${checked}`);
    const newSettings = { ...settings, isPaused: checked };
    setSettings(newSettings);
    await updateSettings({ isPaused: checked });
  };

  const handleConflictActionChange = async (value: string) => {
    logger.info(`Changing default conflict action to: ${value}`);
    const action = value as ConflictAction;
    const newSettings = { ...settings, defaultConflictAction: action };
    logger.info("New settings:", newSettings);
    setSettings(newSettings);
    await updateSettings(newSettings);
    logger.info("Settings updated successfully");
  };

  return (
    <div className="space-y-6 py-4">
      {/* Global Toggle Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Extension Status</h3>
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              {settings.isPaused ? (
                <Pause className="h-4 w-4 text-orange-500" />
              ) : (
                <Play className="h-4 w-4 text-green-500" />
              )}
              <label className="text-sm font-medium">
                {settings.isPaused ? "Paused" : "Active"}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.isPaused
                ? "Downloads use default Chrome behavior"
                : "Downloads are organized by rules"}
            </p>
          </div>
          <Switch
            checked={!settings.isPaused}
            onCheckedChange={(checked) => handleTogglePause(!checked)}
          />
        </div>
      </div>

      {/* Theme Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme</label>
          <p className="text-xs text-muted-foreground">
            Choose how Zen Downloads looks on your device
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => handleThemeChange("system")}
            >
              <Monitor className="h-4 w-4 mr-2" />
              System
            </Button>
          </div>
        </div>
      </div>

      {/* Downloads Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Downloads</h3>
        <div className="space-y-2">
          <label htmlFor="conflict-action" className="text-sm font-medium">
            Default Conflict Action
          </label>
          <p className="text-xs text-muted-foreground">
            What to do when a file with the same name already exists
          </p>
          <Select
            value={settings.defaultConflictAction}
            onValueChange={handleConflictActionChange}
          >
            <SelectTrigger id="conflict-action" className="w-full">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uniquify">
                Uniquify - Add (1), (2)... to filename
              </SelectItem>
              <SelectItem value="overwrite">
                Overwrite - Replace existing file
              </SelectItem>
              <SelectItem value="prompt">Prompt - Ask me what to do</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1">
            <label className="text-sm font-medium">
              Show Toast Notifications
            </label>
            <p className="text-xs text-muted-foreground">
              Display a notification on the page when a download is organized
            </p>
          </div>
          <Switch
            checked={settings.showToastNotifications}
            onCheckedChange={handleToggleToast}
          />
        </div>
      </div>
    </div>
  );
};

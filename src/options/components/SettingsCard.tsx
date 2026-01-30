import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
    <div className="py-6 space-y-8">
      {/* Status Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Status
        </h3>
        <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-zinc-800/50 rounded-lg border border-stone-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            {settings.isPaused ? (
              <Pause className="w-5 h-5 text-stone-400 dark:text-zinc-500" />
            ) : (
              <Play className="w-5 h-5 text-teal-600 dark:text-teal-500" />
            )}
            <div>
              <div className="text-sm font-medium text-stone-700 dark:text-zinc-200">
                {settings.isPaused ? "Paused" : "Active"}
              </div>
              <div className="text-xs text-stone-500 dark:text-zinc-500">
                {settings.isPaused
                  ? "Using default Chrome behavior"
                  : "Organizing downloads by rules"}
              </div>
            </div>
          </div>
          <Switch
            checked={!settings.isPaused}
            onCheckedChange={(checked) => handleTogglePause(!checked)}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Appearance
        </h3>
        <div className="space-y-2">
          <label className="text-sm text-stone-700 dark:text-zinc-300">
            Theme
          </label>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${
                theme === "light"
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-transparent border-stone-300 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200"
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${
                theme === "dark"
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-transparent border-stone-300 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200"
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${
                theme === "system"
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-transparent border-stone-300 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200"
              }`}
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
        <h3 className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Downloads
        </h3>
        <div className="space-y-2">
          <label className="text-sm text-stone-700 dark:text-zinc-300">
            Default Conflict Action
          </label>
          <p className="text-xs text-stone-500 dark:text-zinc-500">
            What to do when a file already exists
          </p>
          <Select
            value={settings.defaultConflictAction}
            onValueChange={handleConflictActionChange}
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700">
              <SelectItem
                value="uniquify"
                className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
              >
                Uniquify - Add (1), (2)...
              </SelectItem>
              <SelectItem
                value="overwrite"
                className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
              >
                Overwrite - Replace existing
              </SelectItem>
              <SelectItem
                value="prompt"
                className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
              >
                Prompt - Ask each time
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Notifications
        </h3>
        <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-zinc-800/50 rounded-lg border border-stone-200 dark:border-zinc-700">
          <div>
            <div className="text-sm font-medium text-stone-700 dark:text-zinc-200">
              Toast Notifications
            </div>
            <div className="text-xs text-stone-500 dark:text-zinc-500">
              Show notifications when files are organized
            </div>
          </div>
          <Switch
            checked={settings.showToastNotifications}
            onCheckedChange={handleToggleToast}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>
      </div>
    </div>
  );
};

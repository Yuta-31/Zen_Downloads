import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Pause, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, type Theme } from "@/lib/settings";
import "@/index.css";

const App = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;

      if (theme === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };

    // Load and apply theme
    getSettings().then((settings) => {
      applyTheme(settings.theme);
    });

    // Listen for theme changes
    const listener = (changes: {
      [k: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.theme) {
        const newTheme = changes.theme.newValue as Theme;
        applyTheme(newTheme);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      getSettings().then((settings) => {
        if (settings.theme === "system") {
          applyTheme("system");
        }
      });
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  // Load initial state from storage
  useEffect(() => {
    chrome.storage.local.get(["settings.isPaused"], (result) => {
      const paused = result["settings.isPaused"] as boolean | undefined;
      setIsPaused(paused ?? false);
      setIsLoading(false);
    });
  }, []);

  // Update storage when state changes
  const handleToggle = async (checked: boolean) => {
    setIsPaused(checked);
    await chrome.storage.local.set({ "settings.isPaused": checked });
  };

  if (isLoading) {
    return (
      <div className="w-80 p-4">
        <div className="text-center text-stone-500 dark:text-stone-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-80">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {isPaused ? (
              <Pause className="w-5 h-5 text-orange-500" />
            ) : (
              <Play className="w-5 h-5 text-green-500" />
            )}
            Zen Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`flex items-center justify-between py-2 transition-all ${
              isPaused ? "opacity-60 grayscale" : ""
            }`}
          >
            <div className="space-y-0.5 flex-1">
              <label className="text-sm font-medium">
                {isPaused ? "Paused" : "Active"}
              </label>
              <p className="text-xs text-muted-foreground">
                {isPaused
                  ? "Downloads use default Chrome behavior"
                  : "Downloads are organized by rules"}
              </p>
            </div>
            <Switch
              checked={!isPaused}
              onCheckedChange={(checked) => handleToggle(checked === false)}
            />
          </div>

          <div className="pt-2 border-t">
            <button
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              Open Settings
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

import { useEffect, useState } from "react";
import { getSettings, updateSettings, type Theme } from "@/lib/settings";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // Load saved theme
    getSettings().then((settings) => {
      setTheme(settings.theme);
      applyTheme(settings.theme);
    });

    // Listen for theme changes
    const listener = (changes: {
      [k: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.theme) {
        const newTheme = changes.theme.newValue as Theme;
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

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

  const setAppTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    await updateSettings({ theme: newTheme });
    applyTheme(newTheme);
  };

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme: setAppTheme };
};

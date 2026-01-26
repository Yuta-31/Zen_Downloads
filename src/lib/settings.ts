import { getSync, setSync } from "@/lib/storage";

export type Theme = "light" | "dark" | "system";
export type ConflictAction = "uniquify" | "overwrite" | "prompt";

export interface AppSettings {
  showToastNotifications: boolean;
  theme: Theme;
  defaultConflictAction: ConflictAction;
}

const DEFAULTS: AppSettings = {
  showToastNotifications: true,
  theme: "system",
  defaultConflictAction: "uniquify",
};

export const getSettings = async (): Promise<AppSettings> => {
  return getSync(DEFAULTS);
};

export const updateSettings = async (
  settings: Partial<AppSettings>,
): Promise<void> => {
  await setSync(settings);
};

export const watchSettings = (
  callback: (settings: AppSettings) => void,
): (() => void) => {
  const listener = (changes: { [k: string]: chrome.storage.StorageChange }) => {
    if (
      changes.showToastNotifications ||
      changes.theme ||
      changes.defaultConflictAction
    ) {
      getSettings().then(callback);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};

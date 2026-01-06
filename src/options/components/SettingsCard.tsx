import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { getSettings, updateSettings, type AppSettings } from "@/lib/settings";

export const SettingsCard = () => {
  const [settings, setSettings] = useState<AppSettings>({
    showToastNotifications: true,
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleToggleToast = async (checked: boolean) => {
    const newSettings = { ...settings, showToastNotifications: checked };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-700">Notifications</h3>
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1">
            <label className="text-sm font-medium text-stone-800">
              Show Toast Notifications
            </label>
            <p className="text-xs text-stone-500">
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

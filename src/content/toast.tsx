import { toast, Toaster } from "sonner";
import "./content.css";
import { createRoot } from "react-dom/client";
import { getSettings } from "@/lib/settings";

// Insert Toaster component into the page
const toasterContainer = document.createElement("div");
toasterContainer.id = "custom-download-path-toaster";
document.body.appendChild(toasterContainer);

const root = document.createElement("div");
toasterContainer.appendChild(root);

// Render Toaster
createRoot(root).render(
  <Toaster position="bottom-right" richColors duration={5000} />,
);

// Listen for download notifications from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "download-organized") {
    // Check settings before showing toast
    getSettings().then((settings) => {
      if (!settings.showToastNotifications) {
        return; // Don't show toast if disabled
      }

      const { ruleName, path } = message.data;
      toast.success("Download organized", {
        description: (
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-semibold">Rule:</span> {ruleName}
            </div>
            <div className="text-xs break-all">
              <span className="font-semibold">Path:</span> {path}
            </div>
          </div>
        ),
      });
    });
  }
});

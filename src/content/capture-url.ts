// Send current page URL to background when download link is clicked
// This allows query parameters to be captured even if referrer doesn't include them

let lastClickedUrl = window.location.href;
let lastClickTime = 0;

// Detect download link clicks
document.addEventListener(
  "click",
  (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (link && link.href) {
      // If this might be a download link
      const url = link.href;
      const hasDownloadAttr = link.hasAttribute("download");
      const isFileLink =
        /\.(pdf|zip|docx?|xlsx?|pptx?|txt|csv|json|xml|png|jpe?g|gif|webp|svg|mp4|mp3|avi|mov|wav)$/i.test(
          url
        );

      if (hasDownloadAttr || isFileLink) {
        lastClickedUrl = window.location.href;
        lastClickTime = Date.now();

        // Send page URL to background
        chrome.runtime.sendMessage({
          type: "CAPTURE_PAGE_URL",
          pageUrl: lastClickedUrl,
          timestamp: lastClickTime,
        });
      }
    }
  },
  true
);

// Also handle right-click -> Save As
document.addEventListener(
  "contextmenu",
  (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");
    const img = target.closest("img");

    if (link || img) {
      lastClickedUrl = window.location.href;
      lastClickTime = Date.now();

      chrome.runtime.sendMessage({
        type: "CAPTURE_PAGE_URL",
        pageUrl: lastClickedUrl,
        timestamp: lastClickTime,
      });
    }
  },
  true
);

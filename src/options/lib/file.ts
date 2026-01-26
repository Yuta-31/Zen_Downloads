import { createLogger } from "@/options/lib/logger";

const logger = createLogger("[File]");

export const downloadJson = (data: unknown, filename: string) => {
  logger.info(`Downloading JSON file: ${filename}`);
  const json = JSON.stringify(data ?? [], null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  logger.info("JSON file download initiated");
};

export const pickFileAsJson = (): Promise<File | null> =>
  new Promise((resolve) => {
    logger.info("Opening file picker for JSON file...");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      if (file) {
        logger.info(`File selected: ${file.name}`);
      } else {
        logger.info("No file selected");
      }
      resolve(file);
    };
    input.click();
  });

const RESERVED = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

export const sanitizeSegment = (name: string): string => {
  let s = name
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/^\.+$/g, "_")
    .replace(/\.+$/g, "")
    .replace(/[ \t]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!s) s = "_";
  const base = s.split(".")[0].toUpperCase();
  if (RESERVED.has(base)) s = `_${s}`;

  return s;
};

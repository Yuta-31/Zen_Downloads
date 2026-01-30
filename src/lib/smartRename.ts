/**
 * Smart Renaming module for generating filenames based on patterns and metadata.
 * Supports various template variables for flexible file naming.
 */

export interface FileMetadata {
  /** The date to use for date-based variables */
  date: Date;
  /** The full domain (e.g., "files.cdn.example.com") */
  domain: string;
  /** The original filename including extension */
  originalName: string;
}

/** Characters that are illegal in filenames on Windows/macOS/Linux */
const ILLEGAL_CHARS_REGEX = /[<>:"/\\|?*]/g;

/**
 * Pads a number with leading zeros to ensure 2 digits
 */
const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Extracts the basename (filename without extension) from a filename
 */
const getBasename = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex <= 0) return filename;
  return filename.substring(0, lastDotIndex);
};

/**
 * Extracts the extension from a filename (lowercase, without dot)
 */
const getExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) return "";
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Extracts the hostname (top-level domain) from a full domain
 * e.g., "files.cdn.example.com" -> "example.com"
 */
const getHostname = (domain: string): string => {
  // Remove port if present
  const domainWithoutPort = domain.split(":")[0];
  const parts = domainWithoutPort.split(".");

  // Handle simple cases
  if (parts.length <= 2) return domainWithoutPort;

  // Return last two parts (e.g., example.com)
  return parts.slice(-2).join(".");
};

/**
 * Sanitizes a filename segment to remove illegal filename characters
 * Does NOT preserve forward slashes - they get replaced with underscore
 */
const sanitizeFilenameSegment = (segment: string): string => {
  return segment
    .replace(ILLEGAL_CHARS_REGEX, "_")
    .replace(/\s+/g, " ") // Normalize internal whitespace
    .trim(); // Trim leading/trailing spaces
};

/**
 * Sanitizes an entire path, processing each path segment separately
 * Path separators (/) from the pattern are preserved
 * But slashes within variable values are converted to underscores
 */
const sanitizePath = (path: string): string => {
  // Normalize backslashes to forward slashes first
  const normalized = path.replace(/\\/g, "/");

  // Split by forward slash, sanitize each segment, rejoin
  return normalized
    .split("/")
    .map((segment) => sanitizeFilenameSegment(segment))
    .join("/");
};

/**
 * Sanitizes a filename, handling basename and extension separately
 * This ensures spaces before the extension are also trimmed
 */
const sanitizeFilename = (filename: string): string => {
  const basename = getBasename(filename);
  const ext = getExtension(filename);
  
  const sanitizedBasename = sanitizeFilenameSegment(basename);
  
  if (ext) {
    return `${sanitizedBasename}.${ext}`;
  }
  return sanitizedBasename;
};

/**
 * Resolves a template variable to its value
 * All values are sanitized to remove illegal filename characters
 */
const resolveVariable = (
  variable: string,
  metadata: FileMetadata,
  basename: string,
  ext: string
): string | null => {
  const { date, domain, originalName } = metadata;

  switch (variable) {
    // Date variables
    case "year":
      return String(date.getFullYear());
    case "month":
      return pad(date.getMonth() + 1);
    case "day":
      return pad(date.getDate());
    case "hour":
      return pad(date.getHours());
    case "minute":
      return pad(date.getMinutes());
    case "second":
      return pad(date.getSeconds());

    // File variables - sanitize to remove illegal chars
    case "original_name":
      return sanitizeFilename(originalName);
    case "basename":
      return sanitizeFilenameSegment(basename);
    case "ext":
      return ext; // Extension is already extracted and clean

    // Domain variables
    case "domain":
      return sanitizeFilenameSegment(domain);
    case "hostname":
      return sanitizeFilenameSegment(getHostname(domain));

    default:
      return null; // Unknown variable
  }
};

/**
 * Checks if a filename ends with the expected extension (case-insensitive)
 */
const hasCorrectExtension = (filename: string, expectedExt: string): boolean => {
  if (!expectedExt) return true;
  const currentExt = getExtension(filename);
  return currentExt.toLowerCase() === expectedExt.toLowerCase();
};

/**
 * Generates a filename based on a pattern and file metadata.
 *
 * @param metadata - Information about the file and download context
 * @param pattern - Template pattern with variables like {year}, {month}, {original_name}, etc.
 * @returns The generated filename with all variables replaced and sanitized
 *
 * @example
 * ```ts
 * const metadata = {
 *   date: new Date("2026-01-30"),
 *   domain: "example.com",
 *   originalName: "report.pdf"
 * };
 * generateFilename(metadata, "{year}-{month}_{original_name}");
 * // Returns: "2026-01_report.pdf"
 * ```
 */
export const generateFilename = (
  metadata: FileMetadata,
  pattern?: string
): string => {
  // If no pattern provided or empty, return original name
  if (!pattern || pattern.trim() === "") {
    return metadata.originalName;
  }

  const basename = getBasename(metadata.originalName);
  const ext = getExtension(metadata.originalName);

  // Replace all variables in the pattern
  let result = pattern.replace(/\{([^}]+)\}/g, (match, variable: string) => {
    const value = resolveVariable(variable, metadata, basename, ext);
    // If variable is unknown, keep the original placeholder
    return value !== null ? value : match;
  });

  // Sanitize the result (but preserve path separators)
  result = sanitizePath(result);

  // Ensure the result has the correct extension if one exists in the original
  if (ext && !hasCorrectExtension(result, ext)) {
    result = `${result}.${ext}`;
  }

  return result;
};

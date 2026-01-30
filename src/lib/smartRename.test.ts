import { describe, it, expect, beforeEach } from "vitest";
import { generateFilename, type FileMetadata } from "./smartRename";

describe("generateFilename", () => {
  let fixedDate: Date;

  beforeEach(() => {
    // Fixed date for consistent testing: 2026-01-30 14:35:22
    fixedDate = new Date("2026-01-30T14:35:22");
  });

  // ---- Basic Replacement ----
  describe("Basic Replacement", () => {
    it("replaces {year}-{month}_{original_name} correctly", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "testfile.pdf",
      };
      const pattern = "{year}-{month}_{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("2026-01_testfile.pdf");
    });

    it("replaces multiple variables in pattern", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "report.docx",
      };
      const pattern = "{year}/{month}/{day}/{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("2026/01/30/report.docx");
    });

    it("returns original name when pattern is empty", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "myfile.txt",
      };
      const result = generateFilename(metadata, "");
      expect(result).toBe("myfile.txt");
    });

    it("returns original name when pattern is undefined", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "myfile.txt",
      };
      const result = generateFilename(metadata);
      expect(result).toBe("myfile.txt");
    });
  });

  // ---- Extension Auto-Correction ----
  describe("Extension Auto-Correction", () => {
    it("appends extension when user forgets {ext}", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "data.csv",
      };
      const pattern = "my_file_{year}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("my_file_2026.csv");
    });

    it("does not duplicate extension when already present", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "data.csv",
      };
      const pattern = "my_file_{year}.csv";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("my_file_2026.csv");
    });

    it("appends extension when pattern uses {ext} placeholder", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "document.pdf",
      };
      const pattern = "renamed_{year}.{ext}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("renamed_2026.pdf");
    });

    it("handles files without extension", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "README",
      };
      const pattern = "backup_{year}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("backup_2026");
    });

    it("handles case-insensitive extension matching", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "image.PNG",
      };
      const pattern = "photo_{year}.png";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("photo_2026.png");
    });
  });

  // ---- Sanitization ----
  describe("Sanitization", () => {
    it("replaces illegal characters with underscore", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "Report: Final / Version.pdf",
      };
      const pattern = "{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("Report_ Final _ Version.pdf");
    });

    it("sanitizes all illegal filename characters", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: 'file<>:"/\\|?*.txt',
      };
      const pattern = "{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("file_________.txt");
    });

    it("sanitizes domain with special characters", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "sub.example.com:8080",
        originalName: "file.txt",
      };
      const pattern = "{domain}/{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("sub.example.com_8080/file.txt");
    });

    it("preserves path separators in pattern", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.pdf",
      };
      const pattern = "downloads/{year}/{month}/{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("downloads/2026/01/file.pdf");
    });

    it("removes leading/trailing spaces from segments", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "  spaced file  .pdf",
      };
      const pattern = "{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("spaced file.pdf");
    });
  });

  // ---- All Variables ----
  describe("All Variables", () => {
    it("replaces {year} with 4-digit year", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{year}.txt");
      expect(result).toBe("2026.txt");
    });

    it("replaces {month} with 2-digit month", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{month}.txt");
      expect(result).toBe("01.txt");
    });

    it("replaces {day} with 2-digit day", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{day}.txt");
      expect(result).toBe("30.txt");
    });

    it("replaces {hour} with 2-digit hour", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{hour}.txt");
      expect(result).toBe("14.txt");
    });

    it("replaces {minute} with 2-digit minute", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{minute}.txt");
      expect(result).toBe("35.txt");
    });

    it("replaces {second} with 2-digit second", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{second}.txt");
      expect(result).toBe("22.txt");
    });

    it("replaces {original_name} with full original filename", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "document.pdf",
      };
      const result = generateFilename(metadata, "backup_{original_name}");
      expect(result).toBe("backup_document.pdf");
    });

    it("replaces {basename} with filename without extension", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "document.pdf",
      };
      const result = generateFilename(metadata, "{basename}_copy.pdf");
      expect(result).toBe("document_copy.pdf");
    });

    it("replaces {ext} with file extension", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.PDF",
      };
      const result = generateFilename(metadata, "renamed.{ext}");
      expect(result).toBe("renamed.pdf");
    });

    it("replaces {domain} with full domain", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "sub.example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{domain}/{original_name}");
      expect(result).toBe("sub.example.com/file.txt");
    });

    it("replaces {hostname} with top-level domain", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "files.cdn.example.com",
        originalName: "file.txt",
      };
      const result = generateFilename(metadata, "{hostname}/{original_name}");
      expect(result).toBe("example.com/file.txt");
    });

    it("handles all variables in a single pattern", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "downloads.example.com",
        originalName: "report.xlsx",
      };
      const pattern =
        "{hostname}/{year}/{month}/{day}/{hour}-{minute}-{second}_{basename}.{ext}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("example.com/2026/01/30/14-35-22_report.xlsx");
    });
  });

  // ---- Edge Cases ----
  describe("Edge Cases", () => {
    it("handles empty original name", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "",
      };
      const result = generateFilename(metadata, "{year}_{original_name}");
      expect(result).toBe("2026_");
    });

    it("handles original name with multiple dots", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.name.with.dots.tar.gz",
      };
      const pattern = "{basename}.{ext}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("file.name.with.dots.tar.gz");
    });

    it("handles unknown variables by keeping them as-is", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const pattern = "{unknown_var}_{year}.txt";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("{unknown_var}_2026.txt");
    });

    it("handles single-character extension", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.c",
      };
      const pattern = "{basename}_backup";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("file_backup.c");
    });

    it("handles very long filenames", () => {
      const longName = "a".repeat(200) + ".txt";
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: longName,
      };
      const result = generateFilename(metadata, "{original_name}");
      expect(result).toBe(longName);
    });

    it("handles unicode characters in filename", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "文書ファイル.pdf",
      };
      const pattern = "{year}_{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("2026_文書ファイル.pdf");
    });

    it("normalizes backslashes to forward slashes", () => {
      const metadata: FileMetadata = {
        date: fixedDate,
        domain: "example.com",
        originalName: "file.txt",
      };
      const pattern = "folder\\subfolder\\{original_name}";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("folder/subfolder/file.txt");
    });
  });

  // ---- Date Edge Cases ----
  describe("Date Edge Cases", () => {
    it("pads single-digit month correctly", () => {
      const metadata: FileMetadata = {
        date: new Date("2026-05-09T08:05:03"),
        domain: "example.com",
        originalName: "file.txt",
      };
      const pattern = "{year}-{month}-{day}_{hour}-{minute}-{second}.txt";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("2026-05-09_08-05-03.txt");
    });

    it("handles end of year date", () => {
      const metadata: FileMetadata = {
        date: new Date("2026-12-31T23:59:59"),
        domain: "example.com",
        originalName: "file.txt",
      };
      const pattern = "{year}-{month}-{day}.txt";
      const result = generateFilename(metadata, pattern);
      expect(result).toBe("2026-12-31.txt");
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  globToRegExp,
  isInDomain,
  buildCtx,
  matchAll,
  matchUnifiedCondition,
  matchAllUnifiedConditions,
  matchRule,
  type EvalCtx,
} from "@/lib/rules/engine";
import type { UnifiedCondition, Rule } from "@/schemas/rules";

// ---- globToRegExp ----------------------------------------------------------

describe("globToRegExp", () => {
  it("`*` matches any string", () => {
    const re = globToRegExp("*");
    expect(re.test("")).toBe(true);
    expect(re.test("hello")).toBe(true);
    expect(re.test("foo/bar.pdf")).toBe(true);
  });

  it("Simple glob patterns can be correctly converted to regex", () => {
    const re = globToRegExp("foo*bar");
    expect(re.test("foobar")).toBe(true);
    expect(re.test("foo---bar")).toBe(true);
    expect(re.test("foobazbar")).toBe(true);
    expect(re.test("foobazbaz")).toBe(false);
  });

  it("Regex metacharacters are escaped and handled correctly", () => {
    const re = globToRegExp("file(1).pdf");
    expect(re.test("file(1).pdf")).toBe(true);
    expect(re.test("file[1].pdf")).toBe(false);
  });

  it("Matches case-insensitively", () => {
    const re = globToRegExp("FILE*PDF");
    expect(re.test("file.pdf")).toBe(true);
    expect(re.test("File-1.Pdf")).toBe(true);
  });
});

// ---- inDomain --------------------------------------------------------------

describe("isInDomain", () => {
  it("Can determine domain with exact match", () => {
    expect(isInDomain(["example.com"], "example.com")).toBe(true);
    expect(isInDomain(["example.com"], "test.example.com")).toBe(false);
  });

  it("Can match patterns with wildcards", () => {
    expect(isInDomain(["*.example.com"], "foo.example.com")).toBe(true);
    expect(isInDomain(["*.example.com"], "bar.foo.example.com")).toBe(true);
    expect(isInDomain(["*.example.com"], "example.com")).toBe(false);
  });

  it("Returns true if any of multiple patterns match", () => {
    expect(isInDomain(["a.com", "*.example.com"], "sub.example.com")).toBe(
      true
    );
    expect(isInDomain(["a.com", "b.com"], "c.com")).toBe(false);
  });
});

// ---- buildCtx --------------------------------------------------------------

describe("buildCtx", () => {
  it("Can correctly build EvalCtx from URL", () => {
    const ctx = buildCtx(
      "https://example.com:8080/foo/bar/file.pdf?foo=bar&baz=1#section"
    );

    expect(ctx.url).toBe(
      "https://example.com:8080/foo/bar/file.pdf?foo=bar&baz=1#section"
    );
    expect(ctx.protocol).toBe("https");
    expect(ctx.host).toBe("example.com");
    expect(ctx.port).toBe("8080");
    expect(ctx.path).toBe("/foo/bar/file.pdf");
    expect(ctx.pathSegments).toEqual(["foo", "bar", "file.pdf"]);
    expect(ctx.query).toEqual({ foo: "bar", baz: "1" });
    expect(ctx.hash).toBe("section");
    expect(ctx.file).toBe("file.pdf");
    expect(ctx.basename).toBe("file");
    expect(ctx.ext).toBe("pdf");
    expect(ctx.now).toBeInstanceOf(Date);
  });

  it("If filename is not in path, use 'download' as default name", () => {
    const ctx = buildCtx("https://example.com/");
    expect(ctx.file).toBe("download");
    expect(ctx.basename).toBe("download");
    expect(ctx.ext).toBe("");

    const ctx2 = buildCtx("https://example.com/path/to/");
    expect(ctx2.file).toBe("download");
    expect(ctx2.basename).toBe("download");
    expect(ctx2.ext).toBe("");

    const ctx3 = buildCtx("https://example.com/path/to");
    expect(ctx3.file).toBe("download");
    expect(ctx3.basename).toBe("download");
    expect(ctx3.ext).toBe("");
  });

  it("filenameHint takes priority for filename determination", () => {
    const ctx = buildCtx("https://example.com/download", "report.csv");
    expect(ctx.file).toBe("report.csv");
    expect(ctx.basename).toBe("report");
    expect(ctx.ext).toBe("csv");
  });

  it("Can handle long file names correctly", () => {
    const ctx = buildCtx(
      "https://example.com/very/long/path/to/a/very/long/file-example_DOCX_500kB.docx"
    );
    expect(ctx.file).toBe("file-example_DOCX_500kB.docx");
    expect(ctx.basename).toBe("file-example_DOCX_500kB");
    expect(ctx.ext).toBe("docx");
  });

  it("port is omitted if not specified", () => {
    const ctx = buildCtx("https://example.com/");
    expect(ctx.host).toBe("example.com");
    expect(ctx.port).toBeUndefined();
  });
});

// ---- matchAll --------------------------------------------------------------

describe("matchAll", () => {
  const baseCtx: EvalCtx = buildCtx(
    "https://sub.example.com:443/reports/2025/file.pdf?foo=bar&mode=download#top"
  );

  it("Returns true when all conditions are met", () => {
    const conditions = [
      { key: "host", op: "contains", value: "example.com" },
      { key: "path", op: "startsWith", value: "/reports" },
      { key: "ext", op: "equals", value: "pdf" },
      { key: "query.foo", op: "equals", value: "bar" },
      { key: "hash", op: "equals", value: "top" },
    ];

    expect(matchAll(conditions as any, baseCtx)).toBe(true);
  });

  it("Returns false if any one condition is not met", () => {
    const conditions = [
      { key: "host", op: "equals", value: "example.com" },
      // host is sub.example.com so no match
    ];

    expect(matchAll(conditions as any, baseCtx)).toBe(false);
  });

  it("Can handle array values + in / notIn", () => {
    const conditionsIn = [
      {
        key: "ext",
        op: "in",
        value: ["pdf", "docx"],
      },
    ];

    const conditionsNotIn = [
      {
        key: "ext",
        op: "notIn",
        value: ["zip", "tar"],
      },
    ];

    expect(matchAll(conditionsIn as any, baseCtx)).toBe(true);
    expect(matchAll(conditionsNotIn as any, baseCtx)).toBe(true);
  });

  it("Can handle various operators like glob / matches / path[n]", () => {
    // url key becomes "" in getVal, so extend for testing
    const ctxWithUrlKey: EvalCtx = {
      ...baseCtx,
      // matchAll's getVal does not check url key,
      // so change matches target to path for testing
    };

    const conditionsFixed = [
      { key: "path[0]", op: "equals", value: "reports" },
      { key: "basename", op: "glob", value: "file*" },
      {
        key: "path",
        op: "matches",
        value: "/reports/2025/.+\\.pdf",
      },
    ];

    expect(matchAll(conditionsFixed as any, ctxWithUrlKey)).toBe(true);
  });
});

// ---- matchUnifiedCondition -------------------------------------------------

describe("matchUnifiedCondition", () => {
  const baseCtx: EvalCtx = buildCtx(
    "https://sub.example.com/downloads/report.pdf?page=1",
    "report.pdf",
    "https://docs.example.com/viewer?id=123"
  );

  describe("conditionType: domain", () => {
    it("matches domain with contains", () => {
      const condition: UnifiedCondition = {
        conditionType: "domain",
        matchType: "contains",
        value: "example.com",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches domain with exact", () => {
      const condition: UnifiedCondition = {
        conditionType: "domain",
        matchType: "exact",
        value: "sub.example.com",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);

      const noMatch: UnifiedCondition = {
        conditionType: "domain",
        matchType: "exact",
        value: "example.com",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(noMatch, baseCtx)).toBe(false);
    });

    it("matches domain with glob pattern", () => {
      const condition: UnifiedCondition = {
        conditionType: "domain",
        matchType: "glob",
        value: "*.example.com",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("also checks referrer host for domain matching", () => {
      const condition: UnifiedCondition = {
        conditionType: "domain",
        matchType: "contains",
        value: "docs.example.com",
        caseSensitive: false,
      };
      // Should match referrer host
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });
  });

  describe("conditionType: extension", () => {
    it("matches extension with exact", () => {
      const condition: UnifiedCondition = {
        conditionType: "extension",
        matchType: "exact",
        value: "pdf",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches extension with in (array)", () => {
      const condition: UnifiedCondition = {
        conditionType: "extension",
        matchType: "in",
        value: ["pdf", "doc", "docx"],
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("does not match extension with not_in (array)", () => {
      const condition: UnifiedCondition = {
        conditionType: "extension",
        matchType: "not_in",
        value: ["pdf", "doc"],
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(false);
    });

    it("matches extension with regex", () => {
      const condition: UnifiedCondition = {
        conditionType: "extension",
        matchType: "regex",
        value: "^(pdf|docx?)$",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });
  });

  describe("conditionType: filename", () => {
    it("matches filename with contains", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "contains",
        value: "report",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches filename with starts_with", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "starts_with",
        value: "rep",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches filename with ends_with", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "ends_with",
        value: ".pdf",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches filename with glob", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "glob",
        value: "*.pdf",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });
  });

  describe("conditionType: path", () => {
    it("matches path with contains", () => {
      const condition: UnifiedCondition = {
        conditionType: "path",
        matchType: "contains",
        value: "/downloads/",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches path with starts_with", () => {
      const condition: UnifiedCondition = {
        conditionType: "path",
        matchType: "starts_with",
        value: "/downloads",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("matches path with regex", () => {
      const condition: UnifiedCondition = {
        conditionType: "path",
        matchType: "regex",
        value: "^/downloads/.*\\.pdf$",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });
  });

  describe("conditionType: mime", () => {
    it("matches mime type when available", () => {
      const ctxWithMime: EvalCtx = {
        ...baseCtx,
        mime: "application/pdf",
      };
      const condition: UnifiedCondition = {
        conditionType: "mime",
        matchType: "exact",
        value: "application/pdf",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, ctxWithMime)).toBe(true);
    });

    it("matches mime with contains", () => {
      const ctxWithMime: EvalCtx = {
        ...baseCtx,
        mime: "application/pdf",
      };
      const condition: UnifiedCondition = {
        conditionType: "mime",
        matchType: "contains",
        value: "pdf",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, ctxWithMime)).toBe(true);
    });
  });

  describe("case sensitivity", () => {
    it("case insensitive matching by default", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "contains",
        value: "REPORT",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(true);
    });

    it("case sensitive matching when enabled", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "contains",
        value: "REPORT",
        caseSensitive: true,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(false);
    });
  });

  describe("invalid regex handling", () => {
    it("returns false for invalid regex pattern", () => {
      const condition: UnifiedCondition = {
        conditionType: "filename",
        matchType: "regex",
        value: "[invalid(regex",
        caseSensitive: false,
      };
      expect(matchUnifiedCondition(condition, baseCtx)).toBe(false);
    });
  });
});

// ---- matchAllUnifiedConditions ---------------------------------------------

describe("matchAllUnifiedConditions", () => {
  const baseCtx: EvalCtx = buildCtx(
    "https://docs.example.com/reports/2025/annual-report.pdf"
  );

  it("returns true when all conditions match (AND logic)", () => {
    const conditions: UnifiedCondition[] = [
      {
        conditionType: "domain",
        matchType: "contains",
        value: "example.com",
        caseSensitive: false,
      },
      {
        conditionType: "extension",
        matchType: "exact",
        value: "pdf",
        caseSensitive: false,
      },
      {
        conditionType: "path",
        matchType: "contains",
        value: "/reports/",
        caseSensitive: false,
      },
    ];
    expect(matchAllUnifiedConditions(conditions, baseCtx)).toBe(true);
  });

  it("returns false if any condition fails", () => {
    const conditions: UnifiedCondition[] = [
      {
        conditionType: "domain",
        matchType: "contains",
        value: "example.com",
        caseSensitive: false,
      },
      {
        conditionType: "extension",
        matchType: "exact",
        value: "docx", // Will fail - file is .pdf
        caseSensitive: false,
      },
    ];
    expect(matchAllUnifiedConditions(conditions, baseCtx)).toBe(false);
  });

  it("returns true for empty conditions array", () => {
    expect(matchAllUnifiedConditions([], baseCtx)).toBe(true);
  });
});

// ---- matchRule -------------------------------------------------------------

describe("matchRule", () => {
  const baseCtx: EvalCtx = buildCtx(
    "https://docs.example.com/reports/2025/annual-report.pdf"
  );

  it("matches rule with unified conditions", () => {
    const rule: Rule = {
      id: "test-1",
      name: "Test Rule",
      enabled: true,
      domains: ["*"],
      conditions: [],
      unifiedConditions: [
        {
          conditionType: "extension",
          matchType: "in",
          value: ["pdf", "doc", "docx"],
          caseSensitive: false,
        },
      ],
      actions: { pathTemplate: "{host}/{file}" },
    };
    expect(matchRule(rule, baseCtx)).toBe(true);
  });

  it("falls back to legacy domains when no unified conditions", () => {
    const rule: Rule = {
      id: "test-2",
      name: "Legacy Domain Rule",
      enabled: true,
      domains: ["*.example.com"],
      conditions: [],
      unifiedConditions: [],
      actions: { pathTemplate: "{host}/{file}" },
    };
    expect(matchRule(rule, baseCtx)).toBe(true);
  });

  it("falls back to legacy conditions when no unified conditions", () => {
    const rule: Rule = {
      id: "test-3",
      name: "Legacy Conditions Rule",
      enabled: true,
      domains: ["*"],
      conditions: [{ key: "ext", op: "in", value: ["pdf", "docx"] }],
      unifiedConditions: [],
      actions: { pathTemplate: "{host}/{file}" },
    };
    expect(matchRule(rule, baseCtx)).toBe(true);
  });

  it("unified conditions take precedence over legacy", () => {
    const rule: Rule = {
      id: "test-4",
      name: "Mixed Rule",
      enabled: true,
      domains: ["other.com"], // Would not match
      conditions: [{ key: "ext", op: "equals", value: "zip" }], // Would not match
      unifiedConditions: [
        {
          conditionType: "domain",
          matchType: "contains",
          value: "example.com",
          caseSensitive: false,
        },
      ],
      actions: { pathTemplate: "{host}/{file}" },
    };
    // Should match because unified conditions take precedence
    expect(matchRule(rule, baseCtx)).toBe(true);
  });

  it("does not match when unified conditions fail", () => {
    const rule: Rule = {
      id: "test-5",
      name: "No Match Rule",
      enabled: true,
      domains: ["*"],
      conditions: [],
      unifiedConditions: [
        {
          conditionType: "extension",
          matchType: "exact",
          value: "zip",
          caseSensitive: false,
        },
      ],
      actions: { pathTemplate: "{host}/{file}" },
    };
    expect(matchRule(rule, baseCtx)).toBe(false);
  });

  it("matches complex multi-condition rule", () => {
    const rule: Rule = {
      id: "test-6",
      name: "Complex Rule",
      enabled: true,
      domains: ["*"],
      conditions: [],
      unifiedConditions: [
        {
          conditionType: "domain",
          matchType: "glob",
          value: "*.example.com",
          caseSensitive: false,
        },
        {
          conditionType: "extension",
          matchType: "in",
          value: ["pdf", "doc", "docx"],
          caseSensitive: false,
        },
        {
          conditionType: "filename",
          matchType: "contains",
          value: "report",
          caseSensitive: false,
        },
      ],
      actions: { pathTemplate: "{host}/reports/{file}" },
    };
    expect(matchRule(rule, baseCtx)).toBe(true);
  });
});

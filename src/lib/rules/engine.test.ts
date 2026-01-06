/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  globToRegExp,
  isInDomain,
  buildCtx,
  matchAll,
  type EvalCtx,
} from "@/lib/rules/engine";

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

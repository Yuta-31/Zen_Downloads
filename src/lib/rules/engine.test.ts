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
  it("`*` は任意の文字列にマッチする", () => {
    const re = globToRegExp("*");
    expect(re.test("")).toBe(true);
    expect(re.test("hello")).toBe(true);
    expect(re.test("foo/bar.pdf")).toBe(true);
  });

  it("簡単なグロブを正しく正規表現に変換できる", () => {
    const re = globToRegExp("foo*bar");
    expect(re.test("foobar")).toBe(true);
    expect(re.test("foo---bar")).toBe(true);
    expect(re.test("foobazbar")).toBe(true);
    expect(re.test("foobazbaz")).toBe(false);
  });

  it("正規表現のメタ文字をエスケープして扱える", () => {
    const re = globToRegExp("file(1).pdf");
    expect(re.test("file(1).pdf")).toBe(true);
    expect(re.test("file[1].pdf")).toBe(false);
  });

  it("大文字小文字を区別せずにマッチする", () => {
    const re = globToRegExp("FILE*PDF");
    expect(re.test("file.pdf")).toBe(true);
    expect(re.test("File-1.Pdf")).toBe(true);
  });
});

// ---- inDomain --------------------------------------------------------------

describe("isInDomain", () => {
  it("完全一致でドメインを判定できる", () => {
    expect(isInDomain(["example.com"], "example.com")).toBe(true);
    expect(isInDomain(["example.com"], "test.example.com")).toBe(false);
  });

  it("ワイルドカードを含むパターンで判定できる", () => {
    expect(isInDomain(["*.example.com"], "foo.example.com")).toBe(true);
    expect(isInDomain(["*.example.com"], "bar.foo.example.com")).toBe(true);
    expect(isInDomain(["*.example.com"], "example.com")).toBe(false);
  });

  it("複数パターンの中のどれかにマッチすれば true", () => {
    expect(isInDomain(["a.com", "*.example.com"], "sub.example.com")).toBe(
      true
    );
    expect(isInDomain(["a.com", "b.com"], "c.com")).toBe(false);
  });
});

// ---- buildCtx --------------------------------------------------------------

describe("buildCtx", () => {
  it("URL から EvalCtx を正しく構築できる", () => {
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

  it("ファイル名がパスに含まれない場合は download をデフォルト名として扱う", () => {
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

  it("filenameHint を優先してファイル名を決定する", () => {
    const ctx = buildCtx("https://example.com/download", "report.csv");
    expect(ctx.file).toBe("report.csv");
    expect(ctx.basename).toBe("report");
    expect(ctx.ext).toBe("csv");
  });

  it("file 名が長くても正常に処理できる", () => {
    const ctx = buildCtx(
      "https://example.com/very/long/path/to/a/very/long/file-example_DOCX_500kB.docx"
    );
    expect(ctx.file).toBe("file-example_DOCX_500kB.docx");
    expect(ctx.basename).toBe("file-example_DOCX_500kB");
    expect(ctx.ext).toBe("docx");
  });

  it("port が指定されていない場合は省略される", () => {
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

  it("全ての条件を満たす場合 true を返す", () => {
    const conditions = [
      { key: "host", op: "contains", value: "example.com" },
      { key: "path", op: "startsWith", value: "/reports" },
      { key: "ext", op: "equals", value: "pdf" },
      { key: "query.foo", op: "equals", value: "bar" },
      { key: "hash", op: "equals", value: "top" },
    ];

    expect(matchAll(conditions as any, baseCtx)).toBe(true);
  });

  it("どれか 1 つでも条件を満たさない場合は false を返す", () => {
    const conditions = [
      { key: "host", op: "equals", value: "example.com" },
      // host は sub.example.com なので不一致
    ];

    expect(matchAll(conditions as any, baseCtx)).toBe(false);
  });

  it("配列値 + in / notIn を扱える", () => {
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

  it("glob / matches / path[n] など各種 operator を扱える", () => {
    // url キーは getVal で "" になるので、テスト用に拡張する
    const ctxWithUrlKey: EvalCtx = {
      ...baseCtx,
      // matchAll の getVal では url キーを見ていないので、
      // ここでは matches の対象を path に変更してテストする
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

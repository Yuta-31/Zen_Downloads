import { describe, it, expect } from "vitest";
import { expandTemplate } from "./template";
import { buildCtx } from "./engine";

describe("expandTemplate", () => {
  it("should replace {host} with the host value in the template", () => {
    const testUrl = "https://example.com/api/v1/users.json";
    const ctx = buildCtx(testUrl);
    ctx.now = new Date("2023-10-01");
    const template = "{host}/images/{ext}/{yyyy-mm-dd}/{file}";
    const result = expandTemplate(template, ctx);
    expect(result).toBe(`example.com/images/json/2023-10-01/users.json`);
  });

  it("should file is correctly with the the value in the template", () => {
    const testUrl =
      "https://file-examples.com/st/fe8f4c5/file-example_DOCX_500kB.docx";
    const ctx = buildCtx(testUrl);
    ctx.now = new Date("2023-10-01");
    const template = "{host}//{file}";
    const result = expandTemplate(template, ctx);
    expect(result).toBe(`file-examples.com//file-example_DOCX_500kB.docx`);
  });
});

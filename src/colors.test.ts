import { describe, expect, it } from "vitest";
import { compareTokens, contrastRatio, parseColor, parseTokens } from "./colors";

describe("WCAG contrast", () => {
  it("returns the known black and white ratio", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });

  it("parses common solid color formats and rejects transparent colors", () => {
    expect(parseColor("rgb(255, 0, 12)")).toEqual({ red: 255, green: 0, blue: 12 });
    expect(parseColor("rgba(0, 0, 0, 0.4)")).toBeNull();
    expect(parseColor("not-a-color")).toBeNull();
  });

  it("reads CSS properties and nested design token values", () => {
    expect(parseTokens(":root { --ink: #123; --spacing: 8px; }", "css")).toEqual([{ name: "ink", value: "#123" }]);
    expect(parseTokens('{"color":{"text":{"$value":"#112233","$type":"color"}}}', "json")).toEqual([
      { name: "color.text", value: "#112233" },
    ]);
  });

  it("reports added, removed, and changed token names", () => {
    const changes = compareTokens([{ name: "ink", value: "#000" }, { name: "old", value: "#fff" }],
      [{ name: "ink", value: "#111" }, { name: "new", value: "#fff" }]);
    expect(changes.map((change) => change.kind)).toEqual(["changed", "added", "removed"]);
  });
});


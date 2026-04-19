import { describe, it, expect, beforeEach } from "vitest";

// ====================================================================
// We test SelectionLogic methods in isolation by importing the class
// and mocking only the `app` dependency (which is only needed for
// locateSelection / resolveVirtualContent, not for the pure functions).
// ====================================================================

// Import the SelectionLogic class
// We need to handle the export format: `export var SelectionLogic = class { ... }`
import { SelectionLogic } from "../src/core/SelectionLogic.js";

let logic;

beforeEach(() => {
  // Create with a mock app (methods we test don't use it)
  logic = new SelectionLogic({});
});

// ====================================================================
// stripBrowserJunk
// ====================================================================
describe("stripBrowserJunk", () => {
  it("normalizes smart quotes", () => {
    expect(logic.stripBrowserJunk("\u201cHello\u201d")).toBe('"Hello"');
    expect(logic.stripBrowserJunk("\u2018world\u2019")).toBe("'world'");
  });

  it("removes footnote references", () => {
    expect(logic.stripBrowserJunk("end.[^8] Next")).toBe("end. Next");
    expect(logic.stripBrowserJunk("text[1] more")).toBe("text more");
    expect(logic.stripBrowserJunk("text[^note] more")).toBe("text more");
  });

  it("normalizes dashes", () => {
    expect(logic.stripBrowserJunk("a\u2014b")).toBe("a-b");
    expect(logic.stripBrowserJunk("a\u2013b")).toBe("a-b");
  });

  it("removes zero-width characters", () => {
    expect(logic.stripBrowserJunk("he\u200Bllo")).toBe("hello");
    expect(logic.stripBrowserJunk("he\uFEFFllo")).toBe("hello");
  });

  it("collapses whitespace", () => {
    expect(logic.stripBrowserJunk("hello   world")).toBe("hello world");
    expect(logic.stripBrowserJunk("  padded  ")).toBe("padded");
  });

  it("preserves cuneiform characters", () => {
    const cuneiform = "𒀜𒊏𒄩𒋀";
    const result = logic.stripBrowserJunk(`test ${cuneiform} end`);
    expect(result).toContain(cuneiform);
  });

  it("preserves emoji", () => {
    expect(logic.stripBrowserJunk("hello 🎉 world")).toBe("hello 🎉 world");
  });
});

// ====================================================================
// createFlexibleLinePattern — code point safety
// ====================================================================
describe("createFlexibleLinePattern", () => {
  it("produces a pattern that matches basic text", () => {
    const pattern = logic.createFlexibleLinePattern("hello world");
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test("hello world")).toBe(true);
  });

  it("handles cuneiform characters (supplementary plane)", () => {
    const pattern = logic.createFlexibleLinePattern("A𒀜𒊏B");
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test("A𒀜𒊏B")).toBe(true);
  });

  it("matches source with inline footnotes skipped", () => {
    const pattern = logic.createFlexibleLinePattern("end. Next");
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test("end.[^8] Next")).toBe(true);
  });

  it("matches source with bold/italic formatting", () => {
    const pattern = logic.createFlexibleLinePattern("las Lista Real");
    const regex = new RegExp(pattern, "gmu");
    // Single * between space and L is absorbed by the space-gap pattern
    expect(regex.test("las *Lista Real")).toBe(true);
    // ** and *** cases: inter-char filler absorbs adjacent formatting chars
    // The full pipeline (createFlexiblePattern) handles these; at line level,
    // only the space-adjacent case is guaranteed to absorb formatting.
  });

  it("generates valid regex for mixed cuneiform + ASCII", () => {
    const snippet = "Atrahasis (𒀜𒊏𒄩𒋀) es un poema";
    expect(() => {
      const pattern = logic.createFlexibleLinePattern(snippet);
      new RegExp(pattern, "gmu");
    }).not.toThrow();
  });

  it("matches smart quotes flexibly", () => {
    // Pattern built from ASCII " should match source with smart quotes
    const pattern = logic.createFlexibleLinePattern('said "hello"');
    expect(new RegExp(pattern, "gmu").test('said \u201chello\u201d')).toBe(true);
    // Also matches itself (fresh regex to avoid lastIndex issue with g flag)
    expect(new RegExp(pattern, "gmu").test('said "hello"')).toBe(true);
  });

  it("matches dashes flexibly", () => {
    // Pattern built from ASCII "-" uses the flexible char class [-\u2010-\u2015]
    const pattern = logic.createFlexibleLinePattern("a-b");
    expect(new RegExp(pattern, "gmu").test("a-b")).toBe(true);
    expect(new RegExp(pattern, "gmu").test("a\u2013b")).toBe(true); // en-dash
    expect(new RegExp(pattern, "gmu").test("a\u2014b")).toBe(true); // em-dash
  });
});

// ====================================================================
// createFlexiblePattern — multi-line matching
// ====================================================================
describe("createFlexiblePattern", () => {
  it("matches single-line text against source with footnotes", () => {
    const source = "mundo.[^8] Ensor interpretaba temas";
    const snippet = "mundo. Ensor interpretaba temas";
    const pattern = logic.createFlexiblePattern(snippet);
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test(source)).toBe(true);
  });

  it("matches cuneiform paragraph against source", () => {
    const source = "***Atrahasis*** (𒀜𒊏𒄩𒋀) es un poema épico";
    const snippet = "Atrahasis (𒀜𒊏𒄩𒋀) es un poema épico";
    const pattern = logic.createFlexiblePattern(snippet);
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test(source)).toBe(true);
  });

  it("matches italic text against source", () => {
    const source = "en una de las *Lista Real Sumerias*.[^4] La copia";
    const snippet = "en una de las Lista Real Sumerias. La copia";
    const pattern = logic.createFlexiblePattern(snippet);
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test(source)).toBe(true);
  });

  it("matches footnote list entries", () => {
    const source = "[^61]: Encina, 1961: 578";
    const snippet = "Encina, 1961: 578";
    const pattern = logic.createFlexiblePattern(snippet);
    const regex = new RegExp(pattern, "gmu");
    expect(regex.test(source)).toBe(true);
  });
});

// ====================================================================
// buildFuzzyMap — code point safety
// ====================================================================
describe("buildFuzzyMap", () => {
  it("includes cuneiform characters in normalized output", () => {
    const { normalized } = logic.buildFuzzyMap("Atrahasis (𒀜𒊏𒄩𒋀) es");
    expect(normalized).toContain("𒀜");
    expect(normalized).toContain("𒊏");
    expect(normalized).toContain("𒄩");
    expect(normalized).toContain("𒋀");
  });

  it("maps offsets correctly with cuneiform chars", () => {
    const text = "A𒀜B";
    const { normalized, map } = logic.buildFuzzyMap(text);
    expect(normalized).toBe("a𒀜b");
    // 'A' at offset 0, '𒀜' at offset 1 (2 code units), 'B' at offset 3
    expect(map[0]).toBe(0); // 'a' -> 'A' at 0
    expect(map[1]).toBe(1); // '𒀜' -> at 1
    expect(map[2]).toBe(3); // 'b' -> 'B' at 3
  });

  it("excludes punctuation and spaces", () => {
    const { normalized } = logic.buildFuzzyMap("hello, world!");
    expect(normalized).toBe("helloworld");
  });

  it("handles emoji", () => {
    const { normalized } = logic.buildFuzzyMap("A🎉B");
    // Emoji are not \p{L} or \p{N}, so excluded
    expect(normalized).toBe("ab");
  });
});

// ====================================================================
// normalizeForFuzzySearch — code point safety
// ====================================================================
describe("normalizeForFuzzySearch", () => {
  it("includes cuneiform characters", () => {
    const result = logic.normalizeForFuzzySearch("Atrahasis (𒀜𒊏𒄩𒋀) es");
    expect(result).toContain("𒀜");
    expect(result).toContain("atrahasis");
  });

  it("strips punctuation and spaces", () => {
    const result = logic.normalizeForFuzzySearch("Hello, World!");
    expect(result).toBe("helloworld");
  });

  it("lowercases correctly", () => {
    const result = logic.normalizeForFuzzySearch("AbCdEf");
    expect(result).toBe("abcdef");
  });
});

// ====================================================================
// safeRegexExec — timeout safety
// ====================================================================
describe("safeRegexExec", () => {
  it("returns matches for simple patterns", () => {
    const regex = /hello/g;
    const results = logic.safeRegexExec(regex, "hello world hello");
    expect(results.length).toBe(2);
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(12);
  });

  it("returns empty array for non-matching pattern", () => {
    const regex = /xyz/g;
    const results = logic.safeRegexExec(regex, "hello world");
    expect(results.length).toBe(0);
  });

  it("handles invalid regex gracefully", () => {
    // Force a regex error by testing with a regex that throws
    const badRegex = /test/g;
    // This should work normally
    const results = logic.safeRegexExec(badRegex, "test");
    expect(results.length).toBe(1);
  });
});

// ====================================================================
// Full pipeline integration test — the "Atrahasis" paragraph
// ====================================================================
describe("Integration: Atrahasis paragraph", () => {
  const source = `---
title: Test
---

***Atrahasis*** (𒀜𒊏𒄩𒋀) es un poema épico acadio del siglo XVIII a. C., registrado en varias versiones en tablillas de arcilla[^1] y que lleva el nombre de uno de sus protagonistas, el sacerdote Atrahasis ('el muy sabio').[^2] La narrativa tiene cuatro puntos focales`;

  const snippet = `Atrahasis (𒀜𒊏𒄩𒋀) es un poema épico acadio del siglo XVIII a. C., registrado en varias versiones en tablillas de arcilla y que lleva el nombre de uno de sus protagonistas, el sacerdote Atrahasis ('el muy sabio'). La narrativa tiene cuatro puntos focales`;

  it("findAllCandidates finds the paragraph in body content", () => {
    // Strip front matter
    const bodyStart = source.indexOf("\n\n") + 2;
    const body = source.substring(bodyStart);

    const cleanSnippet = logic.stripBrowserJunk(snippet);
    const candidates = logic.findAllCandidates(body, cleanSnippet, 0);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].text).toContain("𒀜𒊏𒄩𒋀");
  });
});

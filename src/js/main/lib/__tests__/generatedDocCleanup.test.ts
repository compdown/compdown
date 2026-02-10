import { describe, expect, it } from "vitest";
import { cleanupGeneratedDocument } from "../generatedDocCleanup";

describe("cleanupGeneratedDocument", () => {
  it("removes empty top-level arrays and objects", () => {
    const doc = cleanupGeneratedDocument({
      files: [],
      folders: [],
      compositions: [{ name: "Comp 1", layers: [] }],
    });

    expect(doc).toEqual({
      compositions: [{ name: "Comp 1" }],
    });
  });

  it("removes default composition values", () => {
    const doc = cleanupGeneratedDocument({
      compositions: [
        {
          name: "Main",
          width: 1920,
          height: 1080,
          duration: 10,
          framerate: 30,
          pixelAspect: 1,
          layers: [{ name: "title", type: "text", text: "Hello" }],
        },
      ],
    });

    expect(doc).toEqual({
      compositions: [
        {
          name: "Main",
          layers: [{ name: "title", type: "text", text: "Hello" }],
        },
      ],
    });
  });

  it("keeps non-default composition values", () => {
    const doc = cleanupGeneratedDocument({
      compositions: [
        {
          name: "Main",
          width: 1280,
          height: 720,
          duration: 5,
          framerate: 24,
          pixelAspect: 1,
        },
      ],
    });

    expect(doc).toEqual({
      compositions: [
        {
          name: "Main",
          width: 1280,
          height: 720,
          duration: 5,
          framerate: 24,
        },
      ],
    });
  });

  it("removes all label values", () => {
    const doc = cleanupGeneratedDocument({
      compositions: [
        {
          name: "Main",
          layers: [
            { name: "a", type: "text", text: "A", label: 1 },
            { name: "b", type: "text", text: "B", label: 0 },
            { name: "c", type: "text", text: "C", label: 9 },
          ],
        },
      ],
    });

    expect(doc).toEqual({
      compositions: [
        {
          name: "Main",
          layers: [
            { name: "a", type: "text", text: "A" },
            { name: "b", type: "text", text: "B" },
            { name: "c", type: "text", text: "C" },
          ],
        },
      ],
    });
  });
});

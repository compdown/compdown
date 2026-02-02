import { describe, it, expect } from "vitest";
import {
  TransformSchema,
  LayerSchema,
  CompSchema,
  FileSchema,
  FolderSchema,
  CompdownDocumentSchema,
  BlendingModeSchema,
} from "../types";

// ---------------------------------------------------------------------------
// TransformSchema
// ---------------------------------------------------------------------------

describe("TransformSchema", () => {
  // TransformSchema is optional at the top level; unwrap for direct testing
  const Schema = TransformSchema.unwrap();

  it("accepts a valid full transform", () => {
    const result = Schema.safeParse({
      anchorPoint: [960, 540],
      position: [100, 200],
      scale: [100, 100],
      rotation: 45,
      opacity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    const result = Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects opacity below 0", () => {
    const result = Schema.safeParse({ opacity: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects opacity above 100", () => {
    const result = Schema.safeParse({ opacity: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects extra keys (strict mode)", () => {
    const result = Schema.safeParse({ opacity: 50, foo: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects non-tuple position", () => {
    const result = Schema.safeParse({ position: [1, 2, 3] });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BlendingModeSchema
// ---------------------------------------------------------------------------

describe("BlendingModeSchema", () => {
  const Schema = BlendingModeSchema.unwrap();

  it("accepts valid blending modes", () => {
    for (const mode of ["normal", "multiply", "screen", "overlay", "difference"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects an invalid blending mode", () => {
    expect(Schema.safeParse("burn").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LayerSchema
// ---------------------------------------------------------------------------

describe("LayerSchema", () => {
  it("accepts a solid layer with color", () => {
    const result = LayerSchema.safeParse({
      name: "Red Solid",
      type: "solid",
      color: "FF0000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a null layer", () => {
    const result = LayerSchema.safeParse({
      name: "Null 1",
      type: "null",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an adjustment layer", () => {
    const result = LayerSchema.safeParse({
      name: "Adjustment",
      type: "adjustment",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a text layer with text", () => {
    const result = LayerSchema.safeParse({
      name: "Title",
      type: "text",
      text: "Hello World",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file-based layer (string id)", () => {
    const result = LayerSchema.safeParse({
      name: "Footage",
      file: "my-clip",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file-based layer (numeric id)", () => {
    const result = LayerSchema.safeParse({
      name: "Footage",
      file: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a layer with neither type nor file", () => {
    const result = LayerSchema.safeParse({ name: "Orphan" });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("type"))).toBe(true);
  });

  it("rejects a solid layer without color", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Solid",
      type: "solid",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("color"))).toBe(true);
  });

  it("rejects a text layer without text", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Text",
      type: "text",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("text"))).toBe(true);
  });

  it("rejects an invalid hex color", () => {
    const result = LayerSchema.safeParse({
      name: "Solid",
      type: "solid",
      color: "ZZZZZZ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a hex color with # prefix", () => {
    const result = LayerSchema.safeParse({
      name: "Solid",
      type: "solid",
      color: "#FF0000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative inPoint", () => {
    const result = LayerSchema.safeParse({
      name: "Layer",
      type: "null",
      inPoint: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional properties", () => {
    const result = LayerSchema.safeParse({
      name: "Full Layer",
      type: "null",
      enabled: false,
      shy: true,
      locked: true,
      threeDLayer: true,
      parent: "Parent Layer",
      blendingMode: "multiply",
      transform: { opacity: 50 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = LayerSchema.safeParse({
      name: "",
      type: "null",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CompSchema
// ---------------------------------------------------------------------------

describe("CompSchema", () => {
  it("applies defaults for a minimal comp", () => {
    const result = CompSchema.safeParse({ name: "Main Comp" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: "Main Comp",
      width: 1920,
      height: 1080,
      framerate: 30,
      duration: 10,
      pixelAspect: 1,
      color: "000000",
    });
  });

  it("uses custom values when provided", () => {
    const result = CompSchema.safeParse({
      name: "Custom Comp",
      width: 3840,
      height: 2160,
      duration: 30,
      framerate: 60,
      pixelAspect: 1.5,
      color: "112233",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      width: 3840,
      height: 2160,
      duration: 30,
      framerate: 60,
      pixelAspect: 1.5,
      color: "112233",
    });
  });

  it("rejects a comp with no name", () => {
    const result = CompSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a comp with an empty name", () => {
    const result = CompSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive width", () => {
    const result = CompSchema.safeParse({ name: "C", width: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer width", () => {
    const result = CompSchema.safeParse({ name: "C", width: 1920.5 });
    expect(result.success).toBe(false);
  });

  it("accepts a comp with layers", () => {
    const result = CompSchema.safeParse({
      name: "Comp With Layers",
      layers: [
        { name: "BG", type: "solid", color: "000000" },
        { name: "Null", type: "null" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.layers).toHaveLength(2);
  });

  it("rejects a comp with invalid layers", () => {
    const result = CompSchema.safeParse({
      name: "Bad Comp",
      layers: [{ name: "No type or file" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional folder reference", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      folder: "My Folder",
    });
    expect(result.success).toBe(true);
    expect(result.data!.folder).toBe("My Folder");
  });
});

// ---------------------------------------------------------------------------
// FileSchema
// ---------------------------------------------------------------------------

describe("FileSchema", () => {
  it("accepts a file with string id", () => {
    const result = FileSchema.safeParse({
      id: "clip-1",
      path: "/path/to/file.mov",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file with numeric id", () => {
    const result = FileSchema.safeParse({
      id: 1,
      path: "/path/to/file.mov",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a file without path", () => {
    const result = FileSchema.safeParse({ id: "clip-1" });
    expect(result.success).toBe(false);
  });

  it("rejects a file with empty path", () => {
    const result = FileSchema.safeParse({ id: "clip-1", path: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a file without id", () => {
    const result = FileSchema.safeParse({ path: "/path/to/file.mov" });
    expect(result.success).toBe(false);
  });

  it("accepts optional sequence and folder", () => {
    const result = FileSchema.safeParse({
      id: "seq",
      path: "/path/to/seq.[0001-0100].png",
      sequence: true,
      folder: "Footage",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ sequence: true, folder: "Footage" });
  });
});

// ---------------------------------------------------------------------------
// FolderSchema
// ---------------------------------------------------------------------------

describe("FolderSchema", () => {
  it("accepts a folder with name", () => {
    const result = FolderSchema.safeParse({ name: "Footage" });
    expect(result.success).toBe(true);
  });

  it("accepts a folder with parent", () => {
    const result = FolderSchema.safeParse({
      name: "Subfolder",
      parent: "Footage",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a folder without name", () => {
    const result = FolderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a folder with empty name", () => {
    const result = FolderSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CompdownDocumentSchema
// ---------------------------------------------------------------------------

describe("CompdownDocumentSchema", () => {
  it("accepts a document with only comps", () => {
    const result = CompdownDocumentSchema.safeParse({
      comps: [{ name: "Main" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with only files", () => {
    const result = CompdownDocumentSchema.safeParse({
      files: [{ id: "f1", path: "/foo.mov" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with only folders", () => {
    const result = CompdownDocumentSchema.safeParse({
      folders: [{ name: "Assets" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with all three sections", () => {
    const result = CompdownDocumentSchema.safeParse({
      folders: [{ name: "Assets" }],
      files: [{ id: "f1", path: "/foo.mov" }],
      comps: [{ name: "Main" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty document (no sections)", () => {
    const result = CompdownDocumentSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("at least one"))).toBe(true);
  });

  it("rejects a document with empty arrays", () => {
    const result = CompdownDocumentSchema.safeParse({
      comps: [],
      files: [],
      folders: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a document with only invalid comps", () => {
    const result = CompdownDocumentSchema.safeParse({
      comps: [{ width: 1920 }], // missing name
    });
    expect(result.success).toBe(false);
  });
});

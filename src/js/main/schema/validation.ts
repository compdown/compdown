import yaml from "js-yaml";
import { ZodError } from "zod";
import { CompdownDocumentSchema, type CompdownDocument } from "./types";

export interface ValidationError {
  line: number | null;
  message: string;
  path: string[];
}

export interface ValidationResult {
  success: boolean;
  data?: CompdownDocument;
  errors: ValidationError[];
}

/**
 * Try to find the YAML line number for a Zod error path.
 * Walks the path segments and searches for matching keys in the raw YAML text.
 */
function findLineForPath(yamlText: string, path: (string | number)[]): number | null {
  const lines = yamlText.split("\n");

  // Build a search strategy: for a path like ["compositions", 0, "layers", 1, "name"],
  // we look for the key of the last meaningful string segment
  let lastKey: string | null = null;
  let arrayIndex: number | null = null;

  for (let i = path.length - 1; i >= 0; i--) {
    if (typeof path[i] === "string") {
      lastKey = path[i] as string;
      // Check if the next segment is an array index
      if (i > 0 && typeof path[i - 1] === "number") {
        arrayIndex = path[i - 1] as number;
      }
      break;
    }
  }

  if (!lastKey) return null;

  const keyPattern = new RegExp(`^\\s*${lastKey}\\s*:`);
  let matchCount = 0;

  for (let i = 0; i < lines.length; i++) {
    if (keyPattern.test(lines[i])) {
      // If we have an array index context, we need to find the nth occurrence
      if (arrayIndex !== null) {
        matchCount++;
        if (matchCount > arrayIndex) {
          return i + 1; // 1-indexed
        }
      } else {
        return i + 1;
      }
    }
  }

  return null;
}

/**
 * Post-process parsed YAML to handle YAML's null literal in layer type fields.
 * In YAML, `type: null` parses as JavaScript null, but we want it as the string "null".
 */
function preprocessParsedYaml(data: unknown): unknown {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  const obj = data as Record<string, unknown>;

  // If this looks like a layer object with type: null, convert to "null"
  if ("name" in obj && obj.type === null) {
    obj.type = "null";
  }

  // Recurse into compositions and layers
  if (Array.isArray(obj.compositions)) {
    for (const comp of obj.compositions) {
      if (comp && typeof comp === "object" && Array.isArray((comp as Record<string, unknown>).layers)) {
        for (const layer of (comp as Record<string, unknown>).layers as unknown[]) {
          preprocessParsedYaml(layer);
        }
      }
    }
  }

  return data;
}

/**
 * Parse and validate a YAML string against the Compdown schema.
 */
export function validateYaml(yamlText: string): ValidationResult {
  // Step 1: Parse YAML
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlText);
  } catch (e) {
    const yamlError = e as yaml.YAMLException;
    return {
      success: false,
      errors: [
        {
          line: yamlError.mark?.line != null ? yamlError.mark.line + 1 : null,
          message: yamlError.reason || yamlError.message,
          path: [],
        },
      ],
    };
  }

  if (parsed === null || parsed === undefined) {
    return {
      success: false,
      errors: [{ line: 1, message: "Document is empty", path: [] }],
    };
  }

  // Step 1.5: Handle YAML null literal in layer type fields
  preprocessParsedYaml(parsed);

  // Step 2: Validate with Zod
  const result = CompdownDocumentSchema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }

  // Step 3: Map Zod errors to line numbers
  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    line: findLineForPath(yamlText, issue.path),
    message: issue.message,
    path: issue.path.map(String),
  }));

  return { success: false, errors };
}

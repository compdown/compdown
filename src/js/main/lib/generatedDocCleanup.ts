type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const COMPOSITION_DEFAULTS: { [key: string]: number } = {
  width: 1920,
  height: 1080,
  duration: 10,
  framerate: 30,
  pixelAspect: 1,
};

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

function isEmptyObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
}

function shouldDropProperty(key: string, value: unknown, parent: unknown): boolean {
  if (value === undefined || value === null) return true;

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isEmptyObject(value)) {
    return true;
  }

  if (key === "label") {
    return true;
  }

  // Drop default comp values
  if (
    key in COMPOSITION_DEFAULTS &&
    parent &&
    typeof parent === "object" &&
    !Array.isArray(parent) &&
    "name" in (parent as Record<string, unknown>) &&
    typeof value === "number"
  ) {
    return nearlyEqual(value, COMPOSITION_DEFAULTS[key]);
  }

  return false;
}

function prune(value: JsonValue, parent?: JsonValue): JsonValue | undefined {
  if (Array.isArray(value)) {
    const prunedArray = value
      .map((entry) => prune(entry, value))
      .filter((entry): entry is JsonValue => entry !== undefined);

    return prunedArray.length > 0 ? prunedArray : undefined;
  }

  if (value && typeof value === "object") {
    const obj = value as { [key: string]: JsonValue };
    const result: { [key: string]: JsonValue } = {};

    for (const key of Object.keys(obj)) {
      const raw = obj[key];
      const pruned = prune(raw, value);
      if (pruned === undefined) continue;
      if (shouldDropProperty(key, pruned, value)) continue;
      result[key] = pruned;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  return value;
}

export function cleanupGeneratedDocument<T extends object>(doc: T): T {
  const cloned = JSON.parse(JSON.stringify(doc)) as JsonValue;
  const pruned = prune(cloned);

  if (!pruned || typeof pruned !== "object" || Array.isArray(pruned)) {
    return doc;
  }

  return pruned as T;
}

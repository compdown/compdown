import { forEachLayer } from "../aeft-utils";

/**
 * Reverse-map AE BlendingMode enum to YAML string name.
 */
var blendingModeNames: { [key: number]: string } = {};
blendingModeNames[BlendingMode.NORMAL] = "normal";
blendingModeNames[BlendingMode.DISSOLVE] = "dissolve";
blendingModeNames[BlendingMode.DARKEN] = "darken";
blendingModeNames[BlendingMode.MULTIPLY] = "multiply";
blendingModeNames[BlendingMode.COLOR_BURN] = "colorBurn";
blendingModeNames[BlendingMode.LINEAR_BURN] = "linearBurn";
blendingModeNames[BlendingMode.DARKER_COLOR] = "darkerColor";
blendingModeNames[BlendingMode.LIGHTEN] = "lighten";
blendingModeNames[BlendingMode.SCREEN] = "screen";
blendingModeNames[BlendingMode.COLOR_DODGE] = "colorDodge";
blendingModeNames[BlendingMode.LINEAR_DODGE] = "linearDodge";
blendingModeNames[BlendingMode.LIGHTER_COLOR] = "lighterColor";
blendingModeNames[BlendingMode.OVERLAY] = "overlay";
blendingModeNames[BlendingMode.SOFT_LIGHT] = "softLight";
blendingModeNames[BlendingMode.HARD_LIGHT] = "hardLight";
blendingModeNames[BlendingMode.VIVID_LIGHT] = "vividLight";
blendingModeNames[BlendingMode.LINEAR_LIGHT] = "linearLight";
blendingModeNames[BlendingMode.PIN_LIGHT] = "pinLight";
blendingModeNames[BlendingMode.HARD_MIX] = "hardMix";
blendingModeNames[BlendingMode.DIFFERENCE] = "difference";
blendingModeNames[BlendingMode.EXCLUSION] = "exclusion";
blendingModeNames[BlendingMode.SUBTRACT] = "subtract";
blendingModeNames[BlendingMode.DIVIDE] = "divide";
blendingModeNames[BlendingMode.HUE] = "hue";
blendingModeNames[BlendingMode.SATURATION] = "saturation";
blendingModeNames[BlendingMode.COLOR] = "color";
blendingModeNames[BlendingMode.LUMINOSITY] = "luminosity";

function toHex(n: number): string {
  var hex = Math.round(n * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function readTransform(layer: Layer): object | null {
  var transform: { [key: string]: any } = {};
  var hasValues = false;

  var group = layer.property("ADBE Transform Group");

  var pos = group.property("ADBE Position") as Property;
  if (pos) {
    var posVal = pos.value as number[];
    transform.position = [Math.round(posVal[0]), Math.round(posVal[1])];
    hasValues = true;
  }

  var scale = group.property("ADBE Scale") as Property;
  if (scale) {
    var scaleVal = scale.value as number[];
    // Only include if not default [100, 100]
    if (scaleVal[0] !== 100 || scaleVal[1] !== 100) {
      transform.scale = [Math.round(scaleVal[0]), Math.round(scaleVal[1])];
      hasValues = true;
    }
  }

  var rotation = group.property("ADBE Rotate Z") as Property;
  if (rotation && rotation.value !== 0) {
    transform.rotation = rotation.value;
    hasValues = true;
  }

  var opacity = group.property("ADBE Opacity") as Property;
  if (opacity && opacity.value !== 100) {
    transform.opacity = opacity.value;
    hasValues = true;
  }

  return hasValues ? transform : null;
}

/**
 * Read a single layer and return a JSON-serializable object.
 */
export function readLayer(layer: Layer): object {
  var result: { [key: string]: any } = {};
  result.name = layer.name;

  // Determine type
  if (layer instanceof TextLayer) {
    result.type = "text";
    var textProp = layer
      .property("ADBE Text Properties")
      .property("ADBE Text Document") as Property;
    if (textProp) {
      var textDoc = textProp.value as TextDocument;
      result.text = textDoc.text;
      if (textDoc.fontSize) result.fontSize = textDoc.fontSize;
      if (textDoc.font) result.font = textDoc.font;
    }
  } else if (layer.source && layer.source instanceof CompItem) {
    // Layer referencing a comp
    result.file = layer.source.name;
  } else if (layer.source && layer.source instanceof FootageItem) {
    var source = layer.source as FootageItem;
    if (source.file) {
      result.file = source.file.fsName;
    } else if (source.mainSource instanceof SolidSource) {
      result.type = "solid";
      var solidColor = (source.mainSource as SolidSource).color;
      result.color =
        toHex(solidColor[0]) + toHex(solidColor[1]) + toHex(solidColor[2]);
      result.width = source.width;
      result.height = source.height;
    }
  } else if (layer.nullLayer) {
    result.type = "null";
  }

  if (layer.adjustmentLayer) {
    result.type = "adjustment";
  }

  // Timing
  if (layer.inPoint !== 0) result.inPoint = layer.inPoint;
  if (layer.outPoint !== layer.containingComp.duration) {
    result.outPoint = layer.outPoint;
  }
  if (layer.startTime !== 0) result.startTime = layer.startTime;

  // Flags
  if (!layer.enabled) result.enabled = false;
  if (layer.shy) result.shy = true;
  if (layer.locked) result.locked = true;
  if (layer.threeDLayer) result.threeDLayer = true;

  // Blending mode
  var modeName = blendingModeNames[layer.blendingMode as number];
  if (modeName && modeName !== "normal") {
    result.blendingMode = modeName;
  }

  // Parent
  if (layer.parent) {
    result.parent = layer.parent.name;
  }

  // Transform
  var transform = readTransform(layer);
  if (transform) {
    result.transform = transform;
  }

  return result;
}

/**
 * Read selected layers from the active comp.
 */
export function readSelectedLayers(comp: CompItem): object[] {
  var results: object[] = [];
  var selected = comp.selectedLayers;
  for (var i = 0; i < selected.length; i++) {
    results.push(readLayer(selected[i]));
  }
  return results;
}

/**
 * Read all layers from a comp.
 */
export function readAllLayers(comp: CompItem): object[] {
  var results: object[] = [];
  forEachLayer(comp, function (layer) {
    results.push(readLayer(layer));
  });
  return results;
}

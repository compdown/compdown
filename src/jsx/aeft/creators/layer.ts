/**
 * Mapping of YAML blending mode names to AE BlendingMode enum values.
 * ExtendScript doesn't support Map, so we use a plain object lookup.
 */
var blendingModes: { [key: string]: BlendingMode } = {
  normal: BlendingMode.NORMAL,
  dissolve: BlendingMode.DISSOLVE,
  darken: BlendingMode.DARKEN,
  multiply: BlendingMode.MULTIPLY,
  colorBurn: BlendingMode.COLOR_BURN,
  linearBurn: BlendingMode.LINEAR_BURN,
  darkerColor: BlendingMode.DARKER_COLOR,
  lighten: BlendingMode.LIGHTEN,
  screen: BlendingMode.SCREEN,
  colorDodge: BlendingMode.COLOR_DODGE,
  linearDodge: BlendingMode.LINEAR_DODGE,
  lighterColor: BlendingMode.LIGHTER_COLOR,
  overlay: BlendingMode.OVERLAY,
  softLight: BlendingMode.SOFT_LIGHT,
  hardLight: BlendingMode.HARD_LIGHT,
  vividLight: BlendingMode.VIVID_LIGHT,
  linearLight: BlendingMode.LINEAR_LIGHT,
  pinLight: BlendingMode.PIN_LIGHT,
  hardMix: BlendingMode.HARD_MIX,
  difference: BlendingMode.DIFFERENCE,
  exclusion: BlendingMode.EXCLUSION,
  subtract: BlendingMode.SUBTRACT,
  divide: BlendingMode.DIVIDE,
  hue: BlendingMode.HUE,
  saturation: BlendingMode.SATURATION,
  color: BlendingMode.COLOR,
  luminosity: BlendingMode.LUMINOSITY,
};

interface TransformDef {
  anchorPoint?: [number, number];
  position?: [number, number];
  scale?: [number, number];
  rotation?: number;
  opacity?: number;
}

interface LayerDef {
  name: string;
  type?: string;
  file?: string | number;
  inPoint?: number;
  outPoint?: number;
  startTime?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  font?: string;
  enabled?: boolean;
  shy?: boolean;
  locked?: boolean;
  threeDLayer?: boolean;
  parent?: string;
  blendingMode?: string;
  transform?: TransformDef;
}

/**
 * Apply transform properties to a layer.
 */
function applyTransform(layer: Layer, transform: TransformDef): void {
  if (transform.anchorPoint) {
    layer.property("ADBE Transform Group")
      .property("ADBE Anchor Point")
      //@ts-ignore
      .setValue(transform.anchorPoint);
  }
  if (transform.position) {
    layer.property("ADBE Transform Group")
      .property("ADBE Position")
      //@ts-ignore
      .setValue(transform.position);
  }
  if (transform.scale) {
    layer.property("ADBE Transform Group")
      .property("ADBE Scale")
      //@ts-ignore
      .setValue(transform.scale);
  }
  if (transform.rotation !== undefined) {
    layer.property("ADBE Transform Group")
      .property("ADBE Rotate Z")
      //@ts-ignore
      .setValue(transform.rotation);
  }
  if (transform.opacity !== undefined) {
    layer.property("ADBE Transform Group")
      .property("ADBE Opacity")
      //@ts-ignore
      .setValue(transform.opacity);
  }
}

/**
 * Create layers in a composition.
 */
export const createLayers = (
  comp: CompItem,
  layers: LayerDef[],
  fileMap: { [id: string]: FootageItem },
  compMap: { [name: string]: CompItem }
): void => {
  // Build a name -> layer map for parenting
  var layerNameMap: { [name: string]: Layer } = {};

  for (var i = 0; i < layers.length; i++) {
    var layerDef = layers[i];
    var newLayer: Layer;

    if (layerDef.file !== undefined) {
      // File-based layer
      var fileId = String(layerDef.file);
      var footage = fileMap[fileId];
      if (!footage) {
        // Check if it references a comp
        if (compMap[fileId]) {
          newLayer = comp.layers.add(compMap[fileId]);
        } else {
          throw new Error("File or comp with id '" + fileId + "' not found");
        }
      } else {
        newLayer = comp.layers.add(footage);
      }
    } else {
      switch (layerDef.type) {
        case "solid": {
          var r = 0,
            g = 0,
            b = 0;
          if (layerDef.color) {
            r = parseInt(layerDef.color.substring(0, 2), 16) / 255;
            g = parseInt(layerDef.color.substring(2, 4), 16) / 255;
            b = parseInt(layerDef.color.substring(4, 6), 16) / 255;
          }
          newLayer = comp.layers.addSolid(
            [r, g, b],
            layerDef.name,
            layerDef.width || comp.width,
            layerDef.height || comp.height,
            1
          );
          break;
        }
        case "null": {
          newLayer = comp.layers.addNull();
          break;
        }
        case "adjustment": {
          newLayer = comp.layers.addSolid(
            [0, 0, 0],
            layerDef.name,
            comp.width,
            comp.height,
            1
          );
          newLayer.adjustmentLayer = true;
          break;
        }
        case "text": {
          newLayer = comp.layers.addText(layerDef.text || "");
          if (layerDef.fontSize || layerDef.font) {
            var textProp = newLayer
              .property("ADBE Text Properties")
              .property("ADBE Text Document") as Property;
            var textDoc = textProp.value as TextDocument;
            if (layerDef.fontSize) textDoc.fontSize = layerDef.fontSize;
            if (layerDef.font) textDoc.font = layerDef.font;
            textProp.setValue(textDoc);
          }
          break;
        }
        default:
          throw new Error("Unknown layer type: " + layerDef.type);
      }
    }

    // Set layer name
    newLayer.name = layerDef.name;

    // Timing
    if (layerDef.startTime !== undefined) newLayer.startTime = layerDef.startTime;
    if (layerDef.inPoint !== undefined) newLayer.inPoint = layerDef.inPoint;
    if (layerDef.outPoint !== undefined) newLayer.outPoint = layerDef.outPoint;

    // Layer flags
    if (layerDef.enabled !== undefined) newLayer.enabled = layerDef.enabled;
    if (layerDef.shy !== undefined) newLayer.shy = layerDef.shy;
    if (layerDef.threeDLayer !== undefined) newLayer.threeDLayer = layerDef.threeDLayer;

    // Blending mode
    if (layerDef.blendingMode && blendingModes[layerDef.blendingMode]) {
      newLayer.blendingMode = blendingModes[layerDef.blendingMode];
    }

    // Transform
    if (layerDef.transform) {
      applyTransform(newLayer, layerDef.transform);
    }

    layerNameMap[layerDef.name] = newLayer;
  }

  // Second pass: set parenting (must happen after all layers exist)
  for (var j = 0; j < layers.length; j++) {
    if (layers[j].parent && layerNameMap[layers[j].parent!]) {
      layerNameMap[layers[j].name].parent = layerNameMap[layers[j].parent!];
    }
  }

  // Third pass: lock layers (must happen last, locked layers can't be modified)
  for (var k = 0; k < layers.length; k++) {
    if (layers[k].locked) {
      layerNameMap[layers[k].name].locked = true;
    }
  }
};

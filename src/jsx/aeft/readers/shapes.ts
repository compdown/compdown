/**
 * Convert RGB values (0-1 range) to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  var rHex = Math.round(r * 255).toString(16);
  var gHex = Math.round(g * 255).toString(16);
  var bHex = Math.round(b * 255).toString(16);
  return (
    (rHex.length === 1 ? "0" + rHex : rHex) +
    (gHex.length === 1 ? "0" + gHex : gHex) +
    (bHex.length === 1 ? "0" + bHex : bHex)
  );
}

function roundCoord(value: number): number {
  var rounded = Math.round(value * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Read fill properties from a fill property group.
 */
function readFill(fillProp: PropertyGroup): object | null {
  var result: { [key: string]: any } = {};

  var colorProp = fillProp.property("ADBE Vector Fill Color") as Property;
  if (colorProp) {
    var colorVal = colorProp.value as number[];
    result.color = rgbToHex(colorVal[0], colorVal[1], colorVal[2]);
  }

  var opacityProp = fillProp.property("ADBE Vector Fill Opacity") as Property;
  if (opacityProp) {
    var opacity = opacityProp.value as number;
    if (opacity !== 100) {
      result.opacity = opacity;
    }
  }

  return result.color ? result : null;
}

/**
 * Read stroke properties from a stroke property group.
 */
function readStroke(strokeProp: PropertyGroup): object | null {
  var result: { [key: string]: any } = {};

  var colorProp = strokeProp.property("ADBE Vector Stroke Color") as Property;
  if (colorProp) {
    var colorVal = colorProp.value as number[];
    result.color = rgbToHex(colorVal[0], colorVal[1], colorVal[2]);
  }

  var widthProp = strokeProp.property("ADBE Vector Stroke Width") as Property;
  if (widthProp) {
    var width = widthProp.value as number;
    if (width !== 1) {
      result.width = width;
    }
  }

  var opacityProp = strokeProp.property("ADBE Vector Stroke Opacity") as Property;
  if (opacityProp) {
    var opacity = opacityProp.value as number;
    if (opacity !== 100) {
      result.opacity = opacity;
    }
  }

  return result.color ? result : null;
}

/**
 * Read rectangle shape properties.
 */
function readRectangle(rectProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "rectangle" };

  var sizeProp = rectProp.property("ADBE Vector Rect Size") as Property;
  if (sizeProp) {
    var size = sizeProp.value as number[];
    result.size = [Math.round(size[0]), Math.round(size[1])];
  }

  var posProp = rectProp.property("ADBE Vector Rect Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  var roundProp = rectProp.property("ADBE Vector Rect Roundness") as Property;
  if (roundProp) {
    var roundness = roundProp.value as number;
    if (roundness !== 0) {
      result.roundness = roundness;
    }
  }

  return result;
}

/**
 * Read ellipse shape properties.
 */
function readEllipse(ellipseProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "ellipse" };

  var sizeProp = ellipseProp.property("ADBE Vector Ellipse Size") as Property;
  if (sizeProp) {
    var size = sizeProp.value as number[];
    result.size = [Math.round(size[0]), Math.round(size[1])];
  }

  var posProp = ellipseProp.property("ADBE Vector Ellipse Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  return result;
}

/**
 * Read polystar (star or polygon) shape properties.
 */
function readPolystar(polystarProp: PropertyGroup): object {
  var typeProp = polystarProp.property("ADBE Vector Star Type") as Property;
  var starType = typeProp ? (typeProp.value as number) : 1;
  var isPolygon = starType === 2;

  var result: { [key: string]: any } = { type: isPolygon ? "polygon" : "star" };

  var pointsProp = polystarProp.property("ADBE Vector Star Points") as Property;
  if (pointsProp) {
    result.points = Math.round(pointsProp.value as number);
  }

  var outerRadProp = polystarProp.property("ADBE Vector Star Outer Radius") as Property;
  if (outerRadProp) {
    result.outerRadius = Math.round(outerRadProp.value as number);
  }

  // Inner radius only for stars
  if (!isPolygon) {
    var innerRadProp = polystarProp.property("ADBE Vector Star Inner Radius") as Property;
    if (innerRadProp) {
      result.innerRadius = Math.round(innerRadProp.value as number);
    }
  }

  var posProp = polystarProp.property("ADBE Vector Star Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  var outerRoundProp = polystarProp.property("ADBE Vector Star Outer Roundess") as Property;
  if (outerRoundProp) {
    var outerRound = outerRoundProp.value as number;
    if (outerRound !== 0) {
      result.outerRoundness = outerRound;
    }
  }

  // Inner roundness only for stars
  if (!isPolygon) {
    var innerRoundProp = polystarProp.property("ADBE Vector Star Inner Roundess") as Property;
    if (innerRoundProp) {
      var innerRound = innerRoundProp.value as number;
      if (innerRound !== 0) {
        result.innerRoundness = innerRound;
      }
    }
  }

  var rotProp = polystarProp.property("ADBE Vector Star Rotation") as Property;
  if (rotProp) {
    var rot = rotProp.value as number;
    if (rot !== 0) {
      result.rotation = rot;
    }
  }

  return result;
}

function readTrimPaths(trimProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "trimPaths" };

  var start = trimProp.property("ADBE Vector Trim Start") as Property;
  if (start) result.start = start.value as number;

  var end = trimProp.property("ADBE Vector Trim End") as Property;
  if (end) result.end = end.value as number;

  var offset = trimProp.property("ADBE Vector Trim Offset") as Property;
  if (offset) result.offset = offset.value as number;

  var trimType = trimProp.property("ADBE Vector Trim Type") as Property;
  if (trimType) {
    result.trimMultipleShapes = (trimType.value as number) === 2 ? "individually" : "simultaneously";
  }

  return result;
}

function readZigZag(zigZagProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "zigZag" };

  var size = zigZagProp.property("ADBE Vector Zigzag Size") as Property;
  if (size) result.size = size.value as number;

  var ridges = zigZagProp.property("ADBE Vector Zigzag Detail") as Property;
  if (ridges) result.ridgesPerSegment = ridges.value as number;

  var points = zigZagProp.property("ADBE Vector Zigzag Points") as Property;
  if (points) result.points = (points.value as number) === 2 ? "smooth" : "corner";

  return result;
}

function readRepeater(repeaterProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "repeater" };

  var copies = repeaterProp.property("ADBE Vector Repeater Copies") as Property;
  if (copies) result.copies = copies.value as number;

  var offset = repeaterProp.property("ADBE Vector Repeater Offset") as Property;
  if (offset) result.offset = offset.value as number;

  var transform = repeaterProp.property("ADBE Vector Repeater Transform") as PropertyGroup;
  if (transform) {
    var transformResult: { [key: string]: any } = {};

    var anchor = transform.property("ADBE Vector Repeater Anchor") as Property;
    if (anchor) {
      var anchorValue = anchor.value as number[];
      transformResult.anchorPoint = [Math.round(anchorValue[0]), Math.round(anchorValue[1])];
    }

    var position = transform.property("ADBE Vector Repeater Position") as Property;
    if (position) {
      var positionValue = position.value as number[];
      transformResult.position = [Math.round(positionValue[0]), Math.round(positionValue[1])];
    }

    var scale = transform.property("ADBE Vector Repeater Scale") as Property;
    if (scale) {
      var scaleValue = scale.value as number[];
      transformResult.scale = [Math.round(scaleValue[0]), Math.round(scaleValue[1])];
    }

    var rotation = transform.property("ADBE Vector Repeater Rotation") as Property;
    if (rotation) transformResult.rotation = rotation.value as number;

    var startOpacity = transform.property("ADBE Vector Repeater Start Opacity") as Property;
    if (startOpacity) transformResult.startOpacity = startOpacity.value as number;

    var endOpacity = transform.property("ADBE Vector Repeater End Opacity") as Property;
    if (endOpacity) transformResult.endOpacity = endOpacity.value as number;

    if (Object.keys(transformResult).length > 0) {
      result.transform = transformResult;
    }
  }

  return result;
}

function readOffsetPaths(offsetProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "offsetPaths" };

  var amount = offsetProp.property("ADBE Vector Offset Amount") as Property;
  if (amount) result.amount = amount.value as number;

  var lineJoin = offsetProp.property("ADBE Vector Offset Line Join") as Property;
  if (lineJoin) {
    var lineJoinValue = lineJoin.value as number;
    result.lineJoin = lineJoinValue === 2 ? "round" : lineJoinValue === 3 ? "bevel" : "miter";
  }

  var miterLimit = offsetProp.property("ADBE Vector Offset Miter Limit") as Property;
  if (miterLimit) result.miterLimit = miterLimit.value as number;

  return result;
}

function readPuckerBloat(pbProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "puckerBloat" };
  var amount = pbProp.property("ADBE Vector PuckerBloat Amount") as Property;
  if (amount) result.amount = amount.value as number;
  return result;
}

function readRoundCorners(rcProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "roundCorners" };
  var radius = rcProp.property("ADBE Vector RoundCorner Radius") as Property;
  if (radius) result.radius = radius.value as number;
  return result;
}

function readMergePaths(mergeProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "mergePaths" };
  var mergeType = mergeProp.property("ADBE Vector Merge Type") as Property;
  if (mergeType) {
    var mergeTypeValue = mergeType.value as number;
    result.mode =
      mergeTypeValue === 2
        ? "add"
        : mergeTypeValue === 3
          ? "subtract"
          : mergeTypeValue === 4
            ? "intersect"
            : mergeTypeValue === 5
              ? "excludeIntersections"
              : "merge";
  }
  return result;
}

function readTwist(twistProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "twist" };
  var angle = twistProp.property("ADBE Vector Twist Angle") as Property;
  if (angle) result.angle = angle.value as number;

  var center = twistProp.property("ADBE Vector Twist Center") as Property;
  if (center) {
    var centerValue = center.value as number[];
    result.center = [Math.round(centerValue[0]), Math.round(centerValue[1])];
  }
  return result;
}

function readWigglePaths(roughenProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "wigglePaths" };

  var size = roughenProp.property("ADBE Vector Roughen Size") as Property;
  if (size) result.size = size.value as number;

  var detail = roughenProp.property("ADBE Vector Roughen Detail") as Property;
  if (detail) result.detail = detail.value as number;

  var points = roughenProp.property("ADBE Vector Roughen Points") as Property;
  if (points) result.points = (points.value as number) === 2 ? "smooth" : "corner";

  var wigglesPerSecond = roughenProp.property("ADBE Vector Roughen Wiggles Per Second") as Property;
  if (wigglesPerSecond) result.wigglesPerSecond = wigglesPerSecond.value as number;

  var correlation = roughenProp.property("ADBE Vector Roughen Correlation") as Property;
  if (correlation) result.correlation = correlation.value as number;

  var temporalPhase = roughenProp.property("ADBE Vector Roughen Temporal Phase") as Property;
  if (temporalPhase) result.temporalPhase = temporalPhase.value as number;

  var spatialPhase = roughenProp.property("ADBE Vector Roughen Spatial Phase") as Property;
  if (spatialPhase) result.spatialPhase = spatialPhase.value as number;

  var randomSeed = roughenProp.property("ADBE Vector Roughen Random Seed") as Property;
  if (randomSeed) result.randomSeed = randomSeed.value as number;

  return result;
}

function readShapeOperator(prop: PropertyGroup): object | null {
  var matchName = prop.matchName;
  if (matchName === "ADBE Vector Filter - Trim") return readTrimPaths(prop);
  if (matchName === "ADBE Vector Filter - Zigzag") return readZigZag(prop);
  if (matchName === "ADBE Vector Filter - Repeater") return readRepeater(prop);
  if (matchName === "ADBE Vector Filter - Offset") return readOffsetPaths(prop);
  if (matchName === "ADBE Vector Filter - PB") return readPuckerBloat(prop);
  if (matchName === "ADBE Vector Filter - RC") return readRoundCorners(prop);
  if (matchName === "ADBE Vector Filter - Merge") return readMergePaths(prop);
  if (matchName === "ADBE Vector Filter - Twist") return readTwist(prop);
  if (matchName === "ADBE Vector Filter - Roughen") return readWigglePaths(prop);
  return null;
}

/**
 * Read custom path shape properties.
 */
function readPath(pathProp: PropertyGroup): object | null {
  var shapeProp = pathProp.property("ADBE Vector Shape") as Property;
  if (!shapeProp) return null;

  var shapeVal = shapeProp.value as Shape;
  if (!shapeVal || !shapeVal.vertices) return null;

  var result: { [key: string]: any } = { type: "path" };

  var vertices: number[][] = [];
  for (var i = 0; i < shapeVal.vertices.length; i++) {
    var v = shapeVal.vertices[i] as number[];
    vertices.push([roundCoord(v[0]), roundCoord(v[1])]);
  }
  result.vertices = vertices;

  if (shapeVal.inTangents && shapeVal.inTangents.length > 0) {
    var hasNonZeroInTangents = false;
    var inTangents: number[][] = [];
    for (var i = 0; i < shapeVal.inTangents.length; i++) {
      var inTangent = shapeVal.inTangents[i] as number[];
      if (inTangent[0] !== 0 || inTangent[1] !== 0) {
        hasNonZeroInTangents = true;
      }
      inTangents.push([roundCoord(inTangent[0]), roundCoord(inTangent[1])]);
    }
    if (hasNonZeroInTangents) {
      result.inTangents = inTangents;
    }
  }

  if (shapeVal.outTangents && shapeVal.outTangents.length > 0) {
    var hasNonZeroOutTangents = false;
    var outTangents: number[][] = [];
    for (var i = 0; i < shapeVal.outTangents.length; i++) {
      var outTangent = shapeVal.outTangents[i] as number[];
      if (outTangent[0] !== 0 || outTangent[1] !== 0) {
        hasNonZeroOutTangents = true;
      }
      outTangents.push([roundCoord(outTangent[0]), roundCoord(outTangent[1])]);
    }
    if (hasNonZeroOutTangents) {
      result.outTangents = outTangents;
    }
  }

  if (shapeVal.closed === false) {
    result.closed = false;
  }

  return result;
}

/**
 * Convert simple open 2-point stroked paths into rectangle shapes.
 * This avoids noisy vertex exports for common lower-third bars.
 */
function normalizeSimplePathShape(shape: { [key: string]: any }): { [key: string]: any } {
  if (shape.type !== "path") return shape;
  if (shape.closed !== false) return shape;
  if (!(shape.vertices instanceof Array) || shape.vertices.length !== 2) return shape;
  if (shape.inTangents || shape.outTangents) return shape;
  if (!shape.stroke || typeof shape.stroke !== "object") return shape;
  if (typeof shape.stroke.width !== "number" || shape.stroke.width <= 0) return shape;

  var v1 = shape.vertices[0];
  var v2 = shape.vertices[1];
  if (!(v1 instanceof Array) || !(v2 instanceof Array)) return shape;
  if (v1.length < 2 || v2.length < 2) return shape;

  var x1 = v1[0] as number;
  var y1 = v1[1] as number;
  var x2 = v2[0] as number;
  var y2 = v2[1] as number;

  var isHorizontal = Math.abs(y1 - y2) < 0.001;
  var isVertical = Math.abs(x1 - x2) < 0.001;
  if (!isHorizontal && !isVertical) return shape;

  var thickness = Math.round((shape.stroke.width as number) * 1000) / 1000;
  var width = isHorizontal ? Math.abs(x2 - x1) : thickness;
  var height = isHorizontal ? thickness : Math.abs(y2 - y1);

  if (width <= 0 || height <= 0) return shape;

  var centerX = roundCoord((x1 + x2) / 2);
  var centerY = roundCoord((y1 + y2) / 2);

  var normalized: { [key: string]: any } = {
    type: "rectangle",
    size: [roundCoord(width), roundCoord(height)],
    position: [centerX, centerY],
  };

  // Open paths visually come from stroke; use stroke color as fill for rectangle.
  if (shape.stroke.color) {
    normalized.fill = { color: shape.stroke.color };
  } else if (shape.fill && shape.fill.color) {
    normalized.fill = { color: shape.fill.color };
  }

  if (shape.name) normalized.name = shape.name;
  if (shape.operators) normalized.operators = shape.operators;

  return normalized;
}

/**
 * Read a single shape group and return its shape definition.
 */
function readShapeGroup(group: PropertyGroup): object | null {
  var contents = group.property("ADBE Vectors Group") as PropertyGroup;
  if (!contents) return null;

  var shapeResult: { [key: string]: any } | null = null;
  var fill: object | null = null;
  var stroke: object | null = null;
  var operators: object[] = [];

  // Iterate through group contents to find shape, fill, stroke
  for (var i = 1; i <= contents.numProperties; i++) {
    var prop = contents.property(i) as PropertyGroup;
    if (!prop) continue;

    var matchName = prop.matchName;

    if (matchName === "ADBE Vector Shape - Rect") {
      shapeResult = readRectangle(prop);
    } else if (matchName === "ADBE Vector Shape - Ellipse") {
      shapeResult = readEllipse(prop);
    } else if (matchName === "ADBE Vector Shape - Star") {
      shapeResult = readPolystar(prop);
    } else if (matchName === "ADBE Vector Shape - Group") {
      shapeResult = readPath(prop);
    } else if (matchName === "ADBE Vector Graphic - Fill") {
      fill = readFill(prop);
    } else if (matchName === "ADBE Vector Graphic - Stroke") {
      stroke = readStroke(prop);
    } else if (matchName.indexOf("ADBE Vector Filter -") === 0) {
      var operator = readShapeOperator(prop);
      if (operator) {
        operators.push(operator);
      }
    }
    // Skip unsupported shape types
  }

  if (!shapeResult) return null;

  // Normalize common noisy path exports to cleaner primitives where possible.
  shapeResult = normalizeSimplePathShape(shapeResult);

  // Add group name if different from default
  var groupName = group.name;
  if (
    groupName &&
    groupName !== "Group 1" &&
    !groupName.match(/^Group \d+$/) &&
    !groupName.match(/^Shape \d+$/)
  ) {
    shapeResult.name = groupName;
  }

  // Add fill and stroke
  if (fill) {
    shapeResult.fill = fill;
  }
  if (stroke) {
    shapeResult.stroke = stroke;
  }
  if (operators.length > 0) {
    shapeResult.operators = operators;
  }

  // Path shapes (and normalized shapes) use group transform for position offset.
  if (shapeResult.type === "path" || shapeResult.type === "rectangle" || shapeResult.type === "ellipse" || shapeResult.type === "polygon" || shapeResult.type === "star") {
    var groupTransform = group.property("ADBE Vector Transform Group") as PropertyGroup;
    if (groupTransform) {
      var groupPos = groupTransform.property("ADBE Vector Position") as Property;
      if (groupPos) {
        var pos = groupPos.value as number[];
        if (pos[0] !== 0 || pos[1] !== 0) {
          if (shapeResult.position && shapeResult.position instanceof Array && shapeResult.position.length === 2) {
            shapeResult.position = [
              roundCoord((shapeResult.position[0] as number) + pos[0]),
              roundCoord((shapeResult.position[1] as number) + pos[1]),
            ];
          } else {
            shapeResult.position = [roundCoord(pos[0]), roundCoord(pos[1])];
          }
        }
      }
    }
  }

  return shapeResult;
}

/**
 * Read all shapes from a shape layer.
 * Returns an array of shape definitions or null if no parametric shapes found.
 */
export function readShapes(layer: ShapeLayer): object[] | null {
  var rootVectors: PropertyGroup;
  try {
    rootVectors = layer.property("ADBE Root Vectors Group") as PropertyGroup;
  } catch (e) {
    return null;
  }

  if (!rootVectors || rootVectors.numProperties === 0) return null;

  var shapes: object[] = [];

  for (var i = 1; i <= rootVectors.numProperties; i++) {
    var group = rootVectors.property(i) as PropertyGroup;
    if (!group || group.matchName !== "ADBE Vector Group") continue;

    var shapeObj = readShapeGroup(group);
    if (shapeObj) {
      shapes.push(shapeObj);
    }
  }

  return shapes.length > 0 ? shapes : null;
}

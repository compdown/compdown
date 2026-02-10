/**
 * Shape definitions from YAML.
 */

interface KeyframeDef {
  time: number;
  value: number | [number, number] | [number, number, number];
  easing?: string;
}

interface ShapeFillDef {
  color: string | KeyframeDef[];
  opacity?: number | KeyframeDef[];
}

interface ShapeStrokeDef {
  color: string | KeyframeDef[];
  width?: number | KeyframeDef[];
  opacity?: number | KeyframeDef[];
}

interface TrimPathsOperatorDef {
  type: "trimPaths";
  start?: number | KeyframeDef[];
  end?: number | KeyframeDef[];
  offset?: number | KeyframeDef[];
  trimMultipleShapes?: "simultaneously" | "individually";
}

interface ZigZagOperatorDef {
  type: "zigZag";
  size?: number | KeyframeDef[];
  ridgesPerSegment?: number | KeyframeDef[];
  points?: "corner" | "smooth";
}

interface RepeaterTransformDef {
  anchorPoint?: [number, number] | KeyframeDef[];
  position?: [number, number] | KeyframeDef[];
  scale?: [number, number] | KeyframeDef[];
  rotation?: number | KeyframeDef[];
  startOpacity?: number | KeyframeDef[];
  endOpacity?: number | KeyframeDef[];
}

interface RepeaterOperatorDef {
  type: "repeater";
  copies?: number | KeyframeDef[];
  offset?: number | KeyframeDef[];
  transform?: RepeaterTransformDef;
}

interface OffsetPathsOperatorDef {
  type: "offsetPaths";
  amount?: number | KeyframeDef[];
  lineJoin?: "miter" | "round" | "bevel";
  miterLimit?: number | KeyframeDef[];
}

interface PuckerBloatOperatorDef {
  type: "puckerBloat";
  amount?: number | KeyframeDef[];
}

interface RoundCornersOperatorDef {
  type: "roundCorners";
  radius?: number | KeyframeDef[];
}

interface MergePathsOperatorDef {
  type: "mergePaths";
  mode?: "merge" | "add" | "subtract" | "intersect" | "excludeIntersections";
}

interface TwistOperatorDef {
  type: "twist";
  angle?: number | KeyframeDef[];
  center?: [number, number] | KeyframeDef[];
}

interface WigglePathsOperatorDef {
  type: "wigglePaths";
  size?: number | KeyframeDef[];
  detail?: number | KeyframeDef[];
  points?: "corner" | "smooth";
  wigglesPerSecond?: number | KeyframeDef[];
  correlation?: number | KeyframeDef[];
  temporalPhase?: number | KeyframeDef[];
  spatialPhase?: number | KeyframeDef[];
  randomSeed?: number | KeyframeDef[];
}

type ShapeOperatorDef =
  | TrimPathsOperatorDef
  | ZigZagOperatorDef
  | RepeaterOperatorDef
  | OffsetPathsOperatorDef
  | PuckerBloatOperatorDef
  | RoundCornersOperatorDef
  | MergePathsOperatorDef
  | TwistOperatorDef
  | WigglePathsOperatorDef;

interface BaseShapeDef {
  name?: string;
  position?: [number, number] | KeyframeDef[];
  fill?: ShapeFillDef;
  stroke?: ShapeStrokeDef;
  operators?: ShapeOperatorDef[];
}

interface RectangleShapeDef extends BaseShapeDef {
  type: "rectangle";
  size: [number, number] | KeyframeDef[];
  roundness?: number | KeyframeDef[];
}

interface EllipseShapeDef extends BaseShapeDef {
  type: "ellipse";
  size: [number, number] | KeyframeDef[];
}

interface PolygonShapeDef extends BaseShapeDef {
  type: "polygon";
  points: number | KeyframeDef[];
  outerRadius: number | KeyframeDef[];
  outerRoundness?: number | KeyframeDef[];
  rotation?: number | KeyframeDef[];
}

interface StarShapeDef extends BaseShapeDef {
  type: "star";
  points: number | KeyframeDef[];
  outerRadius: number | KeyframeDef[];
  innerRadius: number | KeyframeDef[];
  outerRoundness?: number | KeyframeDef[];
  innerRoundness?: number | KeyframeDef[];
  rotation?: number | KeyframeDef[];
}

interface PathShapeDef extends BaseShapeDef {
  type: "path";
  vertices: [number, number][];
  inTangents?: [number, number][];
  outTangents?: [number, number][];
  closed?: boolean;
}

type ShapeDef =
  | RectangleShapeDef
  | EllipseShapeDef
  | PolygonShapeDef
  | StarShapeDef
  | PathShapeDef;

/**
 * Parse hex color string to [r, g, b] array (0-1 range).
 */
function hexToRgb(hex: string): [number, number, number] {
  var r = parseInt(hex.substring(0, 2), 16) / 255;
  var g = parseInt(hex.substring(2, 4), 16) / 255;
  var b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Check if a value is an array of keyframe objects (has `time` property)
 * rather than a numeric tuple like [100, 200].
 */
function isKeyframeArray(val: any): val is KeyframeDef[] {
  if (!(val instanceof Array) || val.length === 0) return false;
  return typeof val[0] === "object" && val[0] !== null && "time" in val[0];
}

/**
 * Apply easing to a keyframe.
 * @param prop The property containing the keyframe
 * @param keyIndex 1-based keyframe index
 * @param easing The easing type: "linear", "easeIn", "easeOut", "easeInOut", "hold"
 */
function applyEasing(prop: Property, keyIndex: number, easing: string): void {
  if (easing === "hold") {
    prop.setInterpolationTypeAtKey(
      keyIndex,
      KeyframeInterpolationType.HOLD,
      KeyframeInterpolationType.HOLD
    );
    return;
  }

  if (easing === "linear") {
    prop.setInterpolationTypeAtKey(
      keyIndex,
      KeyframeInterpolationType.LINEAR,
      KeyframeInterpolationType.LINEAR
    );
    return;
  }

  // For bezier easing, we need to determine the number of dimensions
  var keyVal = prop.keyValue(keyIndex);
  var dimensions = 1;
  if (keyVal instanceof Array) {
    dimensions = keyVal.length;
  }

  // Create ease objects for each dimension
  var easeInfluence = 33.33;
  var linearEase: KeyframeEase[] = [];
  var easedEase: KeyframeEase[] = [];

  for (var d = 0; d < dimensions; d++) {
    linearEase.push(new KeyframeEase(0, 0.1));
    easedEase.push(new KeyframeEase(0, easeInfluence));
  }

  // Set interpolation type to bezier first
  prop.setInterpolationTypeAtKey(
    keyIndex,
    KeyframeInterpolationType.BEZIER,
    KeyframeInterpolationType.BEZIER
  );

  // Apply the appropriate ease
  if (easing === "easeIn") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, linearEase);
  } else if (easing === "easeOut") {
    prop.setTemporalEaseAtKey(keyIndex, linearEase, easedEase);
  } else if (easing === "easeInOut") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, easedEase);
  }
}

/**
 * Apply keyframes to a property.
 */
function applyKeyframes(prop: Property, keyframes: KeyframeDef[]): void {
  // First pass: set all keyframe values
  for (var k = 0; k < keyframes.length; k++) {
    prop.setValueAtTime(keyframes[k].time, keyframes[k].value);
  }

  // Second pass: apply easing (keyframe indices are 1-based in AE)
  for (var k = 0; k < keyframes.length; k++) {
    var easing = keyframes[k].easing;
    if (easing) {
      applyEasing(prop, k + 1, easing);
    }
  }
}

/**
 * Add a fill to a shape group.
 */
function addFill(groupContents: PropertyGroup, fillDef: ShapeFillDef): void {
  var fill = groupContents.addProperty("ADBE Vector Graphic - Fill") as PropertyGroup;
  var colorProp = fill.property("ADBE Vector Fill Color") as Property;

  if (isKeyframeArray(fillDef.color)) {
    applyKeyframes(colorProp, fillDef.color);
  } else {
    //@ts-ignore
    colorProp.setValue(hexToRgb(fillDef.color as string));
  }

  if (fillDef.opacity !== undefined) {
    var opacityProp = fill.property("ADBE Vector Fill Opacity") as Property;
    if (isKeyframeArray(fillDef.opacity)) {
      applyKeyframes(opacityProp, fillDef.opacity);
    } else {
      //@ts-ignore
      opacityProp.setValue(fillDef.opacity);
    }
  }
}

/**
 * Add a stroke to a shape group.
 */
function addStroke(groupContents: PropertyGroup, strokeDef: ShapeStrokeDef): void {
  var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke") as PropertyGroup;
  var colorProp = stroke.property("ADBE Vector Stroke Color") as Property;

  if (isKeyframeArray(strokeDef.color)) {
    applyKeyframes(colorProp, strokeDef.color);
  } else {
    //@ts-ignore
    colorProp.setValue(hexToRgb(strokeDef.color as string));
  }

  if (strokeDef.width !== undefined) {
    var widthProp = stroke.property("ADBE Vector Stroke Width") as Property;
    if (isKeyframeArray(strokeDef.width)) {
      applyKeyframes(widthProp, strokeDef.width);
    } else {
      //@ts-ignore
      widthProp.setValue(strokeDef.width);
    }
  }

  if (strokeDef.opacity !== undefined) {
    var opacityProp = stroke.property("ADBE Vector Stroke Opacity") as Property;
    if (isKeyframeArray(strokeDef.opacity)) {
      applyKeyframes(opacityProp, strokeDef.opacity);
    } else {
      //@ts-ignore
      opacityProp.setValue(strokeDef.opacity);
    }
  }
}

function setShapeProp(prop: Property, value: number | [number, number] | KeyframeDef[]): void {
  if (isKeyframeArray(value)) {
    applyKeyframes(prop, value);
  } else {
    //@ts-ignore
    prop.setValue(value);
  }
}

function applyRepeaterTransform(repeater: PropertyGroup, transformDef: RepeaterTransformDef): void {
  var transform = repeater.property("ADBE Vector Repeater Transform") as PropertyGroup;
  if (!transform) return;

  if (transformDef.anchorPoint !== undefined) {
    var anchor = transform.property("ADBE Vector Repeater Anchor") as Property;
    if (anchor) setShapeProp(anchor, transformDef.anchorPoint);
  }
  if (transformDef.position !== undefined) {
    var position = transform.property("ADBE Vector Repeater Position") as Property;
    if (position) setShapeProp(position, transformDef.position);
  }
  if (transformDef.scale !== undefined) {
    var scale = transform.property("ADBE Vector Repeater Scale") as Property;
    if (scale) setShapeProp(scale, transformDef.scale);
  }
  if (transformDef.rotation !== undefined) {
    var rotation = transform.property("ADBE Vector Repeater Rotation") as Property;
    if (rotation) setShapeProp(rotation, transformDef.rotation);
  }
  if (transformDef.startOpacity !== undefined) {
    var startOpacity = transform.property("ADBE Vector Repeater Start Opacity") as Property;
    if (startOpacity) setShapeProp(startOpacity, transformDef.startOpacity);
  }
  if (transformDef.endOpacity !== undefined) {
    var endOpacity = transform.property("ADBE Vector Repeater End Opacity") as Property;
    if (endOpacity) setShapeProp(endOpacity, transformDef.endOpacity);
  }
}

function addShapeOperator(groupContents: PropertyGroup, operatorDef: ShapeOperatorDef): void {
  if (operatorDef.type === "trimPaths") {
    var trim = groupContents.addProperty("ADBE Vector Filter - Trim") as PropertyGroup;
    if (!trim) return;

    if (operatorDef.start !== undefined) {
      var start = trim.property("ADBE Vector Trim Start") as Property;
      if (start) setShapeProp(start, operatorDef.start);
    }
    if (operatorDef.end !== undefined) {
      var end = trim.property("ADBE Vector Trim End") as Property;
      if (end) setShapeProp(end, operatorDef.end);
    }
    if (operatorDef.offset !== undefined) {
      var offset = trim.property("ADBE Vector Trim Offset") as Property;
      if (offset) setShapeProp(offset, operatorDef.offset);
    }
    if (operatorDef.trimMultipleShapes) {
      var trimType = trim.property("ADBE Vector Trim Type") as Property;
      if (trimType) {
        //@ts-ignore
        trimType.setValue(operatorDef.trimMultipleShapes === "individually" ? 2 : 1);
      }
    }
    return;
  }

  if (operatorDef.type === "zigZag") {
    var zigZag = groupContents.addProperty("ADBE Vector Filter - Zigzag") as PropertyGroup;
    if (!zigZag) return;

    if (operatorDef.size !== undefined) {
      var size = zigZag.property("ADBE Vector Zigzag Size") as Property;
      if (size) setShapeProp(size, operatorDef.size);
    }
    if (operatorDef.ridgesPerSegment !== undefined) {
      var ridges = zigZag.property("ADBE Vector Zigzag Detail") as Property;
      if (ridges) setShapeProp(ridges, operatorDef.ridgesPerSegment);
    }
    if (operatorDef.points) {
      var points = zigZag.property("ADBE Vector Zigzag Points") as Property;
      if (points) {
        //@ts-ignore
        points.setValue(operatorDef.points === "smooth" ? 2 : 1);
      }
    }
    return;
  }

  if (operatorDef.type === "repeater") {
    var repeater = groupContents.addProperty("ADBE Vector Filter - Repeater") as PropertyGroup;
    if (!repeater) return;

    if (operatorDef.copies !== undefined) {
      var copies = repeater.property("ADBE Vector Repeater Copies") as Property;
      if (copies) setShapeProp(copies, operatorDef.copies);
    }
    if (operatorDef.offset !== undefined) {
      var offset = repeater.property("ADBE Vector Repeater Offset") as Property;
      if (offset) setShapeProp(offset, operatorDef.offset);
    }
    if (operatorDef.transform) {
      applyRepeaterTransform(repeater, operatorDef.transform);
    }
    return;
  }

  if (operatorDef.type === "offsetPaths") {
    var offsetPaths = groupContents.addProperty("ADBE Vector Filter - Offset") as PropertyGroup;
    if (!offsetPaths) return;

    if (operatorDef.amount !== undefined) {
      var amount = offsetPaths.property("ADBE Vector Offset Amount") as Property;
      if (amount) setShapeProp(amount, operatorDef.amount);
    }
    if (operatorDef.lineJoin) {
      var lineJoin = offsetPaths.property("ADBE Vector Offset Line Join") as Property;
      if (lineJoin) {
        var lineJoinMap: { [key: string]: number } = { miter: 1, round: 2, bevel: 3 };
        //@ts-ignore
        lineJoin.setValue(lineJoinMap[operatorDef.lineJoin] || 1);
      }
    }
    if (operatorDef.miterLimit !== undefined) {
      var miterLimit = offsetPaths.property("ADBE Vector Offset Miter Limit") as Property;
      if (miterLimit) setShapeProp(miterLimit, operatorDef.miterLimit);
    }
    return;
  }

  if (operatorDef.type === "puckerBloat") {
    var pb = groupContents.addProperty("ADBE Vector Filter - PB") as PropertyGroup;
    if (!pb) return;

    if (operatorDef.amount !== undefined) {
      var amount = pb.property("ADBE Vector PuckerBloat Amount") as Property;
      if (amount) setShapeProp(amount, operatorDef.amount);
    }
    return;
  }

  if (operatorDef.type === "roundCorners") {
    var roundCorners = groupContents.addProperty("ADBE Vector Filter - RC") as PropertyGroup;
    if (!roundCorners) return;

    if (operatorDef.radius !== undefined) {
      var radius = roundCorners.property("ADBE Vector RoundCorner Radius") as Property;
      if (radius) setShapeProp(radius, operatorDef.radius);
    }
    return;
  }

  if (operatorDef.type === "mergePaths") {
    var mergePaths = groupContents.addProperty("ADBE Vector Filter - Merge") as PropertyGroup;
    if (!mergePaths) return;

    if (operatorDef.mode) {
      var mergeType = mergePaths.property("ADBE Vector Merge Type") as Property;
      if (mergeType) {
        var mergeModeMap: { [key: string]: number } = {
          merge: 1,
          add: 2,
          subtract: 3,
          intersect: 4,
          excludeIntersections: 5,
        };
        //@ts-ignore
        mergeType.setValue(mergeModeMap[operatorDef.mode] || 1);
      }
    }
    return;
  }

  if (operatorDef.type === "twist") {
    var twist = groupContents.addProperty("ADBE Vector Filter - Twist") as PropertyGroup;
    if (!twist) return;

    if (operatorDef.angle !== undefined) {
      var angle = twist.property("ADBE Vector Twist Angle") as Property;
      if (angle) setShapeProp(angle, operatorDef.angle);
    }
    if (operatorDef.center !== undefined) {
      var center = twist.property("ADBE Vector Twist Center") as Property;
      if (center) setShapeProp(center, operatorDef.center);
    }
    return;
  }

  if (operatorDef.type === "wigglePaths") {
    var roughen = groupContents.addProperty("ADBE Vector Filter - Roughen") as PropertyGroup;
    if (!roughen) return;

    if (operatorDef.size !== undefined) {
      var size = roughen.property("ADBE Vector Roughen Size") as Property;
      if (size) setShapeProp(size, operatorDef.size);
    }
    if (operatorDef.detail !== undefined) {
      var detail = roughen.property("ADBE Vector Roughen Detail") as Property;
      if (detail) setShapeProp(detail, operatorDef.detail);
    }
    if (operatorDef.points) {
      var points = roughen.property("ADBE Vector Roughen Points") as Property;
      if (points) {
        //@ts-ignore
        points.setValue(operatorDef.points === "smooth" ? 2 : 1);
      }
    }
    if (operatorDef.wigglesPerSecond !== undefined) {
      var wigglesPerSecond = roughen.property("ADBE Vector Roughen Wiggles Per Second") as Property;
      if (wigglesPerSecond) setShapeProp(wigglesPerSecond, operatorDef.wigglesPerSecond);
    }
    if (operatorDef.correlation !== undefined) {
      var correlation = roughen.property("ADBE Vector Roughen Correlation") as Property;
      if (correlation) setShapeProp(correlation, operatorDef.correlation);
    }
    if (operatorDef.temporalPhase !== undefined) {
      var temporalPhase = roughen.property("ADBE Vector Roughen Temporal Phase") as Property;
      if (temporalPhase) setShapeProp(temporalPhase, operatorDef.temporalPhase);
    }
    if (operatorDef.spatialPhase !== undefined) {
      var spatialPhase = roughen.property("ADBE Vector Roughen Spatial Phase") as Property;
      if (spatialPhase) setShapeProp(spatialPhase, operatorDef.spatialPhase);
    }
    if (operatorDef.randomSeed !== undefined) {
      var randomSeed = roughen.property("ADBE Vector Roughen Random Seed") as Property;
      if (randomSeed) setShapeProp(randomSeed, operatorDef.randomSeed);
    }
  }
}

/**
 * Add a rectangle shape to a group.
 */
function addRectangle(groupContents: PropertyGroup, shapeDef: RectangleShapeDef): void {
  var rect = groupContents.addProperty("ADBE Vector Shape - Rect") as PropertyGroup;

  var sizeProp = rect.property("ADBE Vector Rect Size") as Property;
  if (isKeyframeArray(shapeDef.size)) {
    applyKeyframes(sizeProp, shapeDef.size);
  } else {
    //@ts-ignore
    sizeProp.setValue(shapeDef.size);
  }

  if (shapeDef.position) {
    var posProp = rect.property("ADBE Vector Rect Position") as Property;
    if (isKeyframeArray(shapeDef.position)) {
      applyKeyframes(posProp, shapeDef.position);
    } else {
      //@ts-ignore
      posProp.setValue(shapeDef.position);
    }
  }

  if (shapeDef.roundness !== undefined) {
    var roundnessProp = rect.property("ADBE Vector Rect Roundness") as Property;
    if (isKeyframeArray(shapeDef.roundness)) {
      applyKeyframes(roundnessProp, shapeDef.roundness);
    } else {
      //@ts-ignore
      roundnessProp.setValue(shapeDef.roundness);
    }
  }
}

/**
 * Add an ellipse shape to a group.
 */
function addEllipse(groupContents: PropertyGroup, shapeDef: EllipseShapeDef): void {
  var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse") as PropertyGroup;

  var size = ellipse.property("ADBE Vector Ellipse Size") as Property;
  if (isKeyframeArray(shapeDef.size)) {
    applyKeyframes(size, shapeDef.size);
  } else {
    //@ts-ignore
    size.setValue(shapeDef.size);
  }

  if (shapeDef.position) {
    var pos = ellipse.property("ADBE Vector Ellipse Position") as Property;
    if (isKeyframeArray(shapeDef.position)) {
      applyKeyframes(pos, shapeDef.position);
    } else {
      //@ts-ignore
      pos.setValue(shapeDef.position);
    }
  }
}

/**
 * Add a polygon shape to a group (uses polystar with type = polygon).
 */
function addPolygon(groupContents: PropertyGroup, shapeDef: PolygonShapeDef): void {
  var polystar = groupContents.addProperty("ADBE Vector Shape - Star") as PropertyGroup;

  // Set type to polygon (2)
  var type = polystar.property("ADBE Vector Star Type") as Property;
  //@ts-ignore
  type.setValue(2); // 1 = star, 2 = polygon

  var points = polystar.property("ADBE Vector Star Points") as Property;
  if (isKeyframeArray(shapeDef.points)) {
    applyKeyframes(points, shapeDef.points);
  } else {
    //@ts-ignore
    points.setValue(shapeDef.points);
  }

  var outerRadius = polystar.property("ADBE Vector Star Outer Radius") as Property;
  if (isKeyframeArray(shapeDef.outerRadius)) {
    applyKeyframes(outerRadius, shapeDef.outerRadius);
  } else {
    //@ts-ignore
    outerRadius.setValue(shapeDef.outerRadius);
  }

  if (shapeDef.position) {
    var pos = polystar.property("ADBE Vector Star Position") as Property;
    if (isKeyframeArray(shapeDef.position)) {
      applyKeyframes(pos, shapeDef.position);
    } else {
      //@ts-ignore
      pos.setValue(shapeDef.position);
    }
  }

  if (shapeDef.outerRoundness !== undefined) {
    var outerRound = polystar.property("ADBE Vector Star Outer Roundess") as Property;
    if (isKeyframeArray(shapeDef.outerRoundness)) {
      applyKeyframes(outerRound, shapeDef.outerRoundness);
    } else {
      //@ts-ignore
      outerRound.setValue(shapeDef.outerRoundness);
    }
  }

  if (shapeDef.rotation !== undefined) {
    var rotation = polystar.property("ADBE Vector Star Rotation") as Property;
    if (isKeyframeArray(shapeDef.rotation)) {
      applyKeyframes(rotation, shapeDef.rotation);
    } else {
      //@ts-ignore
      rotation.setValue(shapeDef.rotation);
    }
  }
}

/**
 * Add a star shape to a group.
 */
function addStar(groupContents: PropertyGroup, shapeDef: StarShapeDef): void {
  var polystar = groupContents.addProperty("ADBE Vector Shape - Star") as PropertyGroup;

  // Set type to star (1) - this is the default, but be explicit
  var type = polystar.property("ADBE Vector Star Type") as Property;
  //@ts-ignore
  type.setValue(1); // 1 = star, 2 = polygon

  var points = polystar.property("ADBE Vector Star Points") as Property;
  if (isKeyframeArray(shapeDef.points)) {
    applyKeyframes(points, shapeDef.points);
  } else {
    //@ts-ignore
    points.setValue(shapeDef.points);
  }

  var outerRadius = polystar.property("ADBE Vector Star Outer Radius") as Property;
  if (isKeyframeArray(shapeDef.outerRadius)) {
    applyKeyframes(outerRadius, shapeDef.outerRadius);
  } else {
    //@ts-ignore
    outerRadius.setValue(shapeDef.outerRadius);
  }

  var innerRadius = polystar.property("ADBE Vector Star Inner Radius") as Property;
  if (isKeyframeArray(shapeDef.innerRadius)) {
    applyKeyframes(innerRadius, shapeDef.innerRadius);
  } else {
    //@ts-ignore
    innerRadius.setValue(shapeDef.innerRadius);
  }

  if (shapeDef.position) {
    var pos = polystar.property("ADBE Vector Star Position") as Property;
    if (isKeyframeArray(shapeDef.position)) {
      applyKeyframes(pos, shapeDef.position);
    } else {
      //@ts-ignore
      pos.setValue(shapeDef.position);
    }
  }

  if (shapeDef.outerRoundness !== undefined) {
    var outerRound = polystar.property("ADBE Vector Star Outer Roundess") as Property;
    if (isKeyframeArray(shapeDef.outerRoundness)) {
      applyKeyframes(outerRound, shapeDef.outerRoundness);
    } else {
      //@ts-ignore
      outerRound.setValue(shapeDef.outerRoundness);
    }
  }

  if (shapeDef.innerRoundness !== undefined) {
    var innerRound = polystar.property("ADBE Vector Star Inner Roundess") as Property;
    if (isKeyframeArray(shapeDef.innerRoundness)) {
      applyKeyframes(innerRound, shapeDef.innerRoundness);
    } else {
      //@ts-ignore
      innerRound.setValue(shapeDef.innerRoundness);
    }
  }

  if (shapeDef.rotation !== undefined) {
    var rotation = polystar.property("ADBE Vector Star Rotation") as Property;
    if (isKeyframeArray(shapeDef.rotation)) {
      applyKeyframes(rotation, shapeDef.rotation);
    } else {
      //@ts-ignore
      rotation.setValue(shapeDef.rotation);
    }
  }
}

/**
 * Add a custom path shape to a group.
 */
function addPath(groupContents: PropertyGroup, shapeDef: PathShapeDef): void {
  var pathGroup = groupContents.addProperty("ADBE Vector Shape - Group") as PropertyGroup;
  var shapeProp = pathGroup.property("ADBE Vector Shape") as Property;

  var vertices = shapeDef.vertices;
  var inTangents = shapeDef.inTangents || [];
  var outTangents = shapeDef.outTangents || [];

  if (inTangents.length > 0 && inTangents.length !== vertices.length) {
    throw new Error("inTangents must match vertices length for path shape");
  }
  if (outTangents.length > 0 && outTangents.length !== vertices.length) {
    throw new Error("outTangents must match vertices length for path shape");
  }

  var defaultInTangents: [number, number][] = [];
  var defaultOutTangents: [number, number][] = [];
  for (var i = 0; i < vertices.length; i++) {
    defaultInTangents.push([0, 0]);
    defaultOutTangents.push([0, 0]);
  }

  var shape = new Shape();
  shape.vertices = vertices as any;
  shape.inTangents =
    (inTangents.length > 0 ? inTangents : defaultInTangents) as any;
  shape.outTangents =
    (outTangents.length > 0 ? outTangents : defaultOutTangents) as any;
  shape.closed = shapeDef.closed !== false;

  //@ts-ignore
  shapeProp.setValue(shape);
}

/**
 * Apply shapes to a shape layer.
 * Creates shape groups with parametric shapes (rect, ellipse, polygon, star)
 * and optional fill/stroke.
 */
export function applyShapes(layer: ShapeLayer, shapes: ShapeDef[]): void {
  var rootVectors = layer.property("ADBE Root Vectors Group") as PropertyGroup;

  for (var i = 0; i < shapes.length; i++) {
    var shapeDef = shapes[i];

    // Create a new group for this shape
    var group = rootVectors.addProperty("ADBE Vector Group") as PropertyGroup;

    // Set group name if provided
    if (shapeDef.name) {
      group.name = shapeDef.name;
    }

    // Get the contents of the group where we add the shape and fill/stroke
    var groupContents = group.property("ADBE Vectors Group") as PropertyGroup;

    // Add the shape path
    switch (shapeDef.type) {
      case "rectangle":
        addRectangle(groupContents, shapeDef as RectangleShapeDef);
        break;
      case "ellipse":
        addEllipse(groupContents, shapeDef as EllipseShapeDef);
        break;
      case "polygon":
        addPolygon(groupContents, shapeDef as PolygonShapeDef);
        break;
      case "star":
        addStar(groupContents, shapeDef as StarShapeDef);
        break;
      case "path":
        addPath(groupContents, shapeDef as PathShapeDef);
        break;
    }

    // For custom paths, apply position via group transform if provided.
    if (shapeDef.type === "path" && shapeDef.position) {
      var groupTransform = group.property("ADBE Vector Transform Group") as PropertyGroup;
      var groupPos = groupTransform.property("ADBE Vector Position") as Property;
      if (isKeyframeArray(shapeDef.position)) {
        applyKeyframes(groupPos, shapeDef.position);
      } else {
        //@ts-ignore
        groupPos.setValue(shapeDef.position);
      }
    }

    if (shapeDef.operators && shapeDef.operators.length > 0) {
      for (var opIndex = 0; opIndex < shapeDef.operators.length; opIndex++) {
        addShapeOperator(groupContents, shapeDef.operators[opIndex]);
      }
    }

    // Add stroke first (so fill appears on top in layer panel, but renders correctly)
    if (shapeDef.stroke) {
      addStroke(groupContents, shapeDef.stroke);
    }

    // Add fill
    if (shapeDef.fill) {
      addFill(groupContents, shapeDef.fill);
    }
  }
}

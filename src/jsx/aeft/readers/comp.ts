import { readAllLayers, readSelectedLayers } from "./layer";
import { readEssentialGraphics } from "./essentialGraphics";
import { readMarkers } from "./markers";

function toHex(n: number): string {
  var hex = Math.round(n * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Read the active composition and return a JSON-serializable structure.
 * If selectionOnly is true, only reads selected layers.
 */
export function readComp(comp: CompItem, selectionOnly: boolean): object {
  var bgColor = comp.bgColor;
  var colorHex = toHex(bgColor[0]) + toHex(bgColor[1]) + toHex(bgColor[2]);

  var compData: { [key: string]: any } = {
    name: comp.name,
  };

  // Only include non-default comp settings (matching schema defaults)
  if (comp.width !== 1920) compData.width = comp.width;
  if (comp.height !== 1080) compData.height = comp.height;
  if (Math.abs(comp.duration - 10) > 0.001) compData.duration = comp.duration;
  if (Math.abs(comp.frameRate - 30) > 0.001) compData.framerate = comp.frameRate;
  if (Math.abs(comp.pixelAspect - 1) > 0.001) compData.pixelAspect = comp.pixelAspect;

  // Only include non-default color
  if (colorHex !== "000000") {
    compData.color = colorHex;
  }

  // Read layers
  compData.layers = selectionOnly
    ? readSelectedLayers(comp)
    : readAllLayers(comp);

  // Read Essential Graphics (if any)
  var egItems = readEssentialGraphics(comp);
  if (egItems && egItems.length > 0) {
    compData.essentialGraphics = egItems;
  }

  // Read markers (if any)
  var markerItems = readMarkers(comp);
  if (markerItems && markerItems.length > 0) {
    compData.markers = markerItems;
  }

  return compData;
}

/**
 * Collect files referenced by the composition's layers.
 * Returns deduplicated file entries.
 */
export function collectFiles(comp: CompItem): object[] {
  var files: object[] = [];
  var seen: { [path: string]: boolean } = {};

  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layers[i] as AVLayer;
    if (
      layer.source &&
      layer.source instanceof FootageItem &&
      (layer.source as FootageItem).file
    ) {
      var filePath = (layer.source as FootageItem).file!.fsName;
      if (!seen[filePath]) {
        seen[filePath] = true;
        files.push({
          id: (layer.source as FootageItem).name,
          path: filePath,
        });
      }
    }
  }

  return files;
}

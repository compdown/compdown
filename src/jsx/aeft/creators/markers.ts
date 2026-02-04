/**
 * Composition markers support.
 */

interface MarkerDef {
  time: number;
  comment?: string;
  duration?: number;
  chapter?: string;
  url?: string;
  label?: number;
}

/**
 * Add markers to a composition.
 */
export function addMarkers(comp: CompItem, markers: MarkerDef[]): void {
  var markerProp = comp.markerProperty;

  for (var i = 0; i < markers.length; i++) {
    var m = markers[i];
    var markerValue = new MarkerValue(m.comment || "");

    if (m.duration !== undefined) {
      markerValue.duration = m.duration;
    }
    if (m.chapter) {
      markerValue.chapter = m.chapter;
    }
    if (m.url) {
      markerValue.url = m.url;
    }
    if (m.label !== undefined) {
      markerValue.label = m.label;
    }

    markerProp.setValueAtTime(m.time, markerValue);
  }
}

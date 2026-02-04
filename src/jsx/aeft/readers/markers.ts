/**
 * Read markers from a composition.
 */
export function readMarkers(comp: CompItem): object[] | null {
  var markerProp = comp.markerProperty;
  if (markerProp.numKeys === 0) return null;

  var markers: object[] = [];

  for (var i = 1; i <= markerProp.numKeys; i++) {
    var time = Math.round(markerProp.keyTime(i) * 1000) / 1000;
    var markerValue = markerProp.keyValue(i) as MarkerValue;

    var m: { [key: string]: any } = { time: time };

    if (markerValue.comment) {
      m.comment = markerValue.comment;
    }
    if (markerValue.duration > 0) {
      m.duration = markerValue.duration;
    }
    if (markerValue.chapter) {
      m.chapter = markerValue.chapter;
    }
    if (markerValue.url) {
      m.url = markerValue.url;
    }
    if (markerValue.label !== 0) {
      m.label = markerValue.label;
    }

    markers.push(m);
  }

  return markers.length > 0 ? markers : null;
}

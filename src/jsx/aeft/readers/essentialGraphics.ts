/**
 * Read Essential Graphics properties from a composition.
 *
 * Note: The AE API does not provide a way to get the source property path back
 * from a Motion Graphics Template controller. We can only export the controller
 * names, not the full layer.property paths.
 */
export function readEssentialGraphics(comp: CompItem): object[] | null {
  var count = comp.motionGraphicsTemplateControllerCount;
  if (count === 0) return null;

  var items: object[] = [];
  for (var i = 0; i < count; i++) {
    var name = comp.getMotionGraphicsTemplateControllerName(i);
    items.push({ name: name });
  }
  return items;
}

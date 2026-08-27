import { BoundingBox, Geometry } from "../types/geometry";

export function computeGeometryBounds(geometries: Geometry[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const geom of geometries) {
    switch (geom.type) {
      case "line":
        minX = Math.min(minX, geom.start.x, geom.end.x);
        minY = Math.min(minY, geom.start.y, geom.end.y);
        maxX = Math.max(maxX, geom.start.x, geom.end.x);
        maxY = Math.max(maxY, geom.start.y, geom.end.y);
        break;
      case "circle":
        minX = Math.min(minX, geom.center.x - geom.radius);
        minY = Math.min(minY, geom.center.y - geom.radius);
        maxX = Math.max(maxX, geom.center.x + geom.radius);
        maxY = Math.max(maxY, geom.center.y + geom.radius);
        break;
      case "arc":
        minX = Math.min(minX, geom.center.x - geom.radius);
        minY = Math.min(minY, geom.center.y - geom.radius);
        maxX = Math.max(maxX, geom.center.x + geom.radius);
        maxY = Math.max(maxY, geom.center.y + geom.radius);
        break;
      case "rectangle":
        minX = Math.min(minX, geom.center.x - geom.width / 2);
        minY = Math.min(minY, geom.center.y - geom.height / 2);
        maxX = Math.max(maxX, geom.center.x + geom.width / 2);
        maxY = Math.max(maxY, geom.center.y + geom.height / 2);
        break;
      case "region":
        for (const contour of geom.contours) {
          for (const pt of contour) {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
          }
        }
        break;

      case "flash":
        minX = Math.min(minX, geom.point.x - geom.size.width / 2);
        minY = Math.min(minY, geom.point.y - geom.size.height / 2);
        maxX = Math.max(maxX, geom.point.x + geom.size.width / 2);
        maxY = Math.max(maxY, geom.point.y + geom.size.height / 2);
        break;
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height
  };
}

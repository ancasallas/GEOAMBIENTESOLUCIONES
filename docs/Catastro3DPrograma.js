// Archivo: program.js
// Importante: cargar con type="module" en el HTML
// Requiere Cesium 1.132 por CDN en el HTML.

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDUzYzdkYS0wM2I5LTQ2NTYtYjQ0YS00YmNlYzA1ZWU5MjAiLCJpZCI6MzMxMzY4LCJpYXQiOjE3NTUwNDI1ODh9.MKN8zgCvadRLANRddQ8AO7T3eZzxrWMwk39zAIosiGQ';

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
      Cesium.ArcGisBaseMapType.SATELLITE
    )
  ),
  timeline: false,
  animation: false,
  shadows: true,
});
viewer.scene.globe.depthTestAgainstTerrain = true;

// ---------------------------------------------------------------------
// 1) Cargar y hacer zoom al polígono del barrio desde BARRIO.geojson
// ---------------------------------------------------------------------
const barrio = await Cesium.GeoJsonDataSource.load("BARRIO.geojson", {
  clampToGround: true,
});
viewer.dataSources.add(barrio);

// Estilizar el polígono del barrio (opcional)
for (const e of barrio.entities.values) {
  if (!e.polygon) continue;
  e.polygon.material = Cesium.Color.fromCssColorString("#1e88e5").withAlpha(0.35);
  e.polygon.outline = true;
  e.polygon.outlineColor = Cesium.Color.fromCssColorString("#0d47a1");
}

// Hacer zoom a la extensión del/los polígonos del barrio
await viewer.flyTo(barrio);

// ---------------------------------------------------------------------
// 2) Construcciones: extrusión por número de pisos (CONNPISOS * 3 m)
//    Fallback: 6 m si el atributo no viene o no es numérico
//    Exportar GeoJSON en EPSG:4326
// ---------------------------------------------------------------------
const predios = await Cesium.GeoJsonDataSource.load("Construcciones.geojson");
viewer.dataSources.add(predios);

// Helper para leer propiedades que pueden ser Cesium.Property o valores crudos
const getVal = (p) => (p && typeof p.getValue === "function" ? p.getValue() : p);

for (const e of predios.entities.values) {
  const pol = e.polygon;
  if (!pol) continue;

  const props = e.properties || {};

  // Lectura tolerante del campo CONNPISOS
  let pisosRaw =
    getVal(props.CONNPISOS) ??
    getVal(props.ConnPisos) ??
    getVal(props.connpisos);

  let pisos = Number(pisosRaw);
  if (!Number.isFinite(pisos) || pisos < 0) pisos = NaN;

  const altura = Number.isFinite(pisos) ? pisos * 3 : 6; // metros

  pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.95);
  pol.outline = true;
  pol.outlineColor = Cesium.Color.BLACK;

  // Extruir desde el terreno
  pol.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
  pol.extrudedHeight = altura;
  pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;

  
}

// ---------------------------------------------------------------------
// 3) (Opcional) Edificios OSM recortados a la envolvente del barrio
// ---------------------------------------------------------------------
const osm = await Cesium.createOsmBuildingsAsync();
viewer.scene.primitives.add(osm);

// Recortar OSM a la envolvente del primer polígono del barrio
const poly = barrio.entities.values.find((ent) => ent.polygon)?.polygon;
if (poly) {
  const positions = poly.hierarchy.getValue().positions;
  const toDeg = (c) => {
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(c);
    return {
      lon: Cesium.Math.toDegrees(carto.longitude),
      lat: Cesium.Math.toDegrees(carto.latitude),
    };
  };
  let west = 180, south = 90, east = -180, north = -90;
  positions.map(toDeg).forEach(({ lon, lat }) => {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  });
  const rect = Cesium.Rectangle.fromDegrees(west, south, east, north);
  osm.clippingPlanes = Cesium.ClippingPlaneCollection.fromBoundingRectangle(rect, {
    unionClippingRegions: true,
    edgeWidth: 0.0,
  });
}

// ---------------------------------------------------------------------
// 4) Cámara inicial alternativa (si quieres forzar una vista concreta)
//    Nota: si dejas este bloque, sobreescribe el flyTo anterior.
// ---------------------------------------------------------------------
// viewer.camera.flyTo({
//   destination: Cesium.Cartesian3.fromDegrees(-74.17653, 4.59027, 2600),
//   orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25) },
// });


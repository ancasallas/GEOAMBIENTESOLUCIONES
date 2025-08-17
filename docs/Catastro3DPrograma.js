// Importante: este archivo se carga con type="module" en el HTML
// y depende de Cesium 1.132 incluido vía CDN en el HTML.

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

// 1) Capa del barrio: SOLO para ubicar/recortar (sin extrusión)
const barrio = await Cesium.GeoJsonDataSource.load("Construcciones.geojson", {
  clampToGround: true,
});
viewer.dataSources.add(barrio);
for (const e of barrio.entities.values) {
  if (!e.polygon) continue;
  e.polygon.material = Cesium.Color.fromCssColorString("#1e88e5").withAlpha(0.25);
  e.polygon.outline = true;
  e.polygon.outlineColor = Cesium.Color.fromCssColorString("#0d47a1");
}
await viewer.flyTo(barrio);

// 2) PREDIOS: extrusión (usa 'altura' o 'pisos'; fallback 6 m)
// Exporta desde QGIS como EPSG:4326
const predios = await Cesium.GeoJsonDataSource.load("Construcciones.geojson", {
  // importante: SIN clampToGround si vas a extruir
});
viewer.dataSources.add(predios);

for (const e of predios.entities.values) {
  const pol = e.polygon;
  if (!pol) continue;

  const props = e.properties || {};
  const getVal = (p) => (p && typeof p.getValue === "function" ? p.getValue() : p);
  const alt = Number(getVal(props.altura));
  const pis = Number(getVal(props.pisos));
  const hasAltura = !Number.isNaN(alt);
  const hasPisos = !Number.isNaN(pis);

  const altura =
    hasAltura ? alt :
    hasPisos  ? pis * 3 /* 3 m por piso */ :
    6;

  pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.95);
  pol.outline = true;
  pol.outlineColor = Cesium.Color.BLACK;

  pol.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
  pol.extrudedHeight = altura; // en metros
  pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
}

// 3) (Opcional) Edificios OSM recortados a la zona del barrio
const osm = await Cesium.createOsmBuildingsAsync();
viewer.scene.primitives.add(osm);

// Recorta OSM a la envolvente del primer polígono del barrio
const poly = barrio.entities.values.find((e) => e.polygon)?.polygon;
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

// 4) Cámara inicial manual (por si lo prefieres)
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-74.17653, 4.59027, 2600),
  orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25) },
});

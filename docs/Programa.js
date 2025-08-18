// Limita la vista del mapa al barrio El Vergel
const bounds = L.latLngBounds(
  [4.643, -74.148], // esquina suroeste
  [4.649, -74.140]  // esquina noreste
);

const map = L.map('map', {
  maxBounds: bounds,
  maxZoom: 18,
  minZoom: 14
}).setView([4.6464, -74.1443], 15);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Capa WMS de ruido (sin 'tiled', usando render básico)
const ruidoLayer = L.tileLayer.wms(
  'https://mapas.ambientebogota.gov.co/server/services/Calidad_auditiva/Mapas_Estrategicos_de_Ruido_de_Bogota_DC__2018_2021/MapServer/WMSServer',
  {
    layers: '0',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: L.CRS.EPSG3857,
    attribution: 'IDEAM - SDA Bogotá'
  }
).addTo(map);
// Parámetros para petición WFS GetFeature en GeoJSON con filtro BBOX para El Vergel Oriental
const params = {
  service: 'WFS',
  version: '2.0.0',
  request: 'GetFeature',
  typeNames: 'sda_ca:Hist_ca_aire_estaciones', // mantener según la capa que uses
  outputFormat: 'application/json',
  srsName: 'EPSG:4326',
  CQL_FILTER: 'BBOX(geom,-74.15,4.64,-74.13,4.66,EPSG:4326)'
};
const proxy = 'https://corsproxy.io/?';
const fullUrl = proxy + encodeURIComponent(`${wfsUrl}?${queryString}`);
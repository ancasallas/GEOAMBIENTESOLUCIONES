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
const fullUrl = `${wfsUrl}?${queryString}`;
const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`;

fetch(proxiedUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    L.geoJSON(data, {
      style: feature => ({
        color: '#FF5733',
        weight: 2,
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const popupContent =
          `<b>Estación:</b> ${props.estacion || 'N/A'}<br>` +
          `<b>Contaminante:</b> ${props.contaminante || 'N/A'}<br>` +
          `<b>Valor:</b> ${props.valor || 'N/A'}`;
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error('Error cargando capa WFS:', error);
    alert('No se pudo cargar la capa de calidad del aire');
  });

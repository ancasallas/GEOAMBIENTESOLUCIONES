// programa.js

// Inicializar el mapa centrado en Colombia
const map = L.map('map').setView([4.628207228952713, -74.06605914084012], 18);

// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Cargar archivo GPX y dibujarlo en el mapa
new L.GPX("Trayectoria.gpx", {
  async: true,
  marker_options: {
    startIconUrl: 'https://unpkg.com/leaflet-gpx@1.5.0/pin-icon-start.png',
    endIconUrl: 'https://unpkg.com/leaflet-gpx@1.5.0/pin-icon-end.png',
    shadowUrl: 'https://unpkg.com/leaflet-gpx@1.5.0/pin-shadow.png'
  },
  polyline_options: {
    color: 'red',
    weight: 5,
    opacity: 0.75
  }
}).on('loaded', function(e) {
  map.fitBounds(e.target.getBounds());
}).addTo(map);
const fotos = [
  { archivo: 'imagen_1.jpeg', lat: 4.628135, lon: -74.065502 },
  { archivo: 'imagen_2.jpeg', lat: 4.632445, lon: -74.064183 },
  { archivo: 'imagen_3.jpeg', lat: 4.633086, lon: -74.063474 },
  { archivo: 'imagen_4.jpeg', lat: 4.633137, lon: -74.063098 },
  { archivo: 'imagen_5.jpeg', lat: 4.631902, lon: -74.062853 },
  { archivo: 'imagen_6.jpeg', lat: 4.630955, lon: -74.062023 },
  { archivo: 'imagen_7.jpeg', lat: 4.629727, lon: -74.060999 },
  { archivo: 'imagen_8.jpeg', lat: 4.630507, lon: -74.061360 },
];
fotos.forEach(foto => {
  L.marker([foto.lat, foto.lon])
    .addTo(map)
    .bindPopup(`<img src="imagenes/${foto.archivo}" width="200"><br><b>${foto.archivo}</b>`);
});
// Coordenadas Barrio El Vergel Oriental
const centro = [4.647147618123139, -74.14456010441765];

// Crear el mapa
const map = L.map('map').setView(centro, 12);

// Capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Estilo de los polígonos (relleno gris con transparencia y borde gris más oscuro)
var estiloPoligono = {
    fillColor: "#D4D1C7",
    fillOpacity: 0.8,
    color: "#505050",
    weight: 1,
    opacity: 1
};

// Cargar el archivo GeoJSON de polígonos
$.getJSON('BARRIO.geojson', function(data) {
    var geojsonLayer = L.geoJSON(data, {
        style: estiloPoligono
    }).addTo(map);

    // Hacer un zoom en el polígono cargado
    var bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds);
});

// Cargar el archivo GeoJSON de puntos (marcadores) y añadir los popups
$.getJSON('RUTAS.geojson', function(data) {
    L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.direcc_par) {
                layer.bindPopup("Dirección: " + feature.properties.direcc_par);
            }
            if (feature.properties && feature.properties.name) {
                layer.bindPopup("<strong>" + feature.properties.name + "</strong>");
            }
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng); // Crear un marcador para cada punto
        }
    }).addTo(map);
});

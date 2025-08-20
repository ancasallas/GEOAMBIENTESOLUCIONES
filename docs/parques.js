// ===== parques.js =====

// Centro y coordenadas
const centro = [4.625381870446709, -74.11439689643427];
const HumedalTecho = [4.648192186796589, -74.1431178308849];

// Crear mapa
const map = L.map('map').setView(centro, 13);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ---- Marcador y panel ----
const marcadorTecho = L.marker(HumedalTecho).addTo(map);

// Descripción HTML a mostrar en el panel
const descripcionHumedal = `
  <h2>Humedal de Techo</h2>
  <p>
    Ecosistema estratégico ubicado en la localidad de <strong>Kennedy</strong>, Bogotá.
    Contribuye a la regulación hídrica y sirve como hábitat de aves migratorias y residentes.
  </p>
  <ul>
    <li><strong>Altitud:</strong> ~2.600 m s. n. m.</li>
    <li><strong>Funciones:</strong> Retención de aguas, biodiversidad, amortiguación de inundaciones.</li>
    <li><strong>Presiones:</strong> Urbanización, vertimientos difusos, residuos.</li>
  </ul>
  <p><em>Fuente:</em> Documentos ambientales locales.</p>
`;

// Click -> actualizar panel de la derecha
marcadorTecho.on('click', () => {
  const panel = document.getElementById('panel-humedal');
  if (panel) panel.innerHTML = descripcionHumedal;
  map.panTo(HumedalTecho);
});

// ---- Estilos GeoJSON ----
const estiloPoligonoHumedal = {
  fillColor: "#1B5E20",
  color: "#0D3310",
  weight: 1,
  opacity: 1
};

const estiloPoligonoBarrio = {
  fillColor: "#09435C",
  color: "#031821",
  weight: 1,
  opacity: 1
};

// ---- Cargar GeoJSON (usa jQuery que ya incluyes en el HTML) ----
$.getJSON('humedal.geojson', function(data) {
  L.geoJSON(data, { style: estiloPoligonoHumedal }).addTo(map);
});

$.getJSON('BARRIO.geojson', function(data) {
  L.geoJSON(data, { style: estiloPoligonoBarrio }).addTo(map);
});


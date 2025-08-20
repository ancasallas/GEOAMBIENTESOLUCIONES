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
    El humedal Techo hace parte de la cuenca del Tintal. Junto con sus humedales vecinos: la Vaca y el Burro hacían parte del gran humedal y zona de inundación de la laguna del Tintal.
  </p>
  <ul>
    <li><strong>Altitud:</strong> ~2.600 m s. n. m.</li>
    <li><strong>Funciones:</strong> Retención de aguas, refugio de biodiversidad, amortiguación de inundaciones.</li>
    <li><strong>Presiones:</strong> Urbanización, vertimientos difusos, residuos sólidos.</li>
  </ul>
  <p>El humedal de Techo se encuentra ubicado en los antiguos predios de la Hacienda Techo. Cuya parcelación se inicio en los años 30. En los años 90 el humedal de Techo conservaba en gran parte el cuerpo de agua, flora y fauna y la población de la UPZ46. A partir de este tiempo se hacían fogatas y practicaban la caza de curies que los asaban y comían.</p>
  <p>La historia del humedal de Techo es todo un ejemplo del terrible proceso de urbanización ilegal que sufrió nuestra ciudad en los años 80s y 90s que destruyó y redujo el tamaño de la mayoría de los humedales capitalinos.</p>
  <p><em>Fuente:</em> Humedales de Bogotá.</p>
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


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

// Popup con imagen (sin título)
marcadorTecho.bindPopup(`
  <img src="Humedal_3.jpg" alt="Humedal de Techo" style="width:280px; border-radius:8px;">
`);

// Descripción HTML a mostrar en el panel
const descripcionHumedal = `
  <h2 style="text-align:center;">Humedal de Techo</h2>
  <p>
    Las únicas zonas verdes con las que cuenta el barrio son los relictos del humedal de Techo.
  </p>
  <p>
    El humedal hace parte de la cuenca del Tintal. Junto con sus humedales vecinos: la Vaca y el Burro hacían parte del gran humedal y zona de inundación de la laguna del Tintal.
  </p>
  <ul>
    <li><strong>Altitud:</strong> ~2.600 m s. n. m.</li>
    <li><strong>Funciones:</strong> Retención de aguas, refugio de biodiversidad (en especial aves e insectos), amortiguación de inundaciones.</li>
    <li><strong>Presiones:</strong> Urbanización, vertimientos y residuos sólidos.</li>
  </ul>
  <p>El humedal de Techo se encuentra ubicado en los antiguos predios de la Hacienda Techo. Cuya parcelación se inicio en los años 30. En los años 90 el humedal de Techo conservaba gran parte el cuerpo de agua, la flora y la fauna. Se tienen registros de que en esos tiempos se hacían fogatas y se practicaba la caza de curies.</p>
  <p>La historia del humedal de Techo es todo un ejemplo del terrible proceso de urbanización ilegal que sufrió nuestra ciudad a finales del siglo pasado y redujo el tamaño de la mayoría de los humedales del occidente de la ciudad.</p>
  <p><em>Fuente:</em> Humedales de Bogotá.</p>
`;

let poligono_Humedal = null;

// Evento click en marcador
marcadorTecho.on('click', () => {
  const panel = document.getElementById('panel-humedal');
  if (panel) panel.innerHTML = descripcionHumedal;

  if (poligono_Humedal) {
    map.flyToBounds(poligono_Humedal.getBounds(), {
      padding: [50, 50],
      maxZoom: 18,
      duration: 1.2
    });
  } else {
    map.flyTo(HumedalTecho, 17, { animate: true, duration: 1.2 });
  }
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
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

  function filenameFromCenefa(cenefa) {
    if (!cenefa) return null;
    let name = String(cenefa).trim();
    if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(name)) name += '.png'; // por defecto .png
    return name;
  }

  L.geoJSON(data, {
    pointToLayer: (feature, latlng) => L.marker(latlng),

    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      const file = filenameFromCenefa(p.cenefa);

      // Contenedor del popup (HTMLElement → permite manejar onerror con JS)
      const cont = document.createElement('div');
      cont.style.maxWidth = '280px';

      const titulo = document.createElement('div');
      titulo.style.fontWeight = '600';
      titulo.textContent = p.name || p.cenefa || 'Punto';
      cont.appendChild(titulo);

      if (p.direcc_par) {
        const dir = document.createElement('div');
        dir.style.margin = '4px 0';
        dir.textContent = `Dirección: ${p.direcc_par}`;
        cont.appendChild(dir);
      }

      if (file) {
        const img = document.createElement('img');
        img.alt = p.cenefa || '';
        img.style.cssText = 'width:100%;height:auto;border-radius:6px;margin-top:6px;display:block';

        // 1er intento: docs/<archivo>
        const src1 = `docs/${file}`;
        // 2do intento: <archivo> (misma carpeta del HTML)
        const src2 = `${file}`;

        img.src = src1;
        img.onerror = function () {
          if (img.src.endsWith(src1)) {
            // probar ruta alternativa
            img.src = src2;
          } else {
            const note = document.createElement('div');
            note.style.color = '#888';
            note.textContent = `Imagen no encontrada: ${file}`;
            img.replaceWith(note);
          }
        };

        // (opcional) enlace para abrir la imagen en pestaña nueva
        const a = document.createElement('a');
        a.href = src1;            // el href inicial será src1
        a.target = '_blank';
        a.rel = 'noopener';
        // si cambió a src2, actualizamos el href también
        img.addEventListener('load', () => { a.href = img.src; });
        img.addEventListener('error', () => { a.href = img.src; });

        a.appendChild(img);
        cont.appendChild(a);
      } else {
        const note = document.createElement('div');
        note.style.color = '#888';
        note.textContent = 'Sin imagen asociada';
        cont.appendChild(note);
      }

      layer.bindPopup(cont, { maxWidth: 320 });
    }
  }).addTo(map);
});



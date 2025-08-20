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

// Cargar el polígono del barrio
$.getJSON('BARRIO.geojson', function(data) {
  var geojsonLayer = L.geoJSON(data, { style: estiloPoligono }).addTo(map);
  var bounds = geojsonLayer.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds);
});

// ---- RUTAS: puntos + ruta punteada ----
$.getJSON('RUTAS.geojson', function(data) {

  // 1) (Opcional) Marcadores con popups como ya tenías
  function filenameFromCenefa(cenefa) {
    if (!cenefa) return null;
    let name = String(cenefa).trim();
    if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(name)) name += '.png';
    return name;
  }

  const puntos = [];  // aquí guardaremos los LatLng para la línea

  L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      // Guardar el punto para la línea
      puntos.push(latlng);
      return L.marker(latlng);
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      const file = filenameFromCenefa(p.cenefa);

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

        const src1 = `docs/${file}`;
        const src2 = `${file}`;

        img.src = src1;
        img.onerror = function () {
          if (img.src.endsWith(src1)) {
            img.src = src2;
          } else {
            const note = document.createElement('div');
            note.style.color = '#888';
            note.textContent = `Imagen no encontrada: ${file}`;
            img.replaceWith(note);
          }
        };

        const a = document.createElement('a');
        a.href = src1;
        a.target = '_blank';
        a.rel = 'noopener';
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

  // 2) Si el GeoJSON trae un campo de orden, ordenar antes de dibujar la línea
  //    Detectamos el nombre automáticamente: 'orden', 'seq' o 'sequence'
  const ordenKey = (() => {
    const f = (data.features || [])[0];
    if (!f || !f.properties) return null;
    const keys = Object.keys(f.properties).map(k => k.toLowerCase());
    if (keys.includes('orden')) return 'orden';
    if (keys.includes('seq')) return 'seq';
    if (keys.includes('sequence')) return 'sequence';
    return null;
  })();

  let puntosOrdenados = puntos.slice();

  if (ordenKey) {
    // Reconstruimos tomando lat/lng según el orden declarado en properties
    // (Por simplicidad, volvemos a leer de features para respetar el orden real)
    const ordenadas = (data.features || [])
      .filter(f => f.geometry && f.geometry.type === 'Point')
      .map(f => ({
        latlng: L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0]),
        orden: Number(f.properties[ordenKey])
      }))
      .filter(o => !Number.isNaN(o.orden))
      .sort((a, b) => a.orden - b.orden)
      .map(o => o.latlng);

    if (ordenadas.length > 1) {
      puntosOrdenados = ordenadas;
    }
  }

  // 3) Dibujar la polilínea punteada que conecta los puntos
  if (puntosOrdenados.length > 1) {
    const ruta = L.polyline(puntosOrdenados, {
      color: '#0077ff',
      weight: 3,
      opacity: 1,
      dashArray: '6 6',     // ----- línea punteada -----
      lineJoin: 'round'
    }).addTo(map);

    // Ajustar zoom a la ruta
    const rb = ruta.getBounds();
    if (rb.isValid()) map.fitBounds(rb, { padding: [20, 20] });
  }
});






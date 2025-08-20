// ====== Datos de historia ======
const HITOS = [
  {
    year: 2018,
    title: "Fundación de GeoAmbientes",
    text: "Nacemos con el propósito de acercar la geoinformación a la gestión pública local.",
    lat: 4.7110, lng: -74.0721  // Bogotá
  },
  {
    year: 2020,
    title: "Primer Catastro 3D municipal",
    text: "Implementamos un flujo 3D con fotogrametría y Cesium para uso catastral y urbanístico.",
    lat: 4.4389, lng: -75.2322  // Ibagué
  },
  {
    year: 2022,
    title: "Laboratorio de movilidad",
    text: "Integramos datos de tránsito, encuestas O/D y redes viales para apoyar planes de movilidad.",
    lat: 6.2518, lng: -75.5636  // Medellín
  },
  {
    year: 2024,
    title: "Plataforma de gemelo digital",
    text: "Lanzamos nuestra plataforma para visualizar escenarios territoriales en 3D y tiempo real.",
    lat: 3.4516, lng: -76.5320  // Cali
  }
];

// ====== UI Timeline + Mapa Leaflet ======
const yearsBar = document.getElementById('yearsBar');
const hTitle = document.getElementById('hitoTitulo');
const hText  = document.getElementById('hitoTexto');

// Crear botones de años
HITOS.sort((a,b)=>a.year-b.year);
let activeYear = HITOS[0]?.year;

function renderYears(){
  yearsBar.innerHTML = '';
  HITOS.forEach(h => {
    const b = document.createElement('button');
    b.textContent = h.year;
    b.className = (h.year === activeYear) ? 'active' : '';
    b.addEventListener('click', ()=>selectYear(h.year, true));
    yearsBar.appendChild(b);
  });
}

// Mapa
const map = L.map('historyMap', { zoomControl: true });

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Crear diccionario de marcadores
const markersByYear = {};
HITOS.forEach(h => {
  const m = L.marker([h.lat, h.lng]).bindPopup(
    `<b>${h.title}</b><br>${h.text}`
  );
  markersByYear[h.year] = m;
});

function selectYear(year, openPopup=false){
  activeYear = year;
  renderYears();

  const h = HITOS.find(x => x.year === year);
  if(!h) return;

  hTitle.textContent = `${h.year} — ${h.title}`;
  hText.textContent  = h.text;

  // Limpiar marcadores y agregar el activo
  Object.values(markersByYear).forEach(m => { try{ map.removeLayer(m); }catch{} });
  const mk = markersByYear[year];
  if(mk){ mk.addTo(map); if(openPopup) mk.openPopup(); }

  // Encadre
  map.flyTo([h.lat, h.lng], 12, { duration: 0.8 });
}

// Inicialización
renderYears();
const avgLat = HITOS.reduce((s,h)=>s+h.lat,0)/HITOS.length;
const avgLng = HITOS.reduce((s,h)=>s+h.lng,0)/HITOS.length;
map.setView([avgLat, avgLng], 6);

if(HITOS.length) selectYear(HITOS[0].year, false);

// Archivo: tour_persona.js
// <script type="module" src="./tour_persona.js"></script>

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDUzYzdkYS0wM2I5LTQ2NTYtYjQ0YS00YmNlYzA1ZWU5MjAiLCJpZCI6MzMxMzY4LCJpYXQiOjE3NTUwNDI1ODh9.MKN8zgCvadRLANRddQ8AO7T3eZzxrWMwk39zAIosiGQ';

// === Cámara en primera persona (true) o tercera (false)
const FIRST_PERSON = true;

// ===== Parámetros de recorrido
const HEAD_OFFSET_METERS = 1.6; // altura de la cámara sobre el modelo
const FOOT_OFFSET = 0.2;        // “pies” un poco sobre el terreno
const DENSIFY_EVERY_M = 5.0;    // suavizado de la ruta
const MAX_DURATION_S  = 120;    // duración máxima
const MIN_DURATION_S  = 20;     // duración mínima

// ---------------- Utilidades ----------------
const getVal = (p) => (p && typeof p.getValue === "function" ? p.getValue() : p);

function densifyCartesian(positions, everyMeters = 8.0) {
  if (!positions || positions.length < 2) return positions || [];
  const out = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i];
    const b = positions[i + 1];
    out.push(a);
    const dist = Cesium.Cartesian3.distance(a, b);
    const steps = Math.max(0, Math.floor(dist / everyMeters));
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      out.push(Cesium.Cartesian3.lerp(a, b, t, new Cesium.Cartesian3()));
    }
  }
  out.push(positions[positions.length - 1]);
  return out;
}

function positionsToTimedProperty(cartesianPositions, start, totalSeconds) {
  const spp = new Cesium.SampledPositionProperty();
  const n = cartesianPositions.length;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * totalSeconds;
    const time = Cesium.JulianDate.addSeconds(start, t, new Cesium.JulianDate());
    spp.addSample(time, cartesianPositions[i]);
  }
  spp.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.LinearApproximation,
  });
  return spp;
}

function bannerError(msg) {
  console.error(msg);
  let el = document.getElementById("fatal-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "fatal-error";
    el.style.cssText = "position:absolute;z-index:99999;top:12px;right:12px;background:#b00020;color:#fff;padding:10px 12px;border-radius:8px;font-family:system-ui";
    document.body.appendChild(el);
  }
  el.textContent = `Error: ${msg}`;
}

function lengthMeters(positions){
  let L=0;
  for(let i=0;i<positions.length-1;i++){
    L += Cesium.Cartesian3.distance(positions[i], positions[i+1]);
  }
  return L;
}

// --------------- Main ---------------
(async () => {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    baseLayer: await Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
        Cesium.ArcGisBaseMapType.SATELLITE
      )
    ),
    timeline: true,
    animation: true,
    shadows: true,
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // 1) Barrio
  const barrio = await Cesium.GeoJsonDataSource.load("BARRIO.geojson", { clampToGround: true });
  viewer.dataSources.add(barrio);
  for (const e of barrio.entities.values) {
    if (!e.polygon) continue;
    e.polygon.material = Cesium.Color.fromCssColorString("#1e88e5").withAlpha(0.35);
    e.polygon.outline = true;
    e.polygon.outlineColor = Cesium.Color.fromCssColorString("#0d47a1");
  }
  await viewer.flyTo(barrio);

  // 2) Construcciones (CONNPISOS × 3 m; fallback 6 m)
  const predios = await Cesium.GeoJsonDataSource.load("Construcciones.geojson");
  viewer.dataSources.add(predios);
  for (const e of predios.entities.values) {
    const pol = e.polygon;
    if (!pol) continue;
    const props = e.properties || {};
    let pisosRaw = getVal(props.CONNPISOS) ?? getVal(props.ConnPisos) ?? getVal(props.connpisos);
    let pisos = Number(pisosRaw);
    if (!Number.isFinite(pisos) || pisos < 0) pisos = NaN;
    const altura = Number.isFinite(pisos) ? pisos * 3 : 6;
    pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.95);
    pol.outline = true;
    pol.outlineColor = Cesium.Color.BLACK;
    pol.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    pol.extrudedHeight = altura;
    pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
  }

  // 3) RUTA POR VÍAS: Vias_Vergel.geojson (LineString/MultiLineString)
  const vias = await Cesium.GeoJsonDataSource.load("Ruta.geojson", { clampToGround: true });
  viewer.dataSources.add(vias);

  // Extraer todas las polilíneas y concatenarlas
  const now = Cesium.JulianDate.now();
  const raw = [];
  for (const ent of vias.entities.values) {
    const pl = ent.polyline;
    if (!pl) continue;
    const posProp = pl.positions;
    const pts = posProp && typeof posProp.getValue === "function" ? posProp.getValue(now) : posProp;
    if (pts && pts.length) raw.push(...pts);
  }
  if (raw.length < 2) {
    bannerError("Vias_Vergel.geojson no tiene líneas válidas para el recorrido.");
    return;
  }

  // Suavizar y dibujar la ruta (útil para verificar)
  const dense = densifyCartesian(raw, DENSIFY_EVERY_M);
  viewer.entities.add({
    polyline: {
      positions: dense,
      width: 3,
      material: Cesium.Color.CYAN.withAlpha(0.9),
      clampToGround: true
    }
  });

  // Muestrear terreno y aplicar offset de pies
  let carto = dense.map(c => Cesium.Ellipsoid.WGS84.cartesianToCartographic(c));
  try {
    carto = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, carto);
  } catch (e) {
    console.warn("No se pudo muestrear terreno; se usará altura 0 m.", e);
  }
  const walkPositions = carto.map(ct =>
    Cesium.Cartesian3.fromRadians(ct.longitude, ct.latitude, (ct.height || 0) + FOOT_OFFSET)
  );

  // 4) Tiempos (capados a un rango razonable)
  const meters = lengthMeters(walkPositions);
  const ideal = meters / 1.4; // caminata ~1.4 m/s
  const totalSeconds = Math.max(MIN_DURATION_S, Math.min(MAX_DURATION_S, ideal));

  const start = Cesium.JulianDate.now();
  const stop  = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime  = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = true; // autoplay

  // 5) Posición temporal
  const position = positionsToTimedProperty(walkPositions, start, totalSeconds);

  // 6) Modelo (personita)
  const personModelUrl =
    "https://cesium.com/downloads/cesiumjs/releases/1.132/Apps/SampleData/models/CesiumMan/Cesium_Man.glb";

  const walker = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start, stop }) ]),
    position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: new Cesium.ModelGraphics({
      uri: personModelUrl,
      scale: 1.0,
      minimumPixelSize: 48,
      runAnimations: true,
      heightReference: Cesium.HeightReference.NONE
    }),
    path: new Cesium.PathGraphics({ show: true, leadTime: 0, trailTime: 15, width: 3 })
  });

  // 7) Cámara
  if (FIRST_PERSON) {
    // Primera persona: a la altura de la cabeza
    const rot = new Cesium.Matrix3();
    const dir = new Cesium.Cartesian3();
    const up  = new Cesium.Cartesian3();
    const camPos = new Cesium.Cartesian3();

    viewer.scene.preRender.addEventListener(function () {
      const t = viewer.clock.currentTime;
      const pos = walker.position.getValue(t);
      const q   = walker.orientation.getValue(t);
      if (!pos || !q) return;

      Cesium.Matrix3.fromQuaternion(q, rot);
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_Z, up);
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_X, dir);

      Cesium.Cartesian3.multiplyByScalar(up, HEAD_OFFSET_METERS, camPos);
      Cesium.Cartesian3.add(pos, camPos, camPos);

      viewer.camera.setView({ destination: camPos, orientation: { direction: dir, up } });
    });
  } else {
    // Tercera persona (chase cam)
    const rot = new Cesium.Matrix3();
    const fwd = new Cesium.Cartesian3();
    const up  = new Cesium.Cartesian3();
    const camPos = new Cesium.Cartesian3();
    const tmp = new Cesium.Cartesian3();
    const BACK = 10.0, RISE = 3.0;

    viewer.scene.preRender.addEventListener(function () {
      const t = viewer.clock.currentTime;
      const pos = walker.position.getValue(t);
      const q   = walker.orientation.getValue(t);
      if (!pos || !q) return;

      Cesium.Matrix3.fromQuaternion(q, rot);
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_X, fwd);
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_Z, up);

      Cesium.Cartesian3.multiplyByScalar(fwd, -BACK, camPos);
      Cesium.Cartesian3.add(pos, camPos, camPos);
      Cesium.Cartesian3.multiplyByScalar(up, RISE, tmp);
      Cesium.Cartesian3.add(camPos, tmp, camPos);

      const dir = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.subtract(pos, camPos, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );
      viewer.camera.setView({ destination: camPos, orientation: { direction: dir, up } });
    });
  }

  // 8) Controles (si existen en el HTML)
  const btnPlay  = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnReset = document.getElementById("btnReset");
  const speed    = document.getElementById("speed");
  const speedVal = document.getElementById("speedVal");

  btnPlay?.addEventListener("click", () => { viewer.clock.shouldAnimate = true; });
  btnPause?.addEventListener("click", () => { viewer.clock.shouldAnimate = false; });
  btnReset?.addEventListener("click", () => {
    viewer.clock.shouldAnimate = false;
    viewer.clock.currentTime = start.clone();
  });
  speed?.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    viewer.clock.multiplier = v;
    if (speedVal) speedVal.textContent = `${v.toFixed(1)}×`;
  });

  await viewer.flyTo(barrio);
})().catch(e => bannerError(e.message || String(e)));













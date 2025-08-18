// Archivo: tour_persona.js
// <script type="module" src="./tour_persona.js"></script>

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDUzYzdkYS0wM2I5LTQ2NTYtYjQ0YS00YmNlYzA1ZWU5MjAiLCJpZCI6MzMxMzY4LCJpYXQiOjE3NTUwNDI1ODh9.MKN8zgCvadRLANRddQ8AO7T3eZzxrWMwk39zAIosiGQ';

// === Cámara en primera persona (true) o tercera (false)
const FIRST_PERSON = true;

// ---------------- Utilidades ----------------
const getVal = (p) => (p && typeof p.getValue === "function" ? p.getValue() : p);

function densifyCartesian(positions, everyMeters = 8.0) {
  if (!positions || positions.length < 2) return positions || [];
  const out = [];
  for (let i = 0; i < positions.length; i++) {
    const a = positions[i];
    const b = positions[(i + 1) % positions.length];
    out.push(a);
    const dist = Cesium.Cartesian3.distance(a, b);
    const steps = Math.max(0, Math.floor(dist / everyMeters));
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      out.push(Cesium.Cartesian3.lerp(a, b, t, new Cesium.Cartesian3()));
    }
  }
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

// --------------- Main ---------------
(async () => {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
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

  const poly = barrio.entities.values.find((ent) => ent.polygon)?.polygon;
  if (!poly) {
    console.error("BARRIO.geojson no tiene polígono.");
    return;
  }

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

  // 3) Ruta perimetral + terreno
  const hierarchy = poly.hierarchy.getValue();
  const cartesianPerimeter = densifyCartesian(hierarchy.positions, 8.0);

  let cartoPerimeter = cartesianPerimeter.map((c) =>
    Cesium.Ellipsoid.WGS84.cartesianToCartographic(c)
  );

  try {
    cartoPerimeter = await Cesium.sampleTerrainMostDetailed(
      viewer.terrainProvider,
      cartoPerimeter
    );
  } catch (err) {
    console.warn("No se pudo muestrear terreno; se usa altura 0 m.");
  }

  // Caminante casi a ras de suelo para que el modelo no flote
  const FOOT_OFFSET = 0.2; // metros sobre el terreno
  const walkPositions = cartoPerimeter.map((ct) =>
    Cesium.Cartesian3.fromRadians(ct.longitude, ct.latitude, (ct.height || 0) + FOOT_OFFSET)
  );

  // 4) Tiempos
  const totalSeconds = 60;
  const start = Cesium.JulianDate.now();
  const stop  = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime  = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = false;

  // 5) Posición temporal
  const position = positionsToTimedProperty(walkPositions, start, totalSeconds);

  // 6) Modelo (personita)
  const personModelUrl =
    "https://cesium.com/downloads/cesiumjs/releases/1.132/Apps/SampleData/models/CesiumMan/Cesium_Man.glb";

  const walker = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start, stop })
    ]),
    position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: new Cesium.ModelGraphics({
      uri: personModelUrl,
      scale: 1.0,
      minimumPixelSize: 48,
      runAnimations: true,
      heightReference: Cesium.HeightReference.NONE
    }),
    path: new Cesium.PathGraphics({
      show: true,
      leadTime: 0,
      trailTime: 15,
      width: 3
    })
  });

  // 7) Cámara
  if (FIRST_PERSON) {
    // Primera persona: cámara a la altura de la cabeza
    const rot = new Cesium.Matrix3();
    const dir = new Cesium.Cartesian3();
    const up  = new Cesium.Cartesian3();
    const camPos = new Cesium.Cartesian3();

    const HEAD_OFFSET_METERS = 1.6; // altura de la cabeza sobre el origen del modelo

    viewer.scene.preRender.addEventListener(function () {
      const t = viewer.clock.currentTime;
      const pos = walker.position.getValue(t);
      const q   = walker.orientation.getValue(t);
      if (!pos || !q) return;

      Cesium.Matrix3.fromQuaternion(q, rot);
      // Ejes locales del modelo: X=forward, Z=up
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_Z, up);
      Cesium.Matrix3.multiplyByVector(rot, Cesium.Cartesian3.UNIT_X, dir);

      // Posición de cámara = pos + up * HEAD_OFFSET
      Cesium.Cartesian3.multiplyByScalar(up, HEAD_OFFSET_METERS, camPos);
      Cesium.Cartesian3.add(pos, camPos, camPos);

      viewer.camera.setView({
        destination: camPos,
        orientation: { direction: dir, up: up }
      });
    });
  } else {
    // Tercera persona (chase cam)
    const rot = new Cesium.Matrix3();
    const fwd = new Cesium.Cartesian3();
    const up  = new Cesium.Cartesian3();
    const camPos = new Cesium.Cartesian3();
    const tmp = new Cesium.Cartesian3();

    const BACK = 10.0, UP = 3.0;

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
      Cesium.Cartesian3.multiplyByScalar(up, UP, tmp);
      Cesium.Cartesian3.add(camPos, tmp, camPos);

      const dir = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.subtract(pos, camPos, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );

      viewer.camera.setView({ destination: camPos, orientation: { direction: dir, up: up } });
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
})();








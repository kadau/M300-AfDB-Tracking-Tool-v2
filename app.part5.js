let mapOKI = null;

let okiMap = null;
let okiLayerGroup = null;
let okiLegend = null;
let okiBubbleLegend = null;
let okiIndicatorControl = null;


let okiLayer = null;
let okiFilterControl = null;


let okiGeoJSON = null;

function loadOKIGeoJSON(callback) {
  if (okiGeoJSON) {
    callback();
    return;
  }

  fetch("africa.geojson")
    .then(r => r.json())
    .then(g => {
      okiGeoJSON = g;
      console.log("Africa GeoJSON loaded for OKI");
      callback();
    });
}

/* =========================================================
   MISSION 300 – MAP (GLOBAL STATE)
========================================================= */


/* =========================================================
   NORMALISATION DES NOMS DE PAYS
========================================================= */

function normalizeCountryName(name) {
  if (!name) return "";
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

/* =========================================================
   INIT MISSION 300 MAP (FIGÉE)
========================================================= */
let mapMission300 = null;
let mission300Layer = null;

function initMission300Map() {

  if (mapMission300) return;

  const container = document.getElementById("mission300Map");
  if (!container) return;

  mapMission300 = L.map(container, {
    center: [2, 20],
    zoom: 3,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" }
  ).addTo(mapMission300);
}
/* =========================================================
   DATA AGGREGATION – KPI2 BY COUNTRY
========================================================= */

function getMission300DataByCountry(rows) {

  const result = {};

  rows.forEach(r => {
    if (
      r["Expected/Delivered"] === "Delivered" &&
      r["Global/Milestone"] === "Global"
    ) {
      const countryRaw = r["Country"];
      const country = normalizeCountryName(countryRaw);
      const value = safeNum(
        r[" People provided with access to electricity "]
      );

      if (!country || value <= 0) return;

      if (!result[country]) {
        result[country] = 0;
      }
      result[country] += value;
    }
  });

  return result;
}
/* =========================================================
   RENDER MISSION 300 MAP – FINAL
========================================================= */
function renderMission300Map() {

  if (!mapMission300 || !africaGeoJSON) return;

  if (mission300Layer) {
    mission300Layer.remove();
  }
  mission300Layer = L.layerGroup().addTo(mapMission300);

  const valuesByCountry = getMission300DataByCountry(rawRows);
  const values = Object.values(valuesByCountry);
  const maxValue = values.length ? Math.max(...values) : 0;

  /* ---------- Couleurs ---------- */
  function getColor(v) {
    if (!v || maxValue === 0) return "#eeeeee";
    const r = v / maxValue;
    return r > 0.75 ? "#0b7d3e" :
           r > 0.50 ? "#3fa66b" :
           r > 0.25 ? "#8fd3a8" :
                      "#cfeee0";
  }

  /* ---------- Taille bulles (VRAIMENT proportionnelle) ---------- */
  const minRadius = 4;
  const maxRadius = 26;

  function getBubbleRadius(value) {
    if (!value || maxValue === 0) return minRadius;
    return minRadius + Math.sqrt(value / maxValue) * (maxRadius - minRadius);
  }

  /* ---------- Pays colorés ---------- */
  L.geoJSON(africaGeoJSON, {
    style: feature => {
      const name = normalizeCountryName(feature.properties.ADMIN);
      const val = valuesByCountry[name] || 0;
      return {
        fillColor: getColor(val),
        fillOpacity: 0.85,
        weight: 1,
        color: "#555"
      };
    },
    onEachFeature: (feature, layer) => {
      const name = normalizeCountryName(feature.properties.ADMIN);
      const val = valuesByCountry[name] || 0;

      layer.bindTooltip(
        `<strong>${feature.properties.ADMIN}</strong><br>
         ${val.toLocaleString("en-US")} people connected`,
        { sticky: true }
      );
    }
  }).addTo(mission300Layer);

  /* ---------- Bulles ---------- */
  Object.entries(valuesByCountry).forEach(([country, value]) => {
    if (!value) return;

    const feature = africaGeoJSON.features.find(
      f => normalizeCountryName(f.properties.ADMIN) === country
    );
    if (!feature) return;

    const center = L.geoJSON(feature).getBounds().getCenter();

    L.circleMarker(center, {
      radius: getBubbleRadius(value),
      fillColor: "#0b7d3e",
      color: "#0b7d3e",
      fillOpacity: 0.6
    })
    .bindTooltip(
      `<strong>${feature.properties.ADMIN}</strong><br>
       ${value.toLocaleString("en-US")} people connected`,
      { sticky: true }
    )
    .addTo(mission300Layer);
  });

  /* ---------- TITRE ---------- */
  const titleControl = L.control({ position: "topright" });
  titleControl.onAdd = function () {
    const div = L.DomUtil.create("div", "map-title");
    div.innerHTML = "Geographic distribution – People connected";
    return div;
  };
  titleControl.addTo(mapMission300);

  /* ---------- LÉGENDE COULEURS ---------- */
  const colorLegend = L.control({ position: "bottomright" });
  colorLegend.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend");
    div.innerHTML = "<strong>People connected</strong><br>";
    [0.25, 0.5, 0.75].forEach(r => {
      div.innerHTML +=
        `<i style="background:${getColor(r * maxValue)}"></i>
         ${Math.round(r * 100)}%<br>`;
    });
    return div;
  };
  colorLegend.addTo(mapMission300);

  /* ---------- LÉGENDE BULLES ---------- */
  const bubbleLegend = L.control({ position: "bottomleft" });
  bubbleLegend.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend");
    div.innerHTML = "<strong>Bubble size</strong><br>";
    [0.25, 0.5, 1].forEach(r => {
      const v = maxValue * r;
      const rad = getBubbleRadius(v);
      div.innerHTML += `
        <div style="display:flex;align-items:center;margin-top:4px">
          <svg width="${rad*2}" height="${rad*2}">
            <circle cx="${rad}" cy="${rad}" r="${rad}"
              fill="#0b7d3e" opacity="0.6"></circle>
          </svg>
          <span style="margin-left:6px">
            ${Math.round(v).toLocaleString("en-US")}
          </span>
        </div>
      `;
    });
    return div;
  };
  bubbleLegend.addTo(mapMission300);
}

/* =========================================================
   app.part5.js
   Others Key Indicators
========================================================= */

const OKI_INDICATORS = [
  "Power capacity installed (MW)",
  "Cross-border and National Transmission Lines (KM)",
  "New or improved power distribution lines (KM)"
];

/* =========================================================
   OKI – RENDER GAUGES (EXPECTED vs DELIVERED)
   No extra filtering (as requested)
========================================================= */
function renderOKIKPIs() {

  const container = document.getElementById("kpisOKI");
  if (!container || !rawRows || !rawRows.length) return;

  // Accès robuste aux colonnes (gestion des espaces Excel)
  const col = (r, name) =>
    r[name] ?? r[` ${name} `] ?? 0;

  const fmt = n =>
    Math.round(Number(n || 0)).toLocaleString("en-US");

  let html = "";

  OKI_INDICATORS.forEach(indicator => {

    let expected = 0;
    let delivered = 0;

    rawRows.forEach(r => {
      const status = col(r, "Expected/Delivered");
      const v = Number(col(r, indicator)) || 0;

      if (status === "Expected") expected += v;
      if (status === "Delivered") delivered += v;
    });

    const pct = expected > 0 ? (delivered / expected) * 100 : 0;

    html += `
      <div class="kpi kpi-oki">
        <div class="kpi-icon">📌</div>
        <div class="kpi-body">
          <div class="kpi-value">${fmt(delivered)}</div>
          <div class="kpi-label">
            ${indicator}<br>
            <span class="kpi-sub">
              Delivered ${fmt(delivered)} /
              Expected ${fmt(expected)}
              (${pct.toFixed(1)}%)
            </span>
          </div>
          <div class="gauge">
            <span style="width:${Math.min(pct,100)}%"></span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}


/* =========================================================
   OKI MAP – DELIVERED BY COUNTRY (FINAL, STABLE)
========================================================= */

/* =========================================================
   OKI MAP – DELIVERED VALUES BY COUNTRY
========================================================= */
function drawOKILayer(indicator) {

  if (!okiMap || !window.africaGeoJSON) return;

  if (okiLayer) {
    okiMap.removeLayer(okiLayer);
  }
  okiLayer = L.layerGroup().addTo(okiMap);

  // ================================
  // AGGREGATION DELIVERED BY COUNTRY
  // ================================
  const byCountry = {};

  rawRows
    .filter(r => r["Expected/Delivered"] === "Delivered")
    .forEach(r => {
      const country = normalizeCountryName(r["Country"]);
      const v = safeNum(r[indicator]);
      if (!country || v <= 0) return;
      byCountry[country] = (byCountry[country] || 0) + v;
    });

  const values = Object.values(byCountry);
  const maxValue = values.length ? Math.max(...values) : 0;

  const getRadius = v =>
    maxValue ? 6 + Math.sqrt(v / maxValue) * 24 : 6;

  // ================================
  // DRAW POLYGONS + BUBBLES
  // ================================
  L.geoJSON(africaGeoJSON, {
    style: f => {
      const v = byCountry[normalizeCountryName(f.properties.ADMIN)] || 0;
      return {
        fillColor: v ? "#0b7d3e" : "#eeeeee",
        fillOpacity: 0.75,
        color: "#666",
        weight: 1
      };
    },
    onEachFeature: (f, layer) => {
      const v = byCountry[normalizeCountryName(f.properties.ADMIN)] || 0;
      if (v > 0) {
        layer.bindTooltip(
          `<strong>${f.properties.ADMIN}</strong><br>
           Delivered: ${Math.round(v).toLocaleString("en-US")}`,
          { sticky: true }
        );
      }
    }
  }).addTo(okiLayer);
}

function getOKIDataByCountry(indicator) {
  const result = {};

  rawRows
    .filter(r =>
      r["Expected/Delivered"] === "Delivered" &&
      r["Global/Milestone"] === "Global"
    )
    .forEach(r => {
      const country = normalizeCountryName(r["Country"]);
      const v = safeNum(r[indicator]);
      if (!country || v <= 0) return;
      result[country] = (result[country] || 0) + v;
    });

  return result;
}




/* =========================================================
   OKI MAP – FINAL (Leaflet-native filter inside map)
========================================================= */

function getCol(r, name) {
  return (
    r[name] ??
    r[` ${name}`] ??
    r[`${name} `] ??
    r[` ${name} `] ??
    0
  );
}



function renderOKIMap() { 

  /* ---------- SAFETY ---------- */
  if (!rawRows || !rawRows.length) {
    console.warn("OKI map skipped – no data");
    return;
  }

  /* ---------- LOAD GEOJSON ---------- */
  loadOKIGeoJSON(() => {

    if (!okiGeoJSON) {
      console.warn("OKI map skipped – GeoJSON missing");
      return;
    }

    /* ---------- INIT MAP ---------- */
    if (!okiMap) {

      okiMap = L.map("okiMap", {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
      }).setView([2, 20], 3);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(okiMap);

      /* ---------- FILTER ---------- */
      okiFilterControl = L.control({ position: "topleft" });

      okiFilterControl.onAdd = function () {
        const div = L.DomUtil.create("div", "map-filter");
        div.innerHTML = `
          <label><strong>Indicator</strong></label><br>
          <select id="okiIndicatorSelect">
            <option value="Power capacity installed (MW)">Power capacity installed (MW)</option>
            <option value="Cross-border and National Transmission Lines (KM)">Cross-border and National Transmission Lines (KM)</option>
            <option value="New or improved power distribution lines (KM)">New or improved power distribution lines (KM)</option>
          </select>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
      };

      okiFilterControl.addTo(okiMap);
    }

    /* ---------- COLUMN ACCESS (ROBUST) ---------- */
    const col = (r, name) =>
      r[name] ??
      r[` ${name} `] ??
      r[` ${name}`] ??
      r[`${name} `] ??
      0;

    /* ---------- SELECTED INDICATOR ---------- */
    const select = document.getElementById("okiIndicatorSelect");
    if (!select) return;
    const indicator = select.value;

    select.onchange = () => renderOKIMap();

    /* ---------- CLEAR LAYER ---------- */
    if (okiLayer) okiLayer.remove();
    okiLayer = L.layerGroup().addTo(okiMap);

    /* ---------- AGGREGATE DELIVERED ---------- */
    const valuesByCountry = {};

    rawRows
      .filter(r => col(r, "Expected/Delivered") === "Delivered")
      .forEach(r => {
        const country = normalizeCountryName(col(r, "Country"));
        const v = safeNum(col(r, indicator));   // ✅ FIX ICI
        if (!country || v <= 0) return;
        valuesByCountry[country] = (valuesByCountry[country] || 0) + v;
      });

    const values = Object.values(valuesByCountry);
    const maxValue = values.length ? Math.max(...values) : 0;

    /* ---------- COLOR ---------- */
    function getColor(v) {
      if (!v || maxValue === 0) return "#eeeeee";
      const r = v / maxValue;
      return r > 0.75 ? "#0b7d3e" :
             r > 0.50 ? "#3fa66b" :
             r > 0.25 ? "#8fd3a8" :
                        "#cfeee0";
    }

    /* ---------- RADIUS ---------- */
    const minR = 4, maxR = 28;
    function getRadius(v) {
      if (!v || maxValue === 0) return minR;
      return minR + Math.sqrt(v / maxValue) * (maxR - minR);
    }

    /* ---------- DRAW ---------- */
    L.geoJSON(okiGeoJSON, {
      style: f => {
        const c = normalizeCountryName(f.properties.ADMIN);
        const v = valuesByCountry[c] || 0;
        return {
          fillColor: getColor(v),
          fillOpacity: 0.85,
          weight: 1,
          color: "#555"
        };
      },
      onEachFeature: (f, layer) => {
        const c = normalizeCountryName(f.properties.ADMIN);
        const v = valuesByCountry[c] || 0;

        layer.bindTooltip(
          `<strong>${f.properties.ADMIN}</strong><br>
           Delivered: ${Math.round(v).toLocaleString("en-US")}`,
          { sticky: true }
        );

        if (v > 0) {
          const center = layer.getBounds().getCenter();
          L.circleMarker(center, {
            radius: getRadius(v),
            fillColor: "#0b7d3e",
            color: "#0b7d3e",
            fillOpacity: 0.6
          }).addTo(okiLayer);
        }
      }
    }).addTo(okiLayer);

  });
}


function renderAll(){
  renderMissionKPIs();
  renderMissionChart();
  initMission300Map();        // 🔑 créer la carte
  renderMission300Map();      // 🔑 injecter les données
  renderTablesAB(rawRows);
  renderDetailsByProject();
  renderOKIKPIs();
}




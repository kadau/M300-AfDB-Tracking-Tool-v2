/* =========================================================
   app.part1.js
   Utils, état global, chargement Excel
========================================================= */

let rawRows = [];
let africaGeoJSON = null;

/* ---------- Utils ---------- */
function safeNum(v){
  if(v === null || v === undefined || v === '') return 0;
  if(typeof v === 'string') v = v.replace(/\s+/g,'').replace(/,/g,'.');
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function fmt(n){
  return Number(n||0).toLocaleString("en-US");
}
function fmtShort(n){
  if(n>=1e9) return (n/1e9).toFixed(1)+" billion";
  if(n>=1e6) return (n/1e6).toFixed(1)+" million";
  return fmt(n);
}

/* ---------- Load GeoJSON ---------- */
fetch("africa.geojson")
  .then(r=>r.json())
  .then(g=> africaGeoJSON = g);

/* ---------- Load Excel ---------- */
fetch("M300-Database.xlsx")
  .then(r=>r.arrayBuffer())
  .then(buf=>{
    const wb = XLSX.read(buf,{type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(ws,{defval:""});
    renderAll();
  });

function initTabs() {

  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  if (!tabs.length || !panels.length) {
    console.warn('initTabs: tabs or panels not found');
    return;
  }

  /* =========================
     RESET INITIAL
  ========================== */
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));

  /* =========================
     ACTIVER MISSION 300
  ========================== */
  const defaultTab = document.querySelector('.tab[data-tab="mission"]');
  const defaultPanel = document.getElementById('mission');

  if (defaultTab && defaultPanel) {
    defaultTab.classList.add('active');
    defaultPanel.classList.add('active');
  }

  /* =========================
     CLICK HANDLERS
  ========================== */
  tabs.forEach(tab => {

    tab.addEventListener('click', () => {

      const targetId = tab.dataset.tab;

      /* --- reset --- */
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');

      const panel = document.getElementById(targetId);
      if (!panel) {
        console.warn('Panel not found:', targetId);
        return;
      }
      panel.classList.add('active');

      /* =========================
         POST-ACTIVATION ACTIONS
      ========================== */
      setTimeout(() => {

        /* ---- MISSION 300 ---- */
        if (targetId === 'mission') {
          if (typeof mapMission300 !== 'undefined' && mapMission300) {
            mapMission300.invalidateSize();
          }
        }

        /* ---- OKI ---- */
        if (targetId === 'oki') {

          // KPIs OKI
          if (typeof renderOKIKPIs === 'function') {
            renderOKIKPIs();
          }

          // Carte OKI
          if (typeof renderOKIMap === 'function') {
            renderOKIMap();
          }

          // Leaflet resize SAFE
          setTimeout(() => {
            if (okiMap && typeof okiMap.invalidateSize === 'function') {
              okiMap.invalidateSize();
            }
          }, 300);
        }

        /* ---- DETAILS ---- */
        if (targetId === 'details') {
          if (typeof renderDetailsByProject === 'function') {
            renderDetailsByProject();
          }
        }

      }, 200);
    });

  });
}

/* =========================
   INIT AU CHARGEMENT
========================== */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
});


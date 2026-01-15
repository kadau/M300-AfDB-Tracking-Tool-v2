/* =========================================================
   app.part4.js
   Tables A, B, Details by project
========================================================= */

/* =========================================================
   TABLES A & B – MISSION 300
   Format strict validé
========================================================= */

function renderTablesAB(rows) {

  const elA = document.getElementById("tableConnections");
  const elB = document.getElementById("tablePeople");
  if (!elA || !elB) return;

  elA.innerHTML = "";
  elB.innerHTML = "";

  // Accès robuste aux colonnes (espaces Excel)
  const col = (r, name) =>
    r[name] ?? r[` ${name} `] ?? 0;

  const fmt = n => Math.round(Number(n || 0)).toLocaleString("en-US");

  // =================================================
  // TABLE A – NUMBER OF ELECTRICITY CONNECTIONS
  // =================================================
  const systems = ["On-grid", "Mini-grid", "Off-grid"];
  const indicators = ["Households", "Businesses", "Public services"];

  const aggA = {};

  indicators.forEach(i => {
    aggA[i] = {};
    systems.forEach(s => {
      aggA[i][`${s}_Expected`] = 0;
      aggA[i][`${s}_Delivered`] = 0;
    });
  });

  rows
    .filter(r => col(r,"Global/Milestone") === "Global")
    .forEach(r => {
      const ind = col(r,"Sub-Sub-indicators");
      const sys = col(r,"Sub-indicators");
      const status = col(r,"Expected/Delivered");

      if (!indicators.includes(ind)) return;
      if (!systems.includes(sys)) return;

      const v = Number(col(r,"Number of electricity connections")) || 0;
      aggA[ind][`${sys}_${status}`] += v;
    });

  // Calcul All supply systems + All type of connections
  const rowsA = [];

  // All type of connections
  const allRow = {};
  systems.forEach(s => {
    ["Expected","Delivered"].forEach(st => {
      allRow[`${s}_${st}`] =
        indicators.reduce((sum,i)=>sum+aggA[i][`${s}_${st}`],0);
    });
  });
  rowsA.push({ label:"All type of connections", data: allRow });

  // Détails
  indicators.forEach(i => {
    rowsA.push({ label:i, data: aggA[i] });
  });

  elA.innerHTML = `
    <table class="styled-table">
      <thead>
        <tr>
          <th rowspan="2">Indicator</th>
          <th colspan="2">All supply systems</th>
          <th colspan="2">On-grid</th>
          <th colspan="2">Mini-grid</th>
          <th colspan="2">Off-grid</th>
        </tr>
        <tr>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
        </tr>
      </thead>
      <tbody>
        ${rowsA.map(r => {
          const allExp = systems.reduce((s,x)=>s+r.data[`${x}_Expected`],0);
          const allDel = systems.reduce((s,x)=>s+r.data[`${x}_Delivered`],0);
          return `
            <tr>
              <td>${r.label}</td>
              <td>${fmt(allExp)}</td>
              <td>${fmt(allDel)}</td>
              ${systems.map(s=>`
                <td>${fmt(r.data[`${s}_Expected`])}</td>
                <td>${fmt(r.data[`${s}_Delivered`])}</td>
              `).join("")}
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  // =================================================
  // TABLE B – PEOPLE PROVIDED WITH ACCESS (HOUSEHOLDS)
  // =================================================
  const aggB = {};
  systems.forEach(s=>{
    aggB[`${s}_Expected`] = 0;
    aggB[`${s}_Delivered`] = 0;
  });

  rows
    .filter(r =>
      col(r,"Global/Milestone") === "Global" &&
      col(r,"Sub-Sub-indicators") === "Households"
    )
    .forEach(r=>{
      const sys = col(r,"Sub-indicators");
      const status = col(r,"Expected/Delivered");
      if (!systems.includes(sys)) return;
      aggB[`${sys}_${status}`] += Number(col(r,"People provided with access to electricity")) || 0;
    });

  const allExpB = systems.reduce((s,x)=>s+aggB[`${x}_Expected`],0);
  const allDelB = systems.reduce((s,x)=>s+aggB[`${x}_Delivered`],0);

  elB.innerHTML = `
    <table class="styled-table">
      <thead>
        <tr>
          <th rowspan="2">Indicator</th>
          <th colspan="2">All supply systems</th>
          <th colspan="2">On-grid</th>
          <th colspan="2">Mini-grid</th>
          <th colspan="2">Off-grid</th>
        </tr>
        <tr>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
          <th>Expected</th><th>Delivered</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Households</td>
          <td>${fmt(allExpB)}</td>
          <td>${fmt(allDelB)}</td>
          ${systems.map(s=>`
            <td>${fmt(aggB[`${s}_Expected`])}</td>
            <td>${fmt(aggB[`${s}_Delivered`])}</td>
          `).join("")}
        </tr>
      </tbody>
    </table>
  `;
}
/* =========================================================
   TABLE A – NUMBER OF ELECTRICITY CONNECTIONS
========================================================= */
function renderTableA_NumberOfConnections(rows) {

  const INDICATORS = [
    { label: "All type of connections", filter: r => true },
    { label: "Households", filter: r => r["Sub-Sub-indicators"] === "Households" },
    { label: "Businesses", filter: r => r["Sub-Sub-indicators"] === "Businesses" },
    { label: "Public services", filter: r => r["Sub-Sub-indicators"] === "Public services" }
  ];

  const SYSTEMS = [
    { label: "All supply systems", filter: r => true },
    { label: "On-grid", filter: r => r["Sub-indicators"] === "On-grid" },
    { label: "Mini-grid", filter: r => r["Sub-indicators"] === "Mini-grid" },
    { label: "Off-grid", filter: r => r["Sub-indicators"] === "Off-grid" }
  ];

  let html = `
  <h3 class="table-title">Number of electricity connections</h3>
  <table class="m300-table">
    <thead>
      <tr>
        <th rowspan="2">Indicator</th>
        ${SYSTEMS.map(s => `<th colspan="2">${s.label}</th>`).join("")}
      </tr>
      <tr>
        ${SYSTEMS.map(() => `<th>Expected</th><th>Delivered</th>`).join("")}
      </tr>
    </thead>
    <tbody>
  `;

  INDICATORS.forEach(ind => {
    html += `<tr><td>${ind.label}</td>`;

    SYSTEMS.forEach(sys => {
      const expected = sumWhere(
        rows,
        r =>
          r["Expected/Delivered"] === "Expected" &&
          r["Global/Milestone"] === "Global" &&
          sys.filter(r) &&
          ind.filter(r),
        " Number of electricity connections "
      );

      const delivered = sumWhere(
        rows,
        r =>
          r["Expected/Delivered"] === "Delivered" &&
          r["Global/Milestone"] === "Global" &&
          sys.filter(r) &&
          ind.filter(r),
        " Number of electricity connections "
      );

      html += `<td class="num">${fmt(expected)}</td>
               <td class="num">${fmt(delivered)}</td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;

  document.getElementById("tableConnections").innerHTML = html;
}

/* =========================================================
   TABLE B – PEOPLE PROVIDED WITH ACCESS (HOUSEHOLDS ONLY)
========================================================= */
function renderTableB_PeopleAccess(rows) {

  const SYSTEMS = [
    { label: "All supply systems", filter: r => true },
    { label: "On-grid", filter: r => r["Sub-indicators"] === "On-grid" },
    { label: "Mini-grid", filter: r => r["Sub-indicators"] === "Mini-grid" },
    { label: "Off-grid", filter: r => r["Sub-indicators"] === "Off-grid" }
  ];

  let html = `
  <h3 class="table-title">People provided with access to electricity</h3>
  <table class="m300-table">
    <thead>
      <tr>
        <th rowspan="2">Indicator</th>
        ${SYSTEMS.map(s => `<th colspan="2">${s.label}</th>`).join("")}
      </tr>
      <tr>
        ${SYSTEMS.map(() => `<th>Expected</th><th>Delivered</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Households</td>
  `;

  SYSTEMS.forEach(sys => {
    const expected = sumWhere(
      rows,
      r =>
        r["Expected/Delivered"] === "Expected" &&
        r["Global/Milestone"] === "Global" &&
        r["Sub-Sub-indicators"] === "Households" &&
        sys.filter(r),
      " People provided with access to electricity "
    );

    const delivered = sumWhere(
      rows,
      r =>
        r["Expected/Delivered"] === "Delivered" &&
        r["Global/Milestone"] === "Global" &&
        r["Sub-Sub-indicators"] === "Households" &&
        sys.filter(r),
      " People provided with access to electricity "
    );

    html += `<td class="num">${fmt(expected)}</td>
             <td class="num">${fmt(delivered)}</td>`;
  });

  html += `</tr></tbody></table>`;

  document.getElementById("tablePeople").innerHTML = html;
}

function renderDetailsByProject() {

  const container = document.getElementById("detailsTable");
  if (!container) return;

  const map = {};

  /* ===============================
     AGGREGATION PAR PROJECT CODE
     + CONDITION Households
  =============================== */
  rawRows
    .filter(r =>
      r["Global/Milestone"] === "Global" &&
      r["Sub-indicators"] === "Total" &&
      r["Sub-Sub-indicators"] === "Households"
    )
    .forEach(r => {

      const code = r["Project Code"];
      if (!code) return;

      if (!map[code]) {
        map[code] = {
          region: r["Region"],
          country: r["Country"],
          name: r["Project name"],
          ce: 0,
          cd: 0,
          pe: 0,
          pd: 0
        };
      }

      const conn = safeNum(
        r[" Number of electricity connections "] ??
        r["Number of electricity connections"]
      );

      const ppl = safeNum(
        r[" People provided with access to electricity "] ??
        r["People provided with access to electricity"]
      );

      if (r["Expected/Delivered"] === "Expected") {
        map[code].ce += conn;
        map[code].pe += ppl;
      } else if (r["Expected/Delivered"] === "Delivered") {
        map[code].cd += conn;
        map[code].pd += ppl;
      }
    });

  const fmtInt = n =>
    Math.round(Number(n || 0)).toLocaleString("en-US");

  /* ===============================
     HTML (SEARCH + TABLE)
  =============================== */
  let html = `
    <input
      type="text"
      id="detailsSearch"
      placeholder="Search by region, country, project code or project name…"
      class="table-search"
    />

    <table class="styled-table" id="detailsTableInner">
      <thead>
        <tr>
          <th rowspan="2">Region</th>
          <th rowspan="2">Country</th>
          <th rowspan="2">Project code</th>
          <th rowspan="2">Project name</th>
          <th colspan="2">Number of electricity connections</th>
          <th colspan="2">People provided with access to electricity</th>
        </tr>
        <tr>
          <th>Expected</th>
          <th>Delivered</th>
          <th>Expected</th>
          <th>Delivered</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.entries(map).forEach(([code, r]) => {

    // supprimer lignes totalement nulles
    if ((r.ce + r.cd + r.pe + r.pd) === 0) return;

    html += `
      <tr>
        <td class="align-left">${r.region}</td>
        <td class="align-left">${r.country}</td>
        <td class="align-left">${code}</td>
        <td class="align-left">
          <a href="https://mapafrica.afdb.org/fr/projects/46002-${code}"
             target="_blank">
            ${r.name}
          </a>
        </td>
        <td>${fmtInt(r.ce)}</td>
        <td>${fmtInt(r.cd)}</td>
        <td>${fmtInt(r.pe)}</td>
        <td>${fmtInt(r.pd)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  /* ===============================
     SEARCH (FIRST 4 COLUMNS)
  =============================== */
  const searchInput = document.getElementById("detailsSearch");
  const rows = container.querySelectorAll("tbody tr");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    rows.forEach(tr => {
      const text =
        tr.cells[0].innerText +
        tr.cells[1].innerText +
        tr.cells[2].innerText +
        tr.cells[3].innerText;

      tr.style.display =
        text.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

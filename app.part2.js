/* =========================================================
   app.part2.js
   KPIs Mission 300
========================================================= */

const TARGET = 50_000_000;

function computeMissionKPIs(rows){

  // KPI1 Projects
  const kpi1 = new Set(
    rows.filter(r =>
      r["Expected/Delivered"]==="Expected" &&
      r["Sub-indicators"]==="Total" &&
      r["Sub-Sub-indicators"]==="Total" &&
      r["Global/Milestone"]==="Global" &&
      safeNum(r[" Number of electricity connections "])>0
    ).map(r=>r["Project Code"])
  ).size;

  // KPI2 Delivered
  const kpi2 = rows.filter(r =>
    r["Expected/Delivered"]==="Delivered" &&
    r["Sub-indicators"]==="Total" &&
    r["Sub-Sub-indicators"]==="Total" &&
    r["Global/Milestone"]==="Global"
  ).reduce((s,r)=> s+safeNum(r[" People provided with access to electricity "]),0);

  // KPI3 Additional expected
  const expected = rows.filter(r =>
    r["Expected/Delivered"]==="Expected" &&
    r["Sub-indicators"]==="Total" &&
    r["Sub-Sub-indicators"]==="Total" &&
    r["Global/Milestone"]==="Global"
  ).reduce((s,r)=> s+safeNum(r[" People provided with access to electricity "]),0);
  const kpi3 = Math.max(expected - kpi2,0);

  // KPI6 Cost
  const kpi6 = rows.filter(r =>
    r["Expected/Delivered"]==="Expected" &&
    r["Sub-indicators"]==="Total" &&
    r["Sub-Sub-indicators"]==="Total" &&
    r["Global/Milestone"]==="Global"  &&
    safeNum(r[" Number of electricity connections "])>0
  ).reduce((s,r)=> s+safeNum(r[" Total (All included - USD) "]),0);

  const kpi6b = rows.filter(r =>
    r["Expected/Delivered"]==="Expected" &&
    r["Sub-indicators"]==="Total" &&
    r["Sub-Sub-indicators"]==="Total" &&
    r["Global/Milestone"]==="Global"  &&
    safeNum(r[" Number of electricity connections "])>0
  ).reduce((s,r)=> s+safeNum(r[" BANK's Financing [ADB/ADF/NTF] "]),0);

  return {kpi1,kpi2,kpi3,kpi6,kpi6b};
}

function renderMissionKPIs(){
  const k = computeMissionKPIs(rawRows);
  document.getElementById("kpisMission").innerHTML = `
    <div class="kpi"><div class="kpi-icon">📁</div><div><div class="kpi-value">${k.kpi1}</div><div class="kpi-label">Projects</div></div></div>
    <div class="kpi"><div class="kpi-icon">👥</div><div><div class="kpi-value">${fmtShort(k.kpi2)}</div><div class="kpi-label">People connected</div></div></div>
    <div class="kpi"><div class="kpi-icon">➕</div><div><div class="kpi-value">${fmtShort(k.kpi3)}</div><div class="kpi-label">Additional expected</div></div></div>
    <div class="kpi"><div class="kpi-icon">🎯</div><div><div class="kpi-value">50.0 million</div><div class="kpi-label">Target</div></div></div>
    <div class="kpi"><div class="kpi-icon">📊</div><div><div class="kpi-value">${(((k.kpi2+k.kpi3)/TARGET)*100).toFixed(1)}%</div><div class="kpi-label">Progress</div></div></div>
    <div class="kpi"><div class="kpi-icon usd-icon">$</div><div><div class="kpi-value">${fmtShort(k.kpi6)}</div><div class="kpi-label">Total investment<br>Bank contribution: ${fmtShort(k.kpi6b)}</div></div></div>
  `;
}

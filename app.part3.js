/* =========================================================
   app.part3.js
   Graphique Mission 300
========================================================= */

/* ============================================================
   Mission 300 – Chart.js labels plugin (OBLIGATOIRE)
============================================================ */

const mission300LabelsPlugin = {
  id: 'mission300Labels',

  afterDatasetsDraw(chart) {
    const { ctx, scales } = chart;
    const x = scales.x;
    const y = scales.y;
    if (!x || !y) return;

    ctx.save();

    const TARGET = 50_000_000;

    // Dataset mapping (ordre STRICT)
    const delivered = chart.data.datasets[0]?.data[0] || 0; // KPI2
    const additional = chart.data.datasets[1]?.data[1] || 0; // KPI3
    const global = delivered + additional;
    const gap = TARGET - global;

    const values = [delivered, additional, global, TARGET];

    /* ---------- Labels au-dessus des barres ---------- */
    values.forEach((val, i) => {
      if (!val) return;

      const xPos = x.getPixelForValue(i);
      const yPos = y.getPixelForValue(val) - 8;

      let label;
      if (i === 3) {
        label = '50 million';
      } else {
        const pct = (val / TARGET) * 100;
        label = `${(val / 1e6).toFixed(1)} million (${pct.toFixed(1)}%)`;
      }

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, xPos, yPos);
    });

    /* ---------- Gap au centre de la barre rouge ---------- */
    if (gap > 0) {
      const xTarget = x.getPixelForValue(3);
      const yTop = y.getPixelForValue(TARGET);
      const yBottom = y.getPixelForValue(global);
      const yCenter = (yTop + yBottom) / 2;

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(
        `Gap ${(gap / 1e6).toFixed(1)} million (${((gap / TARGET) * 100).toFixed(1)}%)`,
        xTarget,
        yCenter
      );
    }

    ctx.restore();
  }
};


let missionChart = null;

function renderMissionChart() {

  // --- KPIs existants (ON NE CHANGE RIEN) ---
  const k = computeMissionKPIs(rawRows);
  const gap = TARGET - (k.kpi2 + k.kpi3);

  // --- Détruire l'ancien graphique si présent ---
  if (missionChart instanceof Chart) {
    missionChart.destroy();
  }

  const canvas = document.getElementById("mission300Chart");
  if (!canvas) return;

  missionChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: [
        "Delivered",
        "Additional expected",
        "Global",
        "Target"
      ],
      datasets: [
        {
          data: [k.kpi2, 0, k.kpi2, k.kpi2],
          backgroundColor: "#0b7d3e",
          stack: "total"
        },
        {
          data: [0, k.kpi3, k.kpi3, k.kpi3],
          backgroundColor: "#d9d9d9",
          stack: "total"
        },
        {
          data: [0, 0, 0, gap],
          backgroundColor: "#d62828",
          stack: "total"
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false, // 🔑 hauteur contrôlée par CSS

      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "People provided with access to electricity",
          align: "start",
          font: {
            size: 18,
            weight: "bold"
          },
          color: "#000",
          padding: {
            bottom: 20
          }
        },
        tooltip: {
          enabled: false // labels custom via plugin
        }
      },

      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          },
          border: {
            display: true,
            width: 3
          },
          ticks: {
            font: {
              size: 14,
              weight: "bold"
            }
          }
        },

        y: {
          stacked: true,
          beginAtZero: true,

          ticks: {
            stepSize: 10_000_000,
            callback: function(value) {
              return (value / 1e6) + "M";
            },
            font: {
              size: 13
            }
          },

          grid: {
            display: true,
            color: "#e0e0e0",
            lineWidth: 1
          },

          border: {
            display: true,
            width: 2,
            color: "#999"
          }
        }
      }
    },

    plugins: [mission300LabelsPlugin]
  });

  // --- Forcer le recalcul de taille après insertion DOM ---
  setTimeout(() => {
    missionChart.resize();
  }, 0);
}

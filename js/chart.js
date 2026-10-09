const BudgetChart = (() => {
  const CHARTS = {
    depense: { canvasId: "chart-depenses", videId: "chart-depenses-vide", instance: null },
    revenu: { canvasId: "chart-revenus", videId: "chart-revenus-vide", instance: null },
  };

  function creerChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    return new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${UI.formaterMontant(context.parsed)}`,
            },
          },
        },
      },
    });
  }

  function initChart() {
    Object.values(CHARTS).forEach((config) => {
      config.instance = creerChart(config.canvasId);
    });
  }

  function mettreAJourUnChart(config, liste, type) {
    const totaux = Transactions.totauxParCategorie(liste, type);
    const categories = Object.keys(totaux);
    const elementVide = document.getElementById(config.videId);
    const canvas = document.getElementById(config.canvasId);

    if (categories.length === 0) {
      elementVide.hidden = false;
      canvas.style.display = "none";
      config.instance.data.labels = [];
      config.instance.data.datasets[0].data = [];
      config.instance.data.datasets[0].backgroundColor = [];
      config.instance.update();
      return;
    }

    elementVide.hidden = true;
    canvas.style.display = "block";
    config.instance.data.labels = categories.map((cat) => Categories.obtenirLibelle(cat));
    config.instance.data.datasets[0].data = categories.map((cat) => totaux[cat]);
    config.instance.data.datasets[0].backgroundColor = categories.map((cat) => Categories.obtenirCouleur(cat));
    config.instance.update();
  }

  function mettreAJourChart(liste) {
    mettreAJourUnChart(CHARTS.depense, liste, "depense");
    mettreAJourUnChart(CHARTS.revenu, liste, "revenu");
  }

  return { initChart, mettreAJourChart };
})();

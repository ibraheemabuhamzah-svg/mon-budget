document.addEventListener("DOMContentLoaded", () => {
  BudgetChart.initChart();

  function render() {
    const liste = Storage.getTransactions();
    const listeFiltree = Transactions.filtrerTransactions(liste, UI.lireFiltres());

    UI.afficherSolde(liste);
    UI.afficherHistorique(listeFiltree, (id) => {
      Storage.deleteTransaction(id);
      render();
    });
    BudgetChart.mettreAJourChart(listeFiltree);
  }

  UI.initFormulaire(render);
  UI.initFiltres(render);
  UI.initGestionCategories();

  window.addEventListener("storage", (event) => {
    if (event.key === Storage.CLE_STOCKAGE || event.key === null) {
      render();
    }
  });

  render();
});

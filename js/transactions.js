const Transactions = (() => {
  function calculerSolde(liste) {
    return liste.reduce((solde, tx) => {
      const montant = Number(tx.montant);
      if (!Number.isFinite(montant)) return solde;
      return tx.type === "revenu" ? solde + montant : solde - montant;
    }, 0);
  }

  function totalParType(liste, type) {
    return liste.reduce((total, tx) => {
      if (tx.type !== type) return total;
      const montant = Number(tx.montant);
      return Number.isFinite(montant) ? total + montant : total;
    }, 0);
  }

  function totauxParCategorie(liste, type) {
    const totaux = {};
    liste
      .filter((tx) => tx.type === type)
      .forEach((tx) => {
        const montant = Number(tx.montant);
        if (!Number.isFinite(montant)) return;
        const categorie = tx.categorie || "autres";
        totaux[categorie] = (totaux[categorie] || 0) + montant;
      });
    return totaux;
  }

  function filtrerTransactions(liste, { categorie, type, dateDebut, dateFin } = {}) {
    return liste.filter((tx) => {
      if (categorie && tx.categorie !== categorie) return false;
      if (type && tx.type !== type) return false;
      if (dateDebut && tx.date < dateDebut) return false;
      if (dateFin && tx.date > dateFin) return false;
      return true;
    });
  }

  return { calculerSolde, totalParType, totauxParCategorie, filtrerTransactions };
})();

const Storage = (() => {
  const CLE_STOCKAGE = "budget_transactions";

  function genererId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getTransactions() {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    try {
      const donnees = JSON.parse(brut);
      return Array.isArray(donnees) ? donnees : [];
    } catch (erreur) {
      console.error("Données de budget corrompues dans localStorage, sauvegarde d'une copie de secours.", erreur);
      try {
        localStorage.setItem(`${CLE_STOCKAGE}_corrompu_${Date.now()}`, brut);
      } catch {
        // stockage plein : impossible de garder une copie, on continue avec une liste vide
      }
      return [];
    }
  }

  function saveTransactions(liste) {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
      return true;
    } catch (erreur) {
      console.error("Impossible d'enregistrer les transactions dans localStorage.", erreur);
      return false;
    }
  }

  function addTransaction(transaction) {
    const liste = getTransactions();
    const nouvelleTransaction = { ...transaction, id: genererId() };
    liste.push(nouvelleTransaction);
    return saveTransactions(liste) ? nouvelleTransaction : null;
  }

  function deleteTransaction(id) {
    const liste = getTransactions().filter((tx) => tx.id !== id);
    return saveTransactions(liste);
  }

  return { CLE_STOCKAGE, getTransactions, saveTransactions, addTransaction, deleteTransaction };
})();

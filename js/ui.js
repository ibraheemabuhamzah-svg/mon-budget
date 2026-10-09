const UI = (() => {
  function formaterMontant(montant) {
    return montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " £";
  }

  function formaterDate(dateIso) {
    const [annee, mois, jour] = dateIso.split("-");
    return `${jour}/${mois}/${annee}`;
  }

  function dateLocaleISO() {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
    const jour = String(maintenant.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}`;
  }

  function initFormulaire(onChangement) {
    const form = document.getElementById("form-transaction");
    const erreur = document.getElementById("form-erreur");

    Categories.peuplerSelect(document.getElementById("categorie"));
    document.getElementById("date").value = dateLocaleISO();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      erreur.hidden = true;

      const type = document.getElementById("type").value;
      const montant = parseFloat(document.getElementById("montant").value);
      const categorie = document.getElementById("categorie").value;
      const date = document.getElementById("date").value;
      const description = document.getElementById("description").value.trim();

      if (!montant || montant <= 0) {
        erreur.textContent = "Le montant doit être supérieur à 0.";
        erreur.hidden = false;
        return;
      }

      if (!date) {
        erreur.textContent = "La date est obligatoire.";
        erreur.hidden = false;
        return;
      }

      const transactionAjoutee = Storage.addTransaction({ type, montant, categorie, date, description });
      if (!transactionAjoutee) {
        erreur.textContent = "Impossible d'enregistrer la transaction (stockage local indisponible ou plein).";
        erreur.hidden = false;
        return;
      }

      form.reset();
      document.getElementById("date").value = dateLocaleISO();
      onChangement();
    });
  }

  function initGestionCategories() {
    const bouton = document.getElementById("bouton-nouvelle-categorie");
    const formulaire = document.getElementById("form-nouvelle-categorie");
    const champNom = document.getElementById("nouvelle-categorie-nom");
    const champCouleur = document.getElementById("nouvelle-categorie-couleur");
    const erreur = document.getElementById("nouvelle-categorie-erreur");

    function fermerFormulaire() {
      formulaire.hidden = true;
      bouton.hidden = false;
      champNom.value = "";
      erreur.hidden = true;
    }

    function rafraichirSelects(cleSelectionnee) {
      Categories.peuplerSelect(document.getElementById("categorie"));
      Categories.peuplerSelect(document.getElementById("filtre-categorie"), { avecOptionToutes: true });
      if (cleSelectionnee) {
        document.getElementById("categorie").value = cleSelectionnee;
      }
    }

    bouton.addEventListener("click", () => {
      bouton.hidden = true;
      formulaire.hidden = false;
      champNom.focus();
    });

    document.getElementById("nouvelle-categorie-annuler").addEventListener("click", fermerFormulaire);

    document.getElementById("nouvelle-categorie-creer").addEventListener("click", () => {
      erreur.hidden = true;
      const resultat = Categories.ajouterCategorie(champNom.value, champCouleur.value);

      if (!resultat.succes) {
        erreur.textContent = resultat.erreur;
        erreur.hidden = false;
        return;
      }

      rafraichirSelects(resultat.categorie.cle);
      fermerFormulaire();
    });
  }

  function afficherSolde(liste) {
    const solde = Transactions.calculerSolde(liste);
    const element = document.getElementById("solde");
    element.textContent = formaterMontant(solde);
    element.classList.toggle("positif", solde >= 0);
    element.classList.toggle("negatif", solde < 0);

    const totalRevenus = Transactions.totalParType(liste, "revenu");
    const totalDepenses = Transactions.totalParType(liste, "depense");
    document.getElementById("total-revenus").textContent = formaterMontant(totalRevenus);
    document.getElementById("total-depenses").textContent = formaterMontant(totalDepenses);
  }

  function lireFiltres() {
    return {
      type: document.getElementById("filtre-type").value,
      categorie: document.getElementById("filtre-categorie").value,
      dateDebut: document.getElementById("filtre-date-debut").value,
      dateFin: document.getElementById("filtre-date-fin").value,
    };
  }

  function afficherHistorique(listeFiltree, onSuppression) {
    const transactions = listeFiltree.sort((a, b) => b.date.localeCompare(a.date));

    const conteneur = document.getElementById("liste-transactions");
    const elementVide = document.getElementById("historique-vide");
    conteneur.innerHTML = "";

    if (transactions.length === 0) {
      elementVide.hidden = false;
      return;
    }
    elementVide.hidden = true;

    transactions.forEach((tx) => {
      const li = document.createElement("li");
      li.className = "transaction";

      const spanDate = document.createElement("span");
      spanDate.className = "transaction-date";
      spanDate.textContent = formaterDate(tx.date);

      const spanDescription = document.createElement("span");
      spanDescription.className = "transaction-description";
      spanDescription.textContent = tx.description || "—";

      const spanBadge = document.createElement("span");
      spanBadge.className = "transaction-badge";
      spanBadge.textContent = Categories.obtenirLibelle(tx.categorie);
      spanBadge.style.background = Categories.obtenirCouleur(tx.categorie);

      const spanMontant = document.createElement("span");
      spanMontant.className = `transaction-montant ${tx.type}`;
      spanMontant.textContent = `${tx.type === "depense" ? "-" : "+"}${formaterMontant(tx.montant)}`;

      const boutonSupprimer = document.createElement("button");
      boutonSupprimer.type = "button";
      boutonSupprimer.className = "btn-supprimer";
      boutonSupprimer.setAttribute("aria-label", "Supprimer");
      boutonSupprimer.textContent = "✕";
      boutonSupprimer.addEventListener("click", () => onSuppression(tx.id));

      li.append(spanDate, spanDescription, spanBadge, spanMontant, boutonSupprimer);
      conteneur.appendChild(li);
    });
  }

  function initFiltres(onChangement) {
    Categories.peuplerSelect(document.getElementById("filtre-categorie"), { avecOptionToutes: true });

    ["filtre-type", "filtre-categorie", "filtre-date-debut", "filtre-date-fin"].forEach((id) => {
      document.getElementById(id).addEventListener("change", onChangement);
    });
    document.getElementById("filtre-reset").addEventListener("click", () => {
      document.getElementById("filtre-type").value = "";
      document.getElementById("filtre-categorie").value = "";
      document.getElementById("filtre-date-debut").value = "";
      document.getElementById("filtre-date-fin").value = "";
      onChangement();
    });
  }

  return {
    initFormulaire,
    initGestionCategories,
    afficherSolde,
    afficherHistorique,
    initFiltres,
    lireFiltres,
    formaterMontant,
  };
})();

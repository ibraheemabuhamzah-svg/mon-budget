const Categories = (() => {
  const COULEUR_PAR_DEFAUT = "#9ca3af";

  const LISTE = [
    { cle: "alimentation", libelle: "Alimentation", couleur: "#f59e0b" },
    { cle: "logement", libelle: "Logement", couleur: "#3b82f6" },
    { cle: "transport", libelle: "Transport", couleur: "#06b6d4" },
    { cle: "loisirs", libelle: "Loisirs", couleur: "#a855f7" },
    { cle: "sante", libelle: "Santé", couleur: "#ef4444" },
    { cle: "learning", libelle: "Learning", couleur: "#10b981" },
    { cle: "cobden", libelle: "Cobden", couleur: "#ec4899" },
    { cle: "lma", libelle: "LMA", couleur: "#6366f1" },
    { cle: "kickboxing", libelle: "Kickboxing", couleur: "#f97316" },
    { cle: "deen", libelle: "Deen", couleur: "#14b8a6" },
    { cle: "umma-combat", libelle: "UMMA COMBAT", couleur: "#be123c" },
    { cle: "communication", libelle: "Communication", couleur: "#84cc16" },
    { cle: "autres", libelle: "Autres", couleur: COULEUR_PAR_DEFAUT },
  ];

  function obtenirLibelle(cle) {
    const categorie = LISTE.find((c) => c.cle === cle);
    return categorie ? categorie.libelle : cle || "Autres";
  }

  function obtenirCouleur(cle) {
    const categorie = LISTE.find((c) => c.cle === cle);
    return categorie ? categorie.couleur : COULEUR_PAR_DEFAUT;
  }

  function peuplerSelect(select, { avecOptionToutes = false } = {}) {
    select.innerHTML = "";
    if (avecOptionToutes) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Toutes";
      select.appendChild(option);
    }
    LISTE.forEach(({ cle, libelle }) => {
      const option = document.createElement("option");
      option.value = cle;
      option.textContent = libelle;
      select.appendChild(option);
    });
  }

  return { LISTE, obtenirLibelle, obtenirCouleur, peuplerSelect };
})();

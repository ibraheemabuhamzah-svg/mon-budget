# Application de Gestion de Budget Personnel

## Description

Application web permettant de gérer un budget personnel : suivi des dépenses et des revenus, visualisation de la répartition par catégorie, et historique des transactions.

## Fonctionnalités

- **Ajout de transactions** : l'utilisateur peut ajouter des dépenses et des revenus, chacun avec :
  - un montant
  - une catégorie
  - une date
  - une description
- **Catégories par défaut** : alimentation, logement, transport, loisirs, santé, learning, cobden, lma, kickboxing, deen, umma combat, communication, autres
- **Catégories personnalisées** : l'utilisateur peut créer ses propres catégories directement depuis le formulaire d'ajout (bouton « + Nouvelle catégorie » : nom + couleur), sans toucher au code ; elles sont immédiatement disponibles partout (formulaire, filtre, badges, graphiques)
- **Devise** : les montants sont affichés en Livres Sterling (£)
- **Tableau de bord** :
  - solde actuel (revenus - dépenses)
  - total des revenus et total des dépenses
  - graphique de répartition des dépenses par catégorie
  - graphique de répartition des revenus par catégorie
  - historique des transactions, filtrable (par catégorie, par type, par période)

## Langue et design

- Interface entièrement en français
- Design moderne et épuré

## Stack technique

- HTML
- CSS
- JavaScript pur (vanilla, sans framework)
- [Chart.js](https://www.chartjs.org/) v4.4.4, chargé depuis le CDN jsdelivr (`cdn.jsdelivr.net/npm/chart.js@4.4.4/...`) — cdnjs ne sert pas cette librairie sous ce chemin, jsdelivr fonctionne
- Stockage des données en local via `localStorage` (pas de backend)

## Arborescence

```
Application-Budget/
├── CLAUDE.md
├── index.html              # page unique : structure, formulaire, graphiques, historique, balises meta/SEO
├── favicon.svg             # icône du site (SVG inline, couleur primaire de l'app)
├── .gitignore
├── css/
│   └── style.css           # design system (variables CSS), layout, composants
└── js/
    ├── categories.js       # source unique de vérité : liste des catégories (clé, libellé, couleur)
    ├── storage.js          # accès localStorage (CRUD transactions)
    ├── transactions.js     # logique métier pure (solde, totaux, filtres)
    ├── chart.js            # intégration Chart.js (graphiques dépenses/revenus)
    ├── ui.js                # rendu DOM (formulaire, solde, historique, filtres)
    └── app.js               # point d'entrée : câblage des modules, boucle de rendu
```

Pas de build, pas de bundler : les fichiers sont servis tels quels. `index.html` charge les scripts en balises `<script>` classiques, dans l'ordre de dépendance (voir plus bas).

## Architecture

- **Application à une seule page**, sans routeur, sans framework JS.
- **Modules en IIFE** : chaque fichier `js/*.js` (sauf `app.js`) expose un objet global unique via le pattern `const Nom = (() => { ...; return { ... }; })();`. Pas d'imports/exports ES modules — les scripts partagent le même scope global (`window`) et se référencent directement par leur nom (ex. `Transactions.calculerSolde(...)` est appelé depuis `chart.js` et `app.js`).
- **Ordre de chargement obligatoire** dans `index.html` (chaque script dépend des précédents) :
  1. Chart.js (CDN)
  2. `categories.js` — aucune dépendance interne
  3. `storage.js` — aucune dépendance interne
  4. `transactions.js` — aucune dépendance interne
  5. `chart.js` — dépend de `Transactions`, `Categories`, et (au moment du survol d'une infobulle seulement, pas au chargement) de `UI.formaterMontant`
  6. `ui.js` — dépend de `Storage`, `Transactions`, `Categories`
  7. `app.js` — dépend de `Storage`, `Transactions`, `UI`, `BudgetChart`
- **Séparation des responsabilités** :
  - `categories.js` : **source unique de vérité** pour la liste des catégories (`{ cle, libelle, couleur }`). Combine en interne `CATEGORIES_PAR_DEFAUT` (13 entrées codées en dur) et les catégories personnalisées persistées dans `localStorage` sous la clé `budget_categories_personnalisees`. Expose `obtenirLibelle(cle)`, `obtenirCouleur(cle)` (fallback gris `#9ca3af` si la clé est inconnue), `peuplerSelect(select, { avecOptionToutes })` qui génère dynamiquement les `<option>` d'un `<select>`, et `ajouterCategorie(libelle, couleur)` qui génère la clé (slug), valide (nom non vide, pas de doublon), persiste et retourne `{ succes: true, categorie }` ou `{ succes: false, erreur }`.
  - `storage.js` : seul module qui touche `localStorage`. Expose `getTransactions`, `saveTransactions`, `addTransaction`, `deleteTransaction`, `CLE_STOCKAGE`. `addTransaction`/`saveTransactions` retournent `false`/`null` si l'écriture échoue (quota dépassé, navigation privée) — l'appelant doit vérifier le retour.
  - `transactions.js` : logique métier pure, sans DOM — `calculerSolde`, `totalParType(liste, type)` (total simple des montants pour un type donné, ex. total des revenus ou des dépenses, utilisé par `UI.afficherSolde`), `totauxParCategorie(liste, type)`, `filtrerTransactions`. Ignore silencieusement les entrées avec un `montant` non numérique ; un `categorie` manquant est compté sous `"autres"`. Facilement testable isolément.
  - `chart.js` : expose `initChart()` (crée les deux instances Chart.js dépenses/revenus, encapsulées dans une structure `CHARTS` interne) et `mettreAJourChart(liste)` (recalcule et met à jour les deux graphiques, gère l'état vide par graphique, délègue libellés/couleurs à `Categories` et le formatage des infobulles à `UI.formaterMontant`).
  - `ui.js` : tout le rendu DOM et les écouteurs d'événements du formulaire, des filtres et de la création de catégories (`initGestionCategories()` : ouvre/ferme le mini-formulaire inline, appelle `Categories.ajouterCategorie`, repeuple les deux `<select>` de catégorie et présélectionne la nouvelle catégorie en cas de succès). Construit l'historique via `createElement`/`textContent` (jamais `innerHTML` avec des données utilisateur) pour éviter toute injection. Expose aussi `lireFiltres()` et `formaterMontant()` pour réutilisation par `app.js`/`chart.js`.
  - `app.js` : orchestrateur. Définit une fonction `render()` qui relit `Storage.getTransactions()`, calcule la liste filtrée une seule fois (`Transactions.filtrerTransactions(liste, UI.lireFiltres())`) et la transmet à la fois à l'historique et aux graphiques — **les deux restent donc cohérents avec les filtres actifs** ; seul le solde utilise la liste complète non filtrée. Écoute aussi l'événement `storage` pour se resynchroniser si l'utilisateur a l'app ouverte dans un autre onglet. **Pas d'état en mémoire** : le DOM est entièrement redérivé de `localStorage` à chaque changement (pattern re-render complet, pas de mise à jour incrémentale du DOM).
- **Modèle de données** (une transaction) :
  ```js
  { id, type: "depense" | "revenu", montant: number, categorie: string, date: "YYYY-MM-DD", description: string }
  ```
  Stocké comme tableau JSON unique sous la clé localStorage `budget_transactions`.

## Conventions

- **Code et commentaires en français** : noms de fonctions/variables en français (`calculerSolde`, `afficherHistorique`, `liste`, `montant`), accents inclus. Les clés techniques (`type`, `id`, propriétés d'objets Chart.js) restent en anglais car imposées par les données ou la librairie.
- **Clés de catégorie** : minuscules, sans accent, mot unique ou slug séparé par un tiret pour les catégories composées (ex. `umma-combat`). Ces clés sont utilisées comme `value` des `<option>` (générées dynamiquement) et comme clé d'entrée dans `js/categories.js` — garder ce format cohérent pour toute nouvelle catégorie.
- **Pattern module** : `const NomDuModule = (() => { ...fonctions privées...; return { ...API publique... }; })();`. Les fonctions non retournées dans l'objet final sont privées au module.
- **Formatage des montants** : toujours via `UI.formaterMontant()` (`fr-FR`, 2 décimales, suffixe ` £`) — ne pas reformater manuellement ailleurs (y compris dans les callbacks Chart.js).
- **Variables CSS** : toutes les couleurs de thème sont définies dans `:root` sous forme de variables `--color-*`, jamais codées en dur dans les règles. Les couleurs de catégorie ne sont **pas** des variables CSS : elles vivent uniquement dans `js/categories.js` et sont appliquées en style inline (`element.style.background = Categories.obtenirCouleur(cle)`), pour éviter toute duplication entre JS et CSS.
- **Pas de build/transpilation** : JavaScript ES2017+ natif (arrow functions, template literals, destructuring, `??`/optional chaining si besoin), compatible navigateurs modernes sans polyfill.
- **Pas d'`innerHTML` avec des données utilisateur** : toute donnée saisie par l'utilisateur (description, etc.) affichée dans le DOM doit passer par `textContent`/`createElement`, jamais par de l'interpolation dans une chaîne `innerHTML`, pour éviter l'injection HTML/script.

### Ajouter une catégorie

Deux façons, selon qui en a besoin :

- **Depuis l'application** (utilisateur final) : bouton « + Nouvelle catégorie » sous le select catégorie du formulaire d'ajout. Persistée dans `localStorage` (`budget_categories_personnalisees`), disponible immédiatement partout (selects, badges, graphiques), sans toucher au code.
- **Catégorie par défaut, codée en dur** (développeur) : ajouter une entrée au tableau `CATEGORIES_PAR_DEFAUT` dans `js/categories.js` (`{ cle, libelle, couleur }`) — les deux `<select>`, les badges et les graphiques en dérivent automatiquement au chargement, comme pour les catégories personnalisées. Mettre à jour la liste des catégories par défaut dans ce fichier (section Fonctionnalités) en complément, pour la documentation.

## Notes d'implémentation

- Toutes les données (transactions) sont persistées dans `localStorage` et survivent au rechargement de la page.
- Les graphiques de répartition par catégorie (un pour les dépenses, un pour les revenus) sont réalisés avec Chart.js (type `doughnut`), chacun avec sa propre gestion d'état vide.
- Le solde se recalcule automatiquement à chaque ajout/suppression de transaction, via la fonction `render()` dans `app.js`.
- Le filtrage (catégorie, type, période) se fait côté client, sans rechargement de page ; il affecte l'historique **et** les deux graphiques (tous deux dérivés de la même liste filtrée dans `app.js`), mais pas le solde, qui reste calculé sur l'ensemble des transactions.
- Validation du formulaire : montant strictement positif, date obligatoire, messages d'erreur en français affichés inline. Un échec d'écriture dans `localStorage` (quota dépassé, navigation privée) affiche aussi une erreur inline plutôt que d'échouer silencieusement.
- Si le JSON stocké dans `localStorage` est corrompu, une copie de secours est conservée sous une clé horodatée (`budget_transactions_corrompu_<timestamp>`) avant de repartir sur une liste vide.
- L'app se resynchronise automatiquement si les données changent dans un autre onglet (écoute de l'événement `storage`).
- Les catégories personnalisées (`budget_categories_personnalisees`) sont stockées séparément des transactions (`budget_transactions`) et des catégories par défaut (codées en dur) ; la génération de clé slugifie le nom saisi (minuscule, sans accent, tirets) et refuse les doublons avec une catégorie existante (par défaut ou personnalisée).

## Lancer le projet en local

```bash
cd Application-Budget
python3 -m http.server 8787
```

Puis ouvrir `http://localhost:8787/index.html`. Un chargement direct en `file://` casse le chargement du CDN Chart.js et des chemins relatifs dans certains contextes (ex. prévisualisation sandboxée) — toujours passer par un serveur HTTP local.

## Déploiement

- **Hébergement** : [GitHub Pages](https://ibraheemabuhamzah-svg.github.io/mon-budget/), servi depuis la branche `main` du dépôt [mon-budget](https://github.com/ibraheemabuhamzah-svg/mon-budget) (public — condition nécessaire à GitHub Pages sur un compte gratuit).
- **Données sensibles** : aucune — pas de clé API, token, mot de passe ni information personnelle dans le code (vérifié par recherche sur le dépôt). Toutes les données utilisateur (transactions, catégories personnalisées) restent exclusivement dans le `localStorage` du navigateur de chacun, jamais envoyées à un serveur.
- **Images** : aucune image bitmap dans le projet. Seul `favicon.svg` (icône du site, inline SVG) est chargé en asset statique, référencé en chemin relatif.
- **SEO de base** (dans `index.html`) : `<meta name="description">`, `<meta name="robots" content="index, follow">`, `<link rel="canonical">`, balises Open Graph (`og:title`, `og:description`, `og:url`, `og:type`, `og:locale`, `og:image`) et Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`), `<meta name="theme-color">` assorti à `--color-primary`. L'URL canonique et `og:url` pointent vers l'URL GitHub Pages ci-dessus — à mettre à jour si le site change d'URL/domaine.
- **Responsive** : vérifié sur le déploiement réel à 375px (mobile) — formulaire, graphiques (doughnut Chart.js dans un conteneur à largeur max 320px) et filtres s'affichent sans débordement, grâce au breakpoint `@media (max-width: 720px)` dans `css/style.css`.

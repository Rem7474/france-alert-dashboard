# France — signaux d'alerte structurels

Tableau de bord statique (une seule page HTML, sans dépendance) sur les vulnérabilités structurelles de la France : dette et déficit, charge d'intérêts, spread OAT/Bund, désindustrialisation, démographie, emploi, éducation, logement.

**Démo :** https://rem7474.github.io/france-alert-dashboard/

## Indice de vulnérabilité

Un indicateur unique de 0 à 100 résume la situation. Chaque indicateur (dette, déficit, intérêts, solde extérieur, industrie, fécondité, chômage des jeunes, emploi des 55-64 ans, spread) est converti en score par rapport à sa plage observée depuis 2005, puis moyenné en 4 piliers pondérés (poids modifiables dans la page).

- **30 j, 90 j, 1 an** : suivi quotidien. Seul le pilier marché varie à ce rythme (tension souveraine zone euro : courbe BCE tous émetteurs moins courbe AAA, 10 ans), car les autres séries sont annuelles.
- **5 ans, depuis 2005** : suivi mensuel avec le spread OAT/Bund (taux de convergence BCE) ; les piliers annuels sont maintenus constants dans l'année.

Le calcul est dans `src/index-calc.js`. Aucune série quotidienne propre à la France n'est disponible sans clé d'API : le pilier quotidien est donc un indicateur de zone euro.

## Données

| Thème | Source | Accès |
|---|---|---|
| Dette, déficit, intérêts, dépenses/recettes, industrie, solde extérieur, fécondité, emploi, chômage | Eurostat | API JSON-stat, sans clé |
| Spread OAT/Bund (taux 10 ans de convergence) | BCE, jeu `IRS` | API SDMX CSV, sans clé |
| PISA, défaillances, ratio cotisants/retraités, logement, aide alimentaire, santé, justice | OCDE, Banque de France, COR, SDES, Drees | valeurs de référence saisies à la main, étiquetées « réf. » |

Les valeurs « réf. » sont des ordres de grandeur à vérifier avant diffusion. Leur automatisation demande une clé Banque de France ou des exports data.gouv.fr.

## Utilisation

```bash
npm run snapshot   # met à jour data/snapshot.json (versionné, sert de repli)
npm run fetch      # données fraîches dans data/live.json (non versionné)
npm run build      # génère dist/index.html
npm test
```

Node 20 ou plus, aucune dépendance npm.

## CI/CD

- **CI** (`ci.yml`) : tests et build sur chaque branche et pull request.
- **Pages** (`pages.yml`) : déploiement à chaque push sur `main` et chaque jour, avec données Eurostat/BCE fraîches. Si les API sont indisponibles, le snapshot versionné est utilisé.
- **Release** (`release.yml`) : un tag `vX.Y.Z` publie une release avec la page HTML autonome et un zip.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Structure

```
src/template.html      page et graphiques SVG
src/index-calc.js      calcul de l'indice composite
scripts/fetch-data.mjs récupération Eurostat + BCE
scripts/build.mjs      injection des données dans la page
data/snapshot.json     dernier jeu de données versionné
test/                  tests node:test
```

## Licence

MIT

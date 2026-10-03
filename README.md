# France — signaux d'alerte structurels

Tableau de bord statique (une seule page HTML, sans dépendance) sur les vulnérabilités structurelles de la France : dette et déficit, charge d'intérêts, spread OAT/Bund, désindustrialisation, démographie, emploi, éducation, logement.

**Démo :** https://rem7474.github.io/france-alert-dashboard/

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
- **Pages** (`pages.yml`) : déploiement à chaque push sur `main` et chaque lundi, avec données Eurostat/BCE fraîches. Si les API sont indisponibles, le snapshot versionné est utilisé.
- **Release** (`release.yml`) : un tag `vX.Y.Z` publie une release avec la page HTML autonome et un zip.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Structure

```
src/template.html      page et graphiques SVG
scripts/fetch-data.mjs récupération Eurostat + BCE
scripts/build.mjs      injection des données dans la page
data/snapshot.json     dernier jeu de données versionné
test/                  tests node:test
```

## Licence

MIT

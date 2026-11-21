# P7 — Conventions et workflow Git

Amont : [outils et environnement](outils-environnement.md), [périmètre et lots](perimetre.md).

## Branches (Gitflow, outil git-flow)

| Branche | Rôle | Créée depuis | Fusionnée dans |
|---|---|---|---|
| `main` | Production : uniquement du code publié et tagué | — | — |
| `develop` | Intégration | `main` | — |
| `feature/usNN-<description>` | Une user story, ex. `feature/us01-numbers-training` | `develop` | `develop` |
| `feature/docs-partie-N` | Livrables d'une partie de conception | `develop` | `develop` |
| `release/X.Y.Z` | Préparation d'une version (une par lot) | `develop` | `main` et `develop` |
| `hotfix/X.Y.Z` | Correctif urgent en production | `main` | `main` et `develop` |

Aucun commit direct sur `main` ni sur `develop`.

## Fusions

- **Vers `develop`** : fusion **en local** avec `git flow feature finish`, puis push de `develop`. Pas de pull request.
- **Vers `main`** : **pull request obligatoire**, jamais de push direct.
  - Release : `git flow release start X.Y.Z`, push de la branche `release/X.Y.Z`, pull request vers `main`. Fusion seulement si la CI est verte, puis tag `vX.Y.Z` sur `main` et report de `main` dans `develop`.
  - Hotfix : même circuit avec `hotfix/X.Y.Z`.
- La branche `main` est **protégée sur GitHub** : push direct interdit, pull request et CI verte exigées. Ce réglage est fait au sprint 0.

Écart au process maison, qui prévoit une fusion par pull request partout : en développement solo, la pull request n'apporte de valeur que vers la production, où elle impose la CI avant la mise en ligne.

## Versions

- **SemVer** : `MAJEUR.MINEUR.CORRECTIF`, tags préfixés `v` (ex. `v0.1.0`).
- **0.0.1** : premier déploiement, vide, du sprint 0 (le socle).
- Une version mineure par lot : 0.1.0 à 0.5.0, puis **1.0.0** au lot 6 ([P2](perimetre.md)). Les hotfix incrémentent le correctif (ex. 0.1.1).

## Commits

- Format **Conventional Commits** : `type(scope): sujet`.
  - Types : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `build`, `ci`, `chore`.
  - Scope : **en anglais**, nom du domaine concerné (ex. `requirements` pour la partie 1, `project` pour la partie 2). Aucun identifiant d'élément (B7, P3…) dans le message.
  - Sujet en anglais, à l'impératif, sans majuscule initiale ni point final.
- **Un fichier modifié = un commit.**
- Tous les commits sont **signés GPG**.
- Pas de ligne `Co-Authored-By`.
- Livrables de conception : commit à la fin de **chaque élément** (P1, P2…), après accord du développeur.

## Conventions de code

- **Langue** : identifiants, commentaires et messages de commit en **anglais**. La documentation `/docs` est en français.
- **Formatage, lint et nommage** : outils choisis avec la pile au benchmark (partie 4, S1), puis appliqués automatiquement par la CI (Q3).
- **Revue de code** : relecture du diff de chaque pull request vers `main` avant fusion.

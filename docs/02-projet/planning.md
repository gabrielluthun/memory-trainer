# P4 — Planning léger

Amont : [périmètre et lots](perimetre.md), [priorisation](priorisation.md), [contraintes](../01-besoin/contraintes.md).

## Principes

- **Jalons sans dates ni estimation** : le temps de développement est très variable et il n'y a pas d'échéance (B4). Le planning fixe seulement l'**ordre** des jalons.
- **Spécification progressive** : les décisions globales (technologie, architecture, sécurité, grandes lignes du modèle de données) sont prises une fois en partie 4 ; le **détail** (maquettes, séquences, tables) est produit pour le lot 1, puis pour chaque lot juste avant son développement.
- **Un lot à la fois** : un lot n'est commencé qu'une fois le précédent recetté et mis en production.
- **Suivi à chaque reprise** : au début de chaque session, relire le [PRD](../PRD.md) puis la check-list, et reprendre au premier élément non coché. Pas d'autre point d'avancement.

## Jalons

| Jalon | Contenu | Validé quand |
|---|---|---|
| J1 | Cadrage et besoin (parties 0 et 1) | Fait le 2026-11-20 |
| J2 | Gestion de projet (partie 2) et PRD | Partie 2 validée |
| J3 | Sécurité, spécifications et qualité **pour le lot 1** (parties 3 à 6 : Q1 et Q3 rédigés) | Parties 3 à 5 validées, Q1 et Q3 rédigés |
| J4 | Sprint 0 : repo, environnement, CI/CD, cadre de tests, base créée depuis le MPD, premier déploiement vide | Déploiement vide de bout en bout réussi |
| J5 | Lot 1 — Socle et Numbers | Recette du lot 1, release **0.1** en production |
| J6 | Lot 2 — Cards, Images, Words | Spécification du lot validée, recette, release **0.2** |
| J7 | Lot 3 — Names, International Names | Spécification du lot validée, recette, release **0.3** |
| J8 | Lot 4 — Statistiques et erreurs | Spécification du lot validée, recette, release **0.4** |
| J9 | Lot 5 — Systèmes d'images | Spécification du lot validée, recette, release **0.5** |
| J10 | Lot 6 — Points IAM | Spécification du lot validée, recette, release **1.0** |
| J11 | Finalisation en production : documentation (Q4) et maintenance (Q5) | Q4 et Q5 validés |

Pour chaque lot de J6 à J10, l'enchaînement est le même : **spécification détaillée du lot** (mises à jour des parties 4 et 5) → validation → user stories → code → tests → recette (Q2) → release.

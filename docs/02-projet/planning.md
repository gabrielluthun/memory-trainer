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
| J5 | Lot 1 — Socle et Numbers | Release **0.1** en production, puis recette du lot 1 réussie |
| J6 | Lot 2 — Cards, Images, Words | Spécification du lot validée, release **0.2**, recette réussie |
| J7 | Lot 3 — Names, International Names | Spécification du lot validée, release **0.3**, recette réussie |
| J8 | Lot 4 — Statistiques et erreurs | Spécification du lot validée, release **0.4**, recette réussie |
| J9 | Lot 5 — Systèmes d'images | Spécification du lot validée, release **0.5**, recette réussie |
| J10 | Lot 6 — Points IAM | Spécification du lot validée, release **1.0**, recette réussie |
| J11 | Finalisation en production : documentation (Q4) et maintenance (Q5) | Q4 et Q5 validés |
| J12 | Lot 7 — Application de bureau (ajouté le 2026-11-20) | Spécification du lot validée, release **1.1**, recette réussie |

Pour chaque lot de J6 à J10, puis J12, l'enchaînement est le même : **spécification détaillée du lot** (mises à jour des parties 4 et 5) → validation → user stories → code → tests → release → [recette](../06-qualite-deploiement/recette.md) en production → lot livré.

> Décision (2026-11-21) : la recette se fait **en production, après la release**. Un défaut trouvé à la recette est corrigé par un hotfix (`X.Y.1`). Ordre modifié pendant la partie 6, partie 2 revalidée sur ce point.

# P1 — Objectifs

Amont : [contexte](../01-besoin/contexte.md), [exigences](../01-besoin/exigences.md).

Le projet est **réussi** si les quatre objectifs ci-dessous sont atteints.

| ID | Objectif | Critère de réussite | Vérifié par |
|---|---|---|---|
| O1 | **Progresser** à l'entraînement aux formats Memory League et IAM. | Les courbes de progression de l'application (EF14) montrent une **tendance à la hausse** dans les disciplines pratiquées. Pas de score cible chiffré. | Les statistiques de l'application elle-même |
| O2 | Faire tourner l'application **en ligne, gratuitement**. | L'application est en production et accessible depuis l'ordinateur, le téléphone et la tablette, avec **0 € de coût** d'hébergement et de services (ENF03, ENF06). | Déploiement en production ; factures des services à 0 € |
| O3 | Fiabiliser les **règles de gestion** par des tests. | Les règles de score, de correction et de points IAM (RG12 à RG17, puis RG26 à RG36 à partir du lot 9) sont **couvertes par des tests automatisés** qui passent dans la CI. | Rapport de tests de la CI |
| O4 | **Suivre le process** de conception jusqu'au bout. | Toutes les parties de la [check-list](../CHECKLIST.md) sont faites et validées, avec les livrables dans `/docs`. | Check-list cochée |

## Non retenus comme objectifs

Ces points ont été proposés et écartés comme critères de réussite :
- **Indicateur d'usage** (nombre d'essais par semaine, outil unique) : pas d'objectif chiffré d'usage.
- **Reprise après une pause** : reste un besoin (B2, contexte C-A de B3), mais pas un critère de réussite du projet.
- **Apprentissage** du développement : reste une opportunité (B4), mais pas un critère de réussite.

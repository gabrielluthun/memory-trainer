# P5 — Risques projet

Amont : [contraintes](../01-besoin/contraintes.md), [périmètre et lots](perimetre.md), [priorisation](priorisation.md), [planning](planning.md).

Échelle : probabilité et impact **faible / moyen / fort**.

| ID | Risque | Probabilité | Impact | Parade |
|---|---|---|---|---|
| R1 | **Abandon ou démotivation** (temps très variable, longues pauses) | Moyenne | Fort | Lots mis en production un par un : l'application est utilisable dès la version 0.1. Reprise guidée : relire le PRD puis la check-list et reprendre au premier élément non coché ([P4](planning.md)). |
| R2 | **Dérive du périmètre** (nouvelles idées en cours de route) | Forte | Moyen | Tout ajout passe par une user story et une priorité MoSCoW ([P3](priorisation.md)). Ce qui est classé Won't reste hors de la v1. Modifier un livrable validé impose de faire revalider la partie concernée. |
| R3 | **Lot 1 trop gros** (hors ligne et synchronisation dès le socle) | Forte | Moyen | US10 et US19 sont reportables ([P3](priorisation.md#cohérence-avec-les-lots)). La solution technique du hors-ligne est choisie au benchmark (partie 4) en tenant compte de sa complexité. |
| R4 | **Limites ou fin d'une offre gratuite** (hébergement, base de données, authentification) | Moyenne | Fort | Le benchmark (partie 4) compare les limites des offres gratuites (S3). Les données restent exportables et sauvegardées (Q5) pour pouvoir changer de service. |
| R5 | **Perte de données** (synchronisation, panne, erreur de migration) | Faible | Fort | Essais immuables (RG18), synchronisation sans perte ni doublon (RG22) couverte par des tests, migrations versionnées, sauvegardes régulières (ENF07, Q5). |
| R6 | **Chronomètre imprécis** sur certains navigateurs ou mobiles | Moyenne | Moyen | Mesure sur une horloge monotone indépendante de l'affichage (ENF01, ENF08) ; tests sur les appareils réels (ordinateur, téléphone, tablette). |
| R7 | **Contenus non libres de droits** (visages IA, images, mots, prénoms) | Moyenne | Moyen | Licence de chaque source vérifiée en partie 3 (A1) avant tout import. |
| R8 | **Évolution des règles Memory League ou des standards IAM** | Moyenne | Faible | Standards IAM stockés en données datées (RG17). Règles de gestion sourcées ([détails](../01-besoin/regles-de-gestion-details.md#sources-et-niveau-de-confiance)) et mises à jour par revalidation de la partie 1. |

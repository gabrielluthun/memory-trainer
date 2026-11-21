# ADR 0019 — Architecture en couches

- Statut : accepté
- Date : 2026-11-20 (fiche rédigée le 2026-11-21, lors de la vérification des ADR en S15)

## Contexte

L'[architecture](../architecture.md) (S2) organise l'application en couches : présentation, application, domaine, infrastructure. Cette organisation a été validée par le développeur au point d'étape S1 à S3, mais elle n'avait pas sa fiche. Elle conditionne le diagramme de classes ([ADR 0013](0013-organisation-code-metier.md)) et la stratégie de tests (O3 : règles de gestion couvertes par des tests automatisés).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Couches** : présentation, application, domaine, infrastructure ; une couche ne dépend que de celles du dessous, le domaine de rien | Règles de gestion testables sans navigateur ni base ; un service externe se remplace sans toucher au métier | Plus de fichiers et de passages entre couches |
| **Par fonctionnalité** : un dossier par écran ou par cas d'usage, sans séparation interne | Tout ce qui concerne un écran au même endroit | Règles métier mêlées à Svelte et à Dexie.js, plus difficiles à tester seules |
| **Logique dans les composants Svelte** | Le moins de code au départ | Règles impossibles à tester sans interface ; difficile à faire évoluer sur 7 lots |

## Décision

**Architecture en couches**, validée par le développeur au point d'étape S1 à S3 :
- **Présentation** : routes SvelteKit et composants Svelte ;
- **Application** : cas d'usage (essai, abandon, synchronisation) ;
- **Domaine** : règles de gestion en TypeScript pur, sans dépendance ;
- **Infrastructure** : Dexie.js, Data API, Hanko, horloges.

L'horloge monotone est injectée dans le domaine, pour mesurer les temps sans dépendre de l'affichage (ENF01, ENF08).

## Conséquences

| Positives | Négatives |
|---|---|
| Les règles RG01 à RG25 se testent en TDD, sans navigateur ni base (O3). | Plus de fichiers dès le lot 1. |
| Changer de service (Hanko, Neon) ne touche que l'infrastructure (R4). | Il faut veiller à ne jamais importer l'infrastructure depuis le domaine : à vérifier par le lint (Q3). |
| Base du diagramme de classes (S6) et des tests par couche (Q1). | — |

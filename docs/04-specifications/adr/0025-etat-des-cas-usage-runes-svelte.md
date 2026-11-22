# ADR 0025 — État des cas d'usage en runes Svelte

- Statut : accepté
- Date : 2026-11-22

## Contexte

Les cas d'usage de la couche Application ([diagramme de classes](../uml/classes.md)) ont un état qui change pendant qu'on les utilise : la phase d'un essai en cours, le temps restant, l'état de la synchronisation. Les écrans Svelte doivent suivre ces changements. Le domaine reste en TypeScript pur, sans dépendance à Svelte ([ADR 0019](0019-architecture-en-couches.md)) ; la question ne concerne que la couche Application.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Runes Svelte** (`$state`, `$derived` dans des fichiers `.svelte.ts`) | Mécanisme natif de Svelte 5 ; très peu de code ; l'écran lit directement les propriétés du cas d'usage | La couche Application dépend du compilateur Svelte ; ses tests passent par lui (déjà le cas avec Vitest et Vite) |
| **Contrat de store** (objet avec `subscribe()` en TypeScript pur) | Couche Application sans aucune dépendance à Svelte ; tests sans compilateur | Un peu plus de code ; deux styles de réactivité dans le projet |

## Décision

**Runes Svelte dans la couche Application.** Choix du développeur. Les cas d'usage qui ont un état visible (`TrialSession`, `SyncService`…) sont écrits dans des fichiers `.svelte.ts` et exposent cet état avec `$state` et `$derived`. Le domaine et l'infrastructure restent en TypeScript pur : la règle des couches d'ESLint continue d'y interdire Svelte.

## Conséquences

| Positives | Négatives |
|---|---|
| Les écrans restent simples : ils lisent l'état, sans abonnement à gérer. | La couche Application ne pourrait pas être réutilisée hors de Svelte sans réécriture. |
| Un seul style de réactivité dans tout le projet. | Les tests de la couche Application doivent être des fichiers `.svelte.test.ts`, compilés par Svelte. |
| Le TDD de la couche Application reste possible avec Vitest, qui utilise déjà la configuration de Vite. | Il faut éviter de mettre de la logique métier dans les runes : elle reste dans le domaine, testé sans Svelte. |

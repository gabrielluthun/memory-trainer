# ADR 0001 — Framework front : Svelte

- Statut : accepté
- Date : 2026-11-20

## Contexte

L'application est une PWA monopage en TypeScript, utilisable hors ligne, sans rendu côté serveur. Elle doit afficher chaque élément d'un essai en moins de 100 ms (ENF08).

## Options envisagées

Svelte (30/35), React (29), Vue (27), Preact (26), Angular (25), Solid (22), Qwik (16). Notes, points forts et points faibles : [benchmark, section 2](../benchmark.md#2-framework-front).

## Décision

**Svelte**, choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Le plus apprécié des grands frameworks (59,4 % d'admiration en 2026). | Écosystème plus petit, et moins de ressources d'aide. |
| Bundle léger et rendu rapide (ENF08). | Changements importants entre versions : il faudra suivre les mises à jour majeures. |
| Peu de code à écrire, utile avec un temps de développement variable (R1). | Les bibliothèques sans adaptateur Svelte devront être intégrées à la main. |

Le choix entre Svelte seul et SvelteKit en mode SPA se fait à l'architecture (S2).

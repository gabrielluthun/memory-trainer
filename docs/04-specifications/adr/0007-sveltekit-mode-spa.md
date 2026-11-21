# ADR 0007 — Structure du front : SvelteKit en mode SPA

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le front est en Svelte ([ADR 0001](0001-framework-front-svelte.md)). C'est une application monopage, hébergée en fichiers statiques ([ADR 0005](0005-hebergement-cloudflare-pages.md)), sans rendu côté serveur. Il lui faut un routeur et une structure de projet.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **SvelteKit en mode SPA** | Framework officiel. Routeur et structure intégrés. Export statique (adapter-static). | Plus de concepts à apprendre (fichiers `+page`, fonctions `load`). Partie serveur désactivée mais présente dans la documentation. Un peu plus de configuration. |
| **Svelte seul + routeur** | Plus simple et plus minimal. | Routeurs communautaires moins maintenus. Structure de projet à inventer. Moins de guides officiels. |

## Décision

**SvelteKit en mode SPA** (rendu côté serveur désactivé, adapter-static avec une page de repli), choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Routeur officiel et maintenu. | Il faut veiller à ne jamais utiliser les fonctions serveur de SvelteKit : il n'y a pas de serveur. |
| Structure de projet standard, documentée. | Concepts propres à SvelteKit à apprendre. |
| Intégration officielle avec vite-plugin-pwa ([ADR 0008](0008-service-worker-vite-plugin-pwa.md)). | — |

# ADR 0021 — Outils de test

- Statut : accepté
- Date : 2026-11-21

## Contexte

La [stratégie de tests](../../06-qualite-deploiement/tests.md) prévoit des tests unitaires et d'intégration (domaine, couche Application, Dexie.js), des tests de la base (intégrité, accès, RLS) et des tests de bout en bout. L'objectif O3 exige que les règles RG12 à RG17 soient testées dans la CI. L'application est faite avec SvelteKit et Vite ([ADR 0001](0001-framework-front-svelte.md), [ADR 0007](0007-sveltekit-mode-spa.md)). Elle doit fonctionner sur iPhone et iPad, donc avec le moteur de Safari. La CI ne doit avoir aucun secret pour les pull requests ([sécurité du back](../../05-securite/back.md)).

## Options envisagées

**Tests unitaires et d'intégration**

| Option | Points forts | Points faibles |
|---|---|---|
| **Vitest** | Intégré à Vite et SvelteKit (même configuration), TypeScript sans réglage, rapide, mode surveillance | Plus jeune que Jest, un peu moins de ressources en ligne |
| **Jest** | Le plus répandu, très documenté | Configuration à part pour TypeScript, les modules ES et Svelte ; plus lent ; double outillage à côté de Vite |

**Tests de bout en bout**

| Option | Points forts | Points faibles |
|---|---|---|
| **Playwright** | Chromium, Firefox et WebKit ; émulation mobile et tactile ; coupure du réseau simulable | WebKit n'est pas le vrai Safari iOS ; navigateurs à télécharger dans la CI |
| **Cypress** | Interface de débogage visuelle | WebKit expérimental, un seul onglet, hors ligne moins direct à simuler |
| **WebdriverIO** | Peut piloter de vrais appareils | Configuration lourde, plus lent |

**Base de données dans la CI**

| Option | Points forts | Points faibles |
|---|---|---|
| **PGlite** | Déjà utilisé pour les 31 cas du [modèle physique](../bdd/mpd.md) et de l'[accès aux données](../acces.md) ; aucun secret, aucun réseau ; rapide | `auth.user_id()` simulée ; ni la vraie Data API ni les jetons Hanko |
| **Conteneur PostgreSQL** | Vrai PostgreSQL, même version que Neon | `auth.user_id()` aussi simulée, démarrage plus lent |
| **Branche Neon de dev** | Vraie Data API, vrais jetons | Secret Neon dans la CI, réveils comptés dans le quota mensuel, données partagées avec le dev |

## Décision

Choix du développeur : **Vitest** pour les tests unitaires, d'intégration et de la base ; **Playwright** pour les tests de bout en bout ; **PGlite** pour la base dans la CI. La branche Neon de dev ne sert qu'aux tests du client de la Data API, sur le poste du développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Un seul outil de tests (Vitest) pour le code et la base, avec la configuration de Vite. | Le comportement réel de la Data API et de `auth.user_id()` n'est testé que sur le poste et à la recette. |
| WebKit et les appareils émulés couvrent une partie des écarts de Safari dès la CI. | Les vrais Safari iOS, la mise en veille et le clavier tactile ne sont vérifiés qu'à la recette en production. |
| Aucun secret dans la CI pour les tests. | PGlite doit suivre la même version majeure de PostgreSQL que Neon. |
| Trois paquets de développement seulement (Vitest, sa mesure de couverture, Playwright), plus PGlite (ES14). | Les navigateurs de Playwright allongent un peu la CI. |

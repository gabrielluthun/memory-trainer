# ADR 0031 — Client de la Data API : @neondatabase/postgrest-js

- Statut : accepté
- Date : 2026-11-24

## Contexte

La synchronisation (CU17, [séquence de synchronisation](../uml/sequences.md)) appelle la Data API de Neon trois fois : `submit_trial` pour envoyer un essai, `save_settings` pour les paramètres, et une lecture des essais par numéro d'ordre, par pages de 50. Chaque requête porte le jeton Hanko ([sécurité du back](../../05-securite/back.md)). La Data API suit les conventions de PostgREST.

Chaque dépendance doit être justifiée (ES14).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **@neondatabase/neon-js** | Paquet principal de Neon ; accepte un jeton externe (`dataApi.getToken`) | Une quinzaine de dépendances inutiles ici : `pg`, `prettier`, un CLI, et le module d'authentification de Neon en bêta |
| **@neondatabase/postgrest-js** | Conseillé par Neon pour un fournisseur de connexion externe ; une seule dépendance (`@supabase/postgrest-js`) ; requêtes typées | Bêta (0.2.0-beta) |
| **@supabase/postgrest-js** | Client de référence de PostgREST, très utilisé | Rien de propre à Neon |
| **fetch maison** | Aucune dépendance | Conventions de PostgREST (filtres, tri, pages) à gérer soi-même |

## Décision

**@neondatabase/postgrest-js.** Choix du développeur, après comparaison des dépendances.

Il est utilisé uniquement dans `DataApiClient` (couche Infrastructure), qui implémente `RemoteStore` ([diagramme de classes](../uml/classes.md)). Le jeton est lu dans la session Hanko à chaque requête.

## Conséquences

| Positives | Négatives |
|---|---|
| Une seule dépendance de plus, et une API de requêtes connue. | Version bêta : une mise à jour peut changer l'API. Elle reste confinée à `DataApiClient`. |
| `DataApiClient` reste court : trois méthodes, chacune testable en simulant les réponses HTTP. | Neon peut faire évoluer ce paquet au rythme de neon-js. Si le paquet est abandonné, on passe à `@supabase/postgrest-js`, dont il dépend, sans toucher au reste du code. |
